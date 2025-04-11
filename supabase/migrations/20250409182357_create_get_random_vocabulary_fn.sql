-- Drop the function first if it exists (idempotency)
DROP FUNCTION IF EXISTS public.get_random_vocabulary(text, integer, text[], text, text[]);

-- Create function to get random vocabulary words with filtering options
CREATE OR REPLACE FUNCTION public.get_random_vocabulary(
    p_language text,
    p_limit integer DEFAULT 10,
    p_types text[] DEFAULT NULL, -- Renamed from p_pos
    p_cefr_level text DEFAULT NULL, 
    p_themes text[] DEFAULT NULL
)
RETURNS TABLE (
    id bigint, 
    word text,
    language character(2), 
    lemma text,
    vocabulary_type text, -- Renamed from pos
    features jsonb,
    cefr_level character varying(2), 
    themes text[],
    translations jsonb,
    frequency integer,
    created_at timestamptz, 
    updated_at timestamptz  
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.word,
        v.language,
        v.lemma,
        v.vocabulary_type, -- Renamed from v.pos
        v.features,
        v.cefr_level,
        v.themes,
        v.translations,
        v.frequency,
        v.created_at,
        v.updated_at
    FROM 
        public.vocabulary v
    WHERE 
        v.language = p_language
        AND (p_types IS NULL OR v.vocabulary_type = ANY(p_types)) -- Renamed from p_pos/v.pos
        AND (p_cefr_level IS NULL OR v.cefr_level = p_cefr_level) 
        AND (p_themes IS NULL OR v.themes && p_themes)
    ORDER BY 
        random()
    LIMIT 
        p_limit;
END;
$$;

-- Update grant signature to match modified parameters
-- Drop old grants first (using old signature if needed, then corrected one)
REVOKE EXECUTE ON FUNCTION public.get_random_vocabulary(text, integer, text[], text, text[]) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_random_vocabulary(text, integer, text[], text, text[]) FROM service_role;

-- Grant using the new parameter list (p_types instead of p_pos)
GRANT EXECUTE ON FUNCTION public.get_random_vocabulary(text, integer, text[], text, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_random_vocabulary(text, integer, text[], text, text[]) TO service_role; 