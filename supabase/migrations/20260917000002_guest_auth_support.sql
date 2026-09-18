-- ==============================================================================
-- Migration: 20260917000002_guest_auth_support.sql
-- Description: Enhances user_profiles and auth triggers to gracefully handle
--              Supabase Anonymous / Guest users and allow smooth account upgrades.
-- ==============================================================================

-- 1. Add is_guest flag to user_profiles if not already present
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'is_guest'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN is_guest BOOLEAN DEFAULT FALSE NOT NULL;
    END IF;
END $$;

-- 2. Update handle_new_user trigger function to identify anonymous users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_anon BOOLEAN;
    user_full_name TEXT;
BEGIN
    -- Detect if user is anonymous (Supabase Auth sets NEW.is_anonymous)
    is_anon := COALESCE(NEW.is_anonymous, FALSE);
    
    IF is_anon THEN
        user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Tamu (Guest)');
    ELSE
        user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
    END IF;

    INSERT INTO public.user_profiles (id, full_name, is_guest)
    VALUES (
        NEW.id,
        user_full_name,
        is_anon
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        is_guest = EXCLUDED.is_guest,
        full_name = CASE 
            WHEN public.user_profiles.is_guest = TRUE AND EXCLUDED.is_guest = FALSE 
            THEN EXCLUDED.full_name 
            ELSE public.user_profiles.full_name 
        END,
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
