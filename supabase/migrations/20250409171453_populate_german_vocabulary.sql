-- Insert initial German vocabulary data with grammatical details

INSERT INTO public.vocabulary (word, language, lemma, pos, features, cefr_level, themes, translations, frequency)
VALUES
    -- Nouns
    ('Haus', 'de', 'Haus', 'NOUN', '{"gender": "neuter", "plural": "Häuser"}', 'A1', ARRAY['home', 'building'], '{"en": "house", "es": "casa"}', 100),
    ('Mann', 'de', 'Mann', 'NOUN', '{"gender": "masculine", "plural": "Männer"}', 'A1', ARRAY['people'], '{"en": "man", "es": "hombre"}', 90),
    ('Frau', 'de', 'Frau', 'NOUN', '{"gender": "feminine", "plural": "Frauen"}', 'A1', ARRAY['people'], '{"en": "woman", "es": "mujer"}', 95),
    
    -- Verbs
    ('gehen', 'de', 'gehen', 'VERB', '{"conjugation": "irregular", "auxiliary": "sein"}', 'A1', ARRAY['movement'], '{"en": "to go", "es": "ir"}', 85),
    ('machen', 'de', 'machen', 'VERB', '{"conjugation": "regular", "auxiliary": "haben"}', 'A1', ARRAY['action'], '{"en": "to make/do", "es": "hacer"}', 80),
    ('haben', 'de', 'haben', 'VERB', '{"conjugation": "irregular", "auxiliary": "haben"}', 'A1', ARRAY['possession'], '{"en": "to have", "es": "tener"}', 95),
    
    -- Adjectives
    ('gut', 'de', 'gut', 'ADJ', '{"comparative": "besser", "superlative": "am besten"}', 'A1', ARRAY['quality'], '{"en": "good", "es": "bueno"}', 90),
    ('schön', 'de', 'schön', 'ADJ', '{"comparative": "schöner", "superlative": "am schönsten"}', 'A1', ARRAY['appearance'], '{"en": "beautiful", "es": "hermoso"}', 85),
    
    -- Articles
    ('der', 'de', 'der', 'DET', '{"gender": "masculine", "case": "nominative"}', 'A1', ARRAY['grammar'], '{"en": "the", "es": "el"}', 100),
    ('die', 'de', 'die', 'DET', '{"gender": "feminine", "case": "nominative"}', 'A1', ARRAY['grammar'], '{"en": "the", "es": "la"}', 100),
    ('das', 'de', 'das', 'DET', '{"gender": "neuter", "case": "nominative"}', 'A1', ARRAY['grammar'], '{"en": "the", "es": "lo"}', 100),
    
    -- More advanced vocabulary
    ('Wissenschaft', 'de', 'Wissenschaft', 'NOUN', '{"gender": "feminine", "plural": "Wissenschaften"}', 'B2', ARRAY['academic', 'science'], '{"en": "science", "es": "ciencia"}', 70),
    ('verstehen', 'de', 'verstehen', 'VERB', '{"conjugation": "irregular", "auxiliary": "haben"}', 'B1', ARRAY['cognition'], '{"en": "to understand", "es": "entender"}', 75),
    ('komplex', 'de', 'komplex', 'ADJ', '{"comparative": "komplexer", "superlative": "am komplexesten"}', 'B2', ARRAY['difficulty'], '{"en": "complex", "es": "complejo"}', 65)
ON CONFLICT (word, language) 
DO UPDATE SET
    lemma = EXCLUDED.lemma,
    pos = EXCLUDED.pos,
    features = EXCLUDED.features,
    cefr_level = EXCLUDED.cefr_level,
    themes = EXCLUDED.themes,
    translations = EXCLUDED.translations,
    frequency = EXCLUDED.frequency; 