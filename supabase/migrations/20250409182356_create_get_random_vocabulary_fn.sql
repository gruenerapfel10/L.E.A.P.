-- Rename pos column to vocabulary_type

alter table public.vocabulary
rename column pos to vocabulary_type;

-- We might need to update indexes if they explicitly used the old name
-- Drop old index if it exists (assuming default naming convention)
DROP INDEX IF EXISTS idx_vocabulary_language_pos;

-- Recreate index with the new column name
create index if not exists idx_vocabulary_language_vocabulary_type on public.vocabulary (language, vocabulary_type); 