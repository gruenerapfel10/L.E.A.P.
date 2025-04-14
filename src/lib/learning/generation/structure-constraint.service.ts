import { isDebugMode } from '@/lib/utils/debug';
import { SubmoduleDefinition } from '@/lib/learning/types/index'; // Corrected import path

const DEBUG_CONSTRAINT_SERVICE = isDebugMode('CONSTRAINT_SERVICE');

// Define the detailed output structure for constraints
export interface VocabTypeConstraint {
  pos: string; // Changed from vocab_type to align with DB schema
  count: number; // Desired count
}

export enum SentenceType {
  STATEMENT = 'statement',
  QUESTION_YES_NO = 'question_yes_no',
  QUESTION_WH = 'question_wh',
  COMMAND = 'command',
  EXCLAMATION = 'exclamation',
}

export interface GenerationConstraints {
    targetLanguage: string; 
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    
    // Structure
    numClauses: number;
    numRelativeClauses?: number; // How many should be relative
    sentenceType: SentenceType;

    // POS Counts & Specifics
    posConstraints: VocabTypeConstraint[]; // Use renamed type

    // Optional specific feature requirements 
    requiredFeatures?: { pos: string; features: Record<string, any> }[];

    // Vocabulary
    vocabularyTheme?: string | null; // Specific theme to target
}


interface GetConstraintsInput {
    language: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    submodule: SubmoduleDefinition; 
}

/**
 * Service responsible for determining the *default* desired structure and 
 * vocabulary constraints for generating a sentence.
 * NOTE: This service now primarily provides defaults; forced constraints will come from debug UI.
 */
export class StructureConstraintService {

    /**
     * Determines the *default* constraints based on input criteria.
     */
    getConstraints(input: GetConstraintsInput): GenerationConstraints {
        const { language, difficulty, submodule } = input;
        
        if (DEBUG_CONSTRAINT_SERVICE) {
            console.log(`[Constraint Service Debug] Determining constraints for lang=${language}, difficulty=${difficulty}, submodule=${submodule.id}`);
        }

        // --- Determine Theme (Example Logic) ---
        // TEMPORARY: Setting theme to null to simplify 
        let inferredTheme: string | null = null;
        
        /* ORIGINAL THEME INFERENCE CODE (COMMENTED OUT)
        const contextString = typeof submodule.submoduleContext === 'string' ? submodule.submoduleContext.toLowerCase() : '';
        // Simple keyword check - expand this as needed
        if (contextString.includes('haus') || contextString.includes('wohnung')) {
            inferredTheme = 'Home';
        } else if (contextString.includes('auto') || contextString.includes('fahrrad')) {
            inferredTheme = 'Transportation';
        } else if (contextString.includes('essen') || contextString.includes('trinken') || contextString.includes('restaurant')) {
            inferredTheme = 'Food';
        }
        // Add more else if conditions for other themes...
        
        if (inferredTheme && DEBUG_CONSTRAINT_SERVICE) {
             console.log(`[Constraint Service Debug] Inferred theme: ${inferredTheme}`);
        }
        */

        // --- Default Logic --- 
        const defaultConstraints: GenerationConstraints = {
            targetLanguage: language,
            difficulty: difficulty,
            numClauses: 1,
            numRelativeClauses: 0,
            sentenceType: SentenceType.STATEMENT,
            posConstraints: [],
            vocabularyTheme: inferredTheme, // Use the inferred theme
        };

        // TEMPORARY: Simplified constraints - just request minimal vocabulary
        defaultConstraints.posConstraints = [
            { pos: 'NOUN', count: 1 },
            { pos: 'VERB', count: 1 }
        ];

        /* ORIGINAL CONSTRAINT LOGIC (COMMENTED OUT)
        // Use the new field name 'pos'
        if (submodule.id.startsWith('adjective-declension')) {
            defaultConstraints.posConstraints.push({ pos: 'NOUN', count: 1 });
            defaultConstraints.posConstraints.push({ pos: 'ADJECTIVE', count: 1 });
            defaultConstraints.posConstraints.push({ pos: 'VERB', count: 1 });
            if (!submodule.id.endsWith('ohne-artikel')) {
                 defaultConstraints.posConstraints.push({ pos: 'DETERMINER', count: 1 });
            }
        } else {
             defaultConstraints.posConstraints.push({ pos: 'NOUN', count: 1 });
             defaultConstraints.posConstraints.push({ pos: 'VERB', count: 1 });
        }
        
        // Adjust defaults based on difficulty (example)
        if (difficulty === 'intermediate' || difficulty === 'advanced') {
            defaultConstraints.numClauses = (Math.random() < 0.1) ? 2 : 1; // Rarely 2 clauses
            // Add adverb occasionally
             if (Math.random() < 0.3) defaultConstraints.posConstraints.push({ pos: 'ADVERB', count: 1 }); 
        }
        */
        
        if (DEBUG_CONSTRAINT_SERVICE) {
            console.log(`[Constraint Service Debug] Determined Constraints:`, defaultConstraints);
        }

        return defaultConstraints;
    }
}

// Create a singleton instance
export const structureConstraintService = new StructureConstraintService();
