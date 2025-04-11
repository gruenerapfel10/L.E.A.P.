-- Add subscription-related fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled')),
ADD COLUMN IF NOT EXISTS subscription_period_start timestamptz,
ADD COLUMN IF NOT EXISTS subscription_period_end timestamptz,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Create an index on plan for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);

-- Create a function to update subscription details
CREATE OR REPLACE FUNCTION public.handle_subscription_updated()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically update the updated_at timestamp when subscription details change
CREATE OR REPLACE TRIGGER on_subscription_updated
  BEFORE UPDATE OF plan, subscription_status, subscription_period_start, subscription_period_end, stripe_subscription_id
  ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_subscription_updated(); 