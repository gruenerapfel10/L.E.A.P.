-- Add language preference fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS native_language text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS target_language text DEFAULT 'de',
ADD COLUMN IF NOT EXISTS ui_language text DEFAULT 'en';

-- Add check constraints to ensure valid languages
ALTER TABLE public.profiles 
ADD CONSTRAINT check_native_language CHECK (native_language IN ('en', 'de', 'es', 'fr', 'it', 'ja', 'pt'));

ALTER TABLE public.profiles 
ADD CONSTRAINT check_target_language CHECK (target_language IN ('en', 'de', 'es', 'fr', 'it', 'ja', 'pt'));

ALTER TABLE public.profiles 
ADD CONSTRAINT check_ui_language CHECK (ui_language IN ('en', 'de', 'es', 'fr', 'it', 'ja', 'pt'));

-- Update the handle_new_user function to include language preferences
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    native_language, 
    target_language, 
    ui_language
  )
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'native_language', 'en'),
    coalesce(new.raw_user_meta_data->>'target_language', 'de'),
    coalesce(new.raw_user_meta_data->>'ui_language', 'en')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_native_language ON public.profiles(native_language);
CREATE INDEX IF NOT EXISTS idx_profiles_target_language ON public.profiles(target_language); 