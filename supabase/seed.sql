-- ==============================================================================
-- Seed Script for Local & CI Environments
-- This script runs automatically on `supabase start` or `supabase db reset`
-- ==============================================================================

-- 1. Create Default Admin/Jury User
-- Email: admin@sectorsense.com
-- Password: password
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'd9990e63-71cc-4d32-ad6b-88b1ab6833b7',
    'authenticated',
    'authenticated',
    'admin@sectorsense.com',
    crypt('password', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Super Admin"}',
    now(),
    now(),
    ''
) ON CONFLICT (id) DO NOTHING;

-- Create identity for the user
INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(),
    'd9990e63-71cc-4d32-ad6b-88b1ab6833b7',
    'd9990e63-71cc-4d32-ad6b-88b1ab6833b7',
    format('{"sub":"%s","email":"%s"}', 'd9990e63-71cc-4d32-ad6b-88b1ab6833b7', 'admin@sectorsense.com')::jsonb,
    'email',
    now(),
    now(),
    now()
) ON CONFLICT DO NOTHING;

-- 2. Update the auto-generated profile with predefined preferences
UPDATE public.user_profiles
SET 
  risk_tolerance = 'AGGRESSIVE',
  investment_horizon = 'LONG',
  base_capital = 1000000000
WHERE id = 'd9990e63-71cc-4d32-ad6b-88b1ab6833b7';
