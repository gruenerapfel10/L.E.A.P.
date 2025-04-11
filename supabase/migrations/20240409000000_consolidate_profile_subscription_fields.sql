-- Consolidate Profile and Subscription Fields

-- Drop potentially conflicting older triggers/functions if they exist (optional, adjust if needed)
DROP TRIGGER IF EXISTS on_subscription_updated ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_subscription_updated();

-- Ensure profiles table exists (idempotent)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email text UNIQUE,
    full_name text,
    avatar_url text,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add/Update Stripe and Subscription related columns (idempotent)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status text,
ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_price_id text,
ADD COLUMN IF NOT EXISTS subscription_period_end timestamptz;

-- Remove old columns if they exist (optional cleanup)
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS subscription_tier;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS subscription_period_start;

-- Add Check Constraint for plan
-- Remove existing constraint first to avoid errors if it already exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'pro', 'premium'));

-- Update existing invalid subscription_status values to NULL before applying the new constraint
UPDATE public.profiles
SET subscription_status = NULL
WHERE subscription_status IS NOT NULL 
  AND subscription_status NOT IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid');

-- Add Check Constraint for status
-- Remove existing constraint first to avoid errors if it already exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_status_check CHECK (subscription_status IS NULL OR subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid'));

-- Re-enable Row Level Security if it wasn't already
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Ensure policies exist for users to manage their own profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING ( auth.uid() = id );

-- Ensure the handle_new_user function and trigger exist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, plan)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'free');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Ensure the handle_updated_at function and trigger exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    new.updated_at = timezone('utc'::text, now());
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- (Optional) Index relevant columns for performance
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON public.profiles(stripe_subscription_id); 