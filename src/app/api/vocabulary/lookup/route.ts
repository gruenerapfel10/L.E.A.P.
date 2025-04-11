import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Use server client for security
import { aiService } from '@/lib/learning/ai/ai.service'; // Import AI service
import { modalSchemaRegistryService } from '@/lib/learning/modals/registry.service'; // Import schema registry
import { supabaseAdmin } from '@/lib/supabase/admin'; // Import the admin client

// Define the expected structure for vocabulary data
interface VocabData {
  word: string;
  definition?: string | null;
  translations?: Record<string, string> | null;
  frequency?: number | null;
  language: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');
    const lang = searchParams.get('lang');

    if (!word || !lang) {
      return NextResponse.json({ error: 'Word and language parameters are required' }, { status: 400 });
    }

    // Basic sanitization (more robust needed for production)
    const sanitizedWord = word.trim().toLowerCase(); 
    const sanitizedLang = lang.trim().toLowerCase();

    if (!sanitizedWord || sanitizedLang.length !== 2) {
        return NextResponse.json({ error: 'Invalid word or language code format' }, { status: 400 });
    }

    // Use the user's client for the initial SELECT (respects RLS read policy)
    const userSupabase = await createClient(); 

    // 1. Attempt to fetch existing entry using user's client
    const { data: existingData, error: fetchError } = await userSupabase
      .from('vocabulary')
      .select('word, definition, translations, frequency, language')
      .eq('word', sanitizedWord)
      .eq('language', sanitizedLang)
      .maybeSingle();

    if (fetchError) {
      console.error(`DB Error fetching vocab: ${sanitizedWord} (${sanitizedLang})`, fetchError);
      throw fetchError; // Let outer catch handle
    }

    // 2. If found, return it
    if (existingData) {
      console.log(`[Vocab Lookup] Found existing entry for: ${sanitizedWord} (${sanitizedLang})`);
      return NextResponse.json(existingData);
    }

    // 3. If not found, generate using AI
    console.log(`[Vocab Lookup] No entry found. Generating for: ${sanitizedWord} (${sanitizedLang})`);
    await modalSchemaRegistryService.initialize(); // Ensure schema registry is ready
    const vocabSchema = modalSchemaRegistryService.getSchema('vocabulary-entry');
    if (!vocabSchema) {
        throw new Error("Vocabulary generation schema not found.");
    }

    const generationPrompt = vocabSchema.generationConfig.promptTemplate
        .replace('{language}', sanitizedLang)
        .replace('{word}', sanitizedWord);
        
    const generatedData = await aiService.generateStructuredData(
        generationPrompt,
        vocabSchema.generationConfig.zodSchema
    );

    // Validate generated data (basic check)
    if (!generatedData || !generatedData.definition || !generatedData.translations) {
        console.error("AI failed to generate valid vocabulary structure:", generatedData);
        throw new Error("AI failed to generate valid vocabulary structure.");
    }

    // 4. Insert the newly generated entry using ADMIN client
    console.log(`[Vocab Lookup] Inserting generated data using admin client for: ${sanitizedWord} (${sanitizedLang})`);
    let insertedData: VocabData | null = null; 
    try {
        const { data, error: insertError } = await supabaseAdmin 
          .from('vocabulary')
          .insert({
            word: sanitizedWord,
            language: sanitizedLang,
            definition: generatedData.definition,
            translations: generatedData.translations,
            frequency: 0, 
          })
          .select('word, definition, translations, frequency, language')
          .single();

        if (insertError) {
            // Re-throw non-duplicate errors
            if (insertError.code !== '23505') { 
                throw insertError;
            }
            // If it IS a duplicate error (23505), log and proceed to re-fetch
            console.warn(`Race condition detected for: ${sanitizedWord} (${sanitizedLang}). Fetching existing.`);
        } else {
             // If insert was successful, use the returned data
             insertedData = data as VocabData;
        }

    } catch (dbError) {
        // Catch potential errors from the insert/select itself (excluding handled 23505)
        console.error(`DB Error during insert/select vocab: ${sanitizedWord} (${sanitizedLang})`, dbError);
        throw dbError; // Let outer catch handle
    }

    // 5. If insert failed due to race condition (insertedData is null), re-fetch the entry
    if (!insertedData) {
        console.log(`[Vocab Lookup] Re-fetching after race condition for: ${sanitizedWord} (${sanitizedLang})`);
        const { data: refetchedData, error: refetchError } = await userSupabase // Use user client for read
            .from('vocabulary')
            .select('word, definition, translations, frequency, language')
            .eq('word', sanitizedWord)
            .eq('language', sanitizedLang)
            .single(); // Use single, it MUST exist now
        
        if (refetchError || !refetchedData) {
            console.error(`Failed to re-fetch vocab after race condition: ${sanitizedWord} (${sanitizedLang})`, refetchError);
            throw new Error("Failed to retrieve vocabulary entry after race condition.");
        }
        insertedData = refetchedData as VocabData;
        // Return 200 OK since we are returning existing data
        return NextResponse.json(insertedData, { status: 200 }); 
    }

    // 6. If insert was successful, return the newly created data with 201 status
    console.log(`[Vocab Lookup] Successfully generated and inserted: ${sanitizedWord} (${sanitizedLang})`);
    return NextResponse.json(insertedData, { status: 201 });

  } catch (error) {
    console.error('Vocabulary lookup/generation error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 