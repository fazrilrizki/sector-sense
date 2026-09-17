-- ==============================================================================
-- Migration: 20260917000001_initial_schema.sql
-- Description: Initial schema for Sector Sense based on Option A architecture
--              (Consolidates USERS into user_profiles linked directly to auth.users)
-- ==============================================================================

-- 1. Create Custom Enum Types
DO $$ BEGIN
    CREATE TYPE risk_tolerance_type AS ENUM ('CONSERVATIVE', 'MODERATE', 'AGGRESSIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE investment_horizon_type AS ENUM ('SHORT', 'MEDIUM', 'LONG');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE chosen_option_type AS ENUM ('OPTION_A', 'OPTION_B');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Helper function to auto-update 'updated_at' column
CREATE OR REPLACE FUNCTION public.set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Table: user_profiles
-- Extends auth.users (1-to-1) eliminating the duplicate public.USERS table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    risk_tolerance risk_tolerance_type DEFAULT 'MODERATE',
    investment_horizon investment_horizon_type DEFAULT 'MEDIUM',
    base_capital NUMERIC(15, 2) DEFAULT 10000000.00,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for auto-updating updated_at on user_profiles
DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_column();

-- 4. Table: simulations
CREATE TABLE IF NOT EXISTS public.simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_symbol VARCHAR(20) NOT NULL,
    competitor_symbol VARCHAR(20) NOT NULL,
    chosen_option chosen_option_type NOT NULL,
    allocated_capital NUMERIC(15, 2) NOT NULL,
    projected_pnl NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Table: watchlists
CREATE TABLE IF NOT EXISTS public.watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stock_symbol VARCHAR(20) NOT NULL,
    added_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_stock UNIQUE (user_id, stock_symbol)
);

-- 6. Table: model_metrics
CREATE TABLE IF NOT EXISTS public.model_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(100) NOT NULL,
    mape NUMERIC(8, 4) NOT NULL,
    rmse NUMERIC(12, 4) NOT NULL,
    accuracy NUMERIC(8, 4) NOT NULL,
    f1_score NUMERIC(8, 4) NOT NULL,
    evaluated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Automatic User Profile Creation via auth.users Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view own profile"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.user_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Policies for simulations
CREATE POLICY "Users can view own simulations"
    ON public.simulations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own simulations"
    ON public.simulations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own simulations"
    ON public.simulations
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Policies for watchlists
CREATE POLICY "Users can view own watchlists"
    ON public.watchlists
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own watchlists"
    ON public.watchlists
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own watchlists"
    ON public.watchlists
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Policies for model_metrics
-- Model metrics can be read by authenticated users (or public anon read if desired)
CREATE POLICY "Anyone authenticated can view model metrics"
    ON public.model_metrics
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Anon can view model metrics"
    ON public.model_metrics
    FOR SELECT
    TO anon
    USING (true);
-- INSERT, UPDATE, DELETE on model_metrics are restricted to service_role (bypasses RLS by default)
