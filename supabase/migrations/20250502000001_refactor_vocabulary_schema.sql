-- Disable Row Level Security temporarily if needed (use with caution)
-- ALTER TABLE public.vocabulary DISABLE ROW LEVEL SECURITY;

-- 1. Create languages table (Optional but recommended)
CREATE TABLE IF NOT EXISTS public.languages (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  script TEXT
);

-- Populate languages table (Add more as needed)
INSERT INTO public.languages (code, name, script) VALUES
  ('en', 'English', 'Latin'),
  ('de', 'Deutsch', 'Latin'),
  ('es', 'Español', 'Latin'),
  ('fr', 'Français', 'Latin'),
  ('it', 'Italiano', 'Latin'),
  ('ja', '日本語', 'Kanji/Kana'),
  ('pt', 'Português', 'Latin')
ON CONFLICT (code) DO NOTHING;

-- 2. Create themes table
CREATE TABLE IF NOT EXISTS public.themes (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- 3. Create vocabulary_entries table
CREATE TABLE IF NOT EXISTS public.vocabulary_entries (
  id BIGSERIAL PRIMARY KEY,
  language_code TEXT NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  word TEXT NOT NULL,
  lemma TEXT NOT NULL,
  pos TEXT NOT NULL, -- Consider using an ENUM or referencing a pos table if needed
  features JSONB NULL,
  definition TEXT NULL,
  cefr_level TEXT NULL, -- Consider constraints like CHECK (cefr_level IN ('A1', 'A2', ...))
  pronunciation_ipa TEXT NULL,
  audio_url TEXT NULL,
  frequency_rank INT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vocabulary_entries_language_lemma_pos_unique UNIQUE (language_code, lemma, pos)
  -- Add more specific unique constraints if needed, e.g., on word+features?
);

-- Create indexes for vocabulary_entries
CREATE INDEX IF NOT EXISTS idx_vocabulary_entries_language_lemma ON public.vocabulary_entries (language_code, lemma);
CREATE INDEX IF NOT EXISTS idx_vocabulary_entries_language_word ON public.vocabulary_entries (language_code, word);
CREATE INDEX IF NOT EXISTS idx_vocabulary_entries_language_pos_cefr ON public.vocabulary_entries (language_code, pos, cefr_level);
CREATE INDEX IF NOT EXISTS idx_vocabulary_entries_features_gin ON public.vocabulary_entries USING GIN (features);

-- 4. Create vocabulary_themes junction table
CREATE TABLE IF NOT EXISTS public.vocabulary_themes (
  vocabulary_entry_id BIGINT NOT NULL REFERENCES public.vocabulary_entries(id) ON DELETE CASCADE,
  theme_id INT NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  PRIMARY KEY (vocabulary_entry_id, theme_id)
);

-- 5. Create translations table
CREATE TABLE IF NOT EXISTS public.translations (
  id BIGSERIAL PRIMARY KEY,
  entry_id_1 BIGINT NOT NULL REFERENCES public.vocabulary_entries(id) ON DELETE CASCADE,
  entry_id_2 BIGINT NOT NULL REFERENCES public.vocabulary_entries(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'direct', -- e.g., direct, idiomatic, contextual
  context_notes TEXT NULL,
  quality_score INT NULL, -- e.g., 1-5
  CONSTRAINT translations_check_different_entries CHECK (entry_id_1 <> entry_id_2)
  -- Consider adding a trigger to ensure entries have different language_codes
);

-- Create indexes for translations
CREATE INDEX IF NOT EXISTS idx_translations_entry_id_1 ON public.translations (entry_id_1);
CREATE INDEX IF NOT EXISTS idx_translations_entry_id_2 ON public.translations (entry_id_2);

-- 6. Create usage_examples table
CREATE TABLE IF NOT EXISTS public.usage_examples (
  id BIGSERIAL PRIMARY KEY,
  vocabulary_entry_id BIGINT NOT NULL REFERENCES public.vocabulary_entries(id) ON DELETE CASCADE,
  sentence TEXT NOT NULL,
  translation_en TEXT NULL,
  source_reference TEXT NULL
);

-- Create index for usage_examples
CREATE INDEX IF NOT EXISTS idx_usage_examples_vocabulary_entry_id ON public.usage_examples (vocabulary_entry_id);

-- 7. Create word_forms table
CREATE TABLE IF NOT EXISTS public.word_forms (
    id BIGSERIAL PRIMARY KEY,
    lemma_entry_id BIGINT NOT NULL REFERENCES public.vocabulary_entries(id) ON DELETE CASCADE,
    form_entry_id BIGINT NOT NULL REFERENCES public.vocabulary_entries(id) ON DELETE CASCADE,
    inflection_description JSONB NULL
);
-- Create indexes for word_forms
CREATE INDEX IF NOT EXISTS idx_word_forms_lemma_entry_id ON public.word_forms (lemma_entry_id);
CREATE INDEX IF NOT EXISTS idx_word_forms_form_entry_id ON public.word_forms (form_entry_id);

-- 8. Migrate Data (Conditional) -- REMOVED as old table is confirmed deleted
-- DO $$
-- BEGIN
    -- IF EXISTS (... old check ...) THEN
        -- ... (removed INSERT statements) ...
    -- ELSE
        -- RAISE NOTICE 'Old vocabulary table not found, skipping data migration.';
    -- END IF;
-- END $$;

-- 9. Update the get_random_vocabulary function
-- Drop the old function signature first if it exists
DROP FUNCTION IF EXISTS public.get_random_vocabulary(TEXT, INTEGER, TEXT[], TEXT, TEXT[]);

-- Recreate the function with the new return type AND corrected logic for theme filtering
CREATE OR REPLACE FUNCTION public.get_random_vocabulary(
    p_language TEXT,
    p_limit INTEGER DEFAULT 10,
    p_pos TEXT[] DEFAULT NULL,
    p_cefr_level TEXT DEFAULT NULL,
    p_themes TEXT[] DEFAULT NULL
)
RETURNS SETOF public.vocabulary_entries -- Return type uses the new table
LANGUAGE sql
STABLE -- Mark as STABLE as it only reads data
AS $$
    SELECT ve.*
    FROM public.vocabulary_entries ve
    -- Optional JOIN for theme filtering only if p_themes is provided
    LEFT JOIN public.vocabulary_themes vt ON p_themes IS NOT NULL AND ve.id = vt.vocabulary_entry_id
    LEFT JOIN public.themes t ON p_themes IS NOT NULL AND vt.theme_id = t.id
    WHERE ve.language_code = p_language
      AND (p_pos IS NULL OR ve.pos = ANY(p_pos))
      AND (p_cefr_level IS NULL OR ve.cefr_level = p_cefr_level)
      -- Apply theme filtering: either no themes requested OR the entry is linked to at least one requested theme
      AND (p_themes IS NULL OR t.name = ANY(p_themes))
    -- Ensure we get distinct entries even if matching multiple themes in the join
    GROUP BY ve.id 
    ORDER BY random()
    LIMIT p_limit;
$$;

-- 10. Drop the old vocabulary table (just in case, IF EXISTS is safe)
DROP TABLE IF EXISTS public.vocabulary;

-- 11. RLS Policies for new table
-- Re-enable Row Level Security if it was disabled
-- ALTER TABLE public.vocabulary_entries ENABLE ROW LEVEL SECURITY; 
-- Define RLS policies for the new tables as needed (similar to old ones)
-- Example: Allow authenticated read
ALTER TABLE public.vocabulary_entries ENABLE ROW LEVEL SECURITY;
-- Ensure policies don't already exist before creating
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.vocabulary_entries;
CREATE POLICY "Allow authenticated read access" ON public.vocabulary_entries
  FOR SELECT
  USING (auth.role() = 'authenticated');
-- Example: Allow admin write (adjust role as needed)
DROP POLICY IF EXISTS "Allow admin all access" ON public.vocabulary_entries;
CREATE POLICY "Allow admin all access" ON public.vocabulary_entries
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
  
-- Add similar RLS policies for other new tables (themes, translations etc.) if required 