-- Add subscription-related fields to profiles table
alter table public.profiles
add column if not exists subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'premium')),
add column if not exists subscription_status text default 'inactive' check (subscription_status in ('active', 'inactive', 'past_due', 'canceled')),
add column if not exists subscription_period_start timestamp with time zone,
add column if not exists subscription_period_end timestamp with time zone,
add column if not exists stripe_subscription_id text;

-- Create an index on subscription_tier for faster queries
create index if not exists idx_profiles_subscription_tier on public.profiles(subscription_tier);

-- Create a function to update subscription details
create or replace function public.handle_subscription_updated()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to automatically update the updated_at timestamp when subscription details change
create or replace trigger on_subscription_updated
  before update of subscription_tier, subscription_status, subscription_period_start, subscription_period_end, stripe_subscription_id
  on public.profiles
  for each row execute procedure public.handle_subscription_updated(); 