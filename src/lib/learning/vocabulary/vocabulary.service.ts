import { supabaseAdmin } from '@/lib/supabase/admin';
import { isDebugMode } from '@/lib/utils/debug';

const DEBUG_VOCAB_SERVICE = isDebugMode('VOCAB_SERVICE');

// Define the structure of a vocabulary item (matches the DB table)
// Consider creating a shared types file for DB tables later
export interface VocabularyItem {
    id: number;
    word: string;
    language: string;
    lemma: string | null;
    vocabulary_type: string | null; // Renamed from pos
    features: Record<string, any> | null; // JSONB for grammatical features
    cefr_level: string | null;
    themes: string[] | null;
    frequency?: number;
    definition?: string | null;
    translations?: Record<string, any> | null;
    created_at: string;
    updated_at: string;
}

interface GetVocabularyCriteria {
    language: string;
    count: number;
    types?: string[]; // Renamed from pos
    themes?: string[]; // Array of themes to filter by (match any)
    cefrLevel?: string; // Specific CEFR level
    // Add more filters as needed (e.g., minFrequency)
}

/**
 * Service for interacting with the vocabulary database.
 */
export class VocabularyService {

    /**
     * Fetches random vocabulary items using the get_random_vocabulary_items DB function.
     */
    async getVocabularyItems(criteria: GetVocabularyCriteria): Promise<VocabularyItem[]> {
        if (DEBUG_VOCAB_SERVICE) {
            console.log(`[Vocab Service Debug] Calling RPC get_random_vocabulary_items for lang '${criteria.language}'`, criteria);
        }

        // Use the imported admin client directly
        const rpcParams = {
            p_language: criteria.language,
            p_limit: criteria.count,
            p_types: criteria.types ?? undefined, // Renamed from p_pos
            p_themes: criteria.themes ?? undefined,
            p_cefr_level: criteria.cefrLevel ?? undefined // Match DB function optional param expectation
        };
        
        // Call RPC using the admin client. Let TS infer return type from generated DB types.
        const { data, error } = await supabaseAdmin 
            .rpc(
                'get_random_vocabulary', 
                rpcParams
                // No explicit <..., ReturnType> generic needed here anymore
            );

        if (error) {
            console.error("[Vocab Service] Error calling RPC (admin) get_random_vocabulary:", error);
            return [];
        }

        if (DEBUG_VOCAB_SERVICE) {
            // Let TypeScript infer data type. It should be the array type from the function's RETURNS clause.
            console.log(`[Vocab Service Debug] RPC returned ${data?.length ?? 0} items.`);
        }

        // Return data directly. If there's a mismatch with VocabularyItem used elsewhere,
        // we might need to adjust the VocabularyItem interface or add a mapping step.
        return data || [];
    }
}

// Create a singleton instance
export const vocabularyService = new VocabularyService();

// Basic load confirmation
console.log("DEBUG: vocabulary.service.ts loaded"); 