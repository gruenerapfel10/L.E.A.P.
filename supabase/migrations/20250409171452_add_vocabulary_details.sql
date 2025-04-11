-- Add missing columns to vocabulary table for grammatical details and themes

-- Add Lemma (base form)
alter table public.vocabulary
add column lemma text null;

-- Add Part of Speech (e.g., NOUN, VERB, ADJ)
alter table public.vocabulary
add column pos text null;

-- Add Grammatical Features (JSONB for flexibility)
alter table public.vocabulary
add column features jsonb null;

-- Add CEFR Level (A1-C2)
alter table public.vocabulary
add column cefr_level character varying(2) null;

-- Add Themes (Array of text tags)
alter table public.vocabulary
add column themes text[] null;

-- Optional: Add indexes for new queryable fields
create index if not exists idx_vocabulary_language_pos on public.vocabulary (language, pos);
create index if not exists idx_vocabulary_language_lemma on public.vocabulary (language, lemma);
create index if not exists idx_vocabulary_themes on public.vocabulary using gin (themes); -- GIN index for array searching

-- Note: Existing RLS policies remain unchanged. 