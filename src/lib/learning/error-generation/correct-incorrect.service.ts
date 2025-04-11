import { SentenceStructure, ConstituentNode, Token, GrammaticalFeatures, Clause } from '../grammar/sentence-structure.schema';
import { isDebugMode } from '@/lib/utils/debug';
import { shuffleArray } from '../../utils/random'; // Use relative path
import { aiService } from '../ai/ai.service'; // Import AI service
import { z } from 'zod'; // Import Zod for defining AI output schema

const DEBUG_ERROR_GENERATION = isDebugMode('ERROR_GENERATION');

/**
 * Defines the types of errors that can be introduced for the correct-incorrect modal.
 * These should align with the definitions in submodule configurations.
 */
export type CorrectIncorrectErrorType = 
    | 'ARTICLE_ENDING' 
    | 'ADJECTIVE_ENDING' 
    | 'NOUN_CASE' 
    | 'VERB_CONJUGATION' 
    | 'WORD_ORDER'
    // Add more specific error types as needed
    ;

/**
 * Input parameters for the error generation algorithm.
 */
interface GenerateErrorsInput {
    sentenceStructure: SentenceStructure;
    allowedErrorTypes: CorrectIncorrectErrorType[];
    maxErrors: number; // Maximum number of errors to introduce
    language: string; // Language code (e.g., 'de') for language-specific rules
}

/**
 * Output of the error generation algorithm.
 */
interface GenerateErrorsOutput {
    modifiedStructure: SentenceStructure; // The structure with errors introduced
    presentedSentence: string; // The sentence string reconstructed from the modified structure
    errorsIntroduced: { 
        type: CorrectIncorrectErrorType;
        originalToken: Token | null; // The token that was modified (or context if word order)
        modifiedToken?: Token; // The resulting token after modification
        originalText: string; // Original segment text
        modifiedText: string; // Modified segment text
    }[]; // Details about the specific errors made
}

/**
 * Context gathered during traversal for a potential error location.
 */
export interface ErrorLocationContext {
    parentConstituent?: ConstituentNode;
    precedingToken?: Token;
    governingNoun?: Token;
    // Add more context as needed
}

/**
 * Represents a potential location in the structure where an error could be introduced.
 */
interface PotentialErrorLocation {
    type: CorrectIncorrectErrorType;
    token: Token;
    context: ErrorLocationContext;
}

/**
 * Service responsible for programmatically introducing grammatical errors 
 * into a correct sentence structure for the 'correct-incorrect-sentence' modal.
 * Uses AI to generate plausible incorrect forms.
 */
export class CorrectIncorrectErrorService {

    /**
     * Applies specified error types to a sentence structure.
     */
    async generateErrors(input: GenerateErrorsInput): Promise<GenerateErrorsOutput> {
        const { sentenceStructure, allowedErrorTypes, maxErrors, language } = input;
        
        if (DEBUG_ERROR_GENERATION) {
            console.log(`[Error Service Debug] Starting error generation for sentence: "${sentenceStructure.originalSentence}"`);
            console.log(`[Error Service Debug] Allowed errors: ${allowedErrorTypes.join(', ')}, Max errors: ${maxErrors}, Language: ${language}`);
        }

        // 1. Deep clone the input sentenceStructure to avoid modifying the original.
        let modifiedStructure = JSON.parse(JSON.stringify(sentenceStructure)) as SentenceStructure;
        const errorsIntroduced: GenerateErrorsOutput['errorsIntroduced'] = [];
        let errorsMade = 0;

        // 2. Identify all potential locations for each allowedErrorType.
        const potentialLocations: PotentialErrorLocation[] = this.findPotentialErrorLocations(modifiedStructure, allowedErrorTypes);

        if (DEBUG_ERROR_GENERATION) {
            console.log(`[Error Service Debug] Identified ${potentialLocations.length} potential error locations:`, potentialLocations.map(loc => `${loc.type} @ ${loc.token.text}`));
        }

        // 3. Shuffle potential locations randomly.
        shuffleArray(potentialLocations);

        // 4. Iterate through shuffled locations and apply errors up to maxErrors.
        for (const location of potentialLocations) {
            if (errorsMade >= maxErrors) break;

            // Pass the whole structure for context if needed by AI
            const errorDetail = await this.applySingleErrorAI(modifiedStructure, location, language);
            
            if (errorDetail) {
                 errorsIntroduced.push(errorDetail);
                 errorsMade++;
                 if (DEBUG_ERROR_GENERATION) {
                    console.log(`[Error Service Debug] Introduced error: ${errorDetail.type} - '${errorDetail.originalText}' -> '${errorDetail.modifiedText}'`);
                 }
            } else {
                 if (DEBUG_ERROR_GENERATION) {
                    console.log(`[Error Service Debug] Could not apply AI error of type ${location.type} at token '${location.token.text}'`);
                 }
            }
        }

        if (DEBUG_ERROR_GENERATION) {
            console.log(`[Error Service Debug] Introduced ${errorsMade} errors total.`);
        }

        // 5. Reconstruct the `presentedSentence` string from the `modifiedStructure`.
        const presentedSentence = this.reconstructSentenceString(modifiedStructure);

        // 6. Return the result.
        return {
            modifiedStructure,
            presentedSentence,
            errorsIntroduced,
        };
    }

    /**
     * Traverses the sentence structure to find potential locations for errors and gather context.
     */
    private findPotentialErrorLocations(structure: SentenceStructure, allowedTypes: CorrectIncorrectErrorType[]): PotentialErrorLocation[] {
        const locations: PotentialErrorLocation[] = [];
        const allowedSet = new Set(allowedTypes);

        const traverse = (node: ConstituentNode | Token, context: ErrorLocationContext, siblings: (ConstituentNode | Token)[], index: number) => {
            if ('text' in node) { // It's a Token
                const token = node;
                const currentContext = { 
                    ...context, 
                    precedingToken: index > 0 && 'text' in siblings[index-1] ? siblings[index-1] as Token : undefined
                };

                // Identify potential error location based on POS tag
                if (allowedSet.has('ADJECTIVE_ENDING') && token.pos === 'ADJ') {
                    // Try to find the governing noun within the same constituent (simplistic)
                    currentContext.governingNoun = siblings.find(sib => 'pos' in sib && sib.pos === 'NOUN') as Token | undefined;
                    locations.push({ type: 'ADJECTIVE_ENDING', token: token, context: currentContext });
                }
                if (allowedSet.has('ARTICLE_ENDING') && token.pos === 'DET') {
                    // Try to find the following noun (simplistic)
                     currentContext.governingNoun = siblings.find((sib, i) => i > index && 'pos' in sib && sib.pos === 'NOUN') as Token | undefined;
                     locations.push({ type: 'ARTICLE_ENDING', token: token, context: currentContext });
                }
                 if (allowedSet.has('NOUN_CASE') && token.pos === 'NOUN') {
                    locations.push({ type: 'NOUN_CASE', token: token, context: currentContext });
                 }
                 if (allowedSet.has('VERB_CONJUGATION') && (token.pos === 'VERB' || token.pos === 'AUX')) {
                      locations.push({ type: 'VERB_CONJUGATION', token: token, context: currentContext });
                 }
                 
            } else { // It's a ConstituentNode
                const constituent = node;
                const parentContext = { ...context, parentConstituent: constituent };
                for (let i = 0; i < constituent.children.length; i++) {
                    traverse(constituent.children[i], parentContext, constituent.children, i);
                }
            }
        };

        for (const clause of structure.clauses) {
            for (const constituent of clause.constituents) {
                // Initial context for top-level constituents in a clause
                traverse(constituent, {}, clause.constituents, clause.constituents.indexOf(constituent));
            }
        }
        return locations;
    }

    /**
     * Uses AI to apply a single error based on the location type and language.
     * Modifies the structure **in place**.
     */
    private async applySingleErrorAI(structure: SentenceStructure, location: PotentialErrorLocation, language: string): Promise<GenerateErrorsOutput['errorsIntroduced'][0] | null> {
        const { type, token, context } = location;
        const originalText = token.text;

        // Define the schema expected from the AI for the incorrect word
        const IncorrectWordSchema = z.object({
            incorrectWord: z.string().describe("A grammatically incorrect but plausible version of the target word, suitable for the error type.")
        });

        // Construct a prompt for the AI
        const prompt = this.constructAIPromptForError(type, token, context, language, structure);
        if (!prompt) return null; // Cannot generate prompt

        if (DEBUG_ERROR_GENERATION) {
            console.log(`[Error Service Debug/AI] Prompting AI for incorrect form of '${originalText}' (Type: ${type}). Prompt: ${prompt.substring(0,150)}...`);
        }

        // Call AI service
        const aiResult = await aiService.generateStructuredData(prompt, IncorrectWordSchema, `IncorrectWordSchema for ${type}`);

        if (aiResult && aiResult.incorrectWord) {
            const modifiedText = aiResult.incorrectWord;
            if (modifiedText.trim() !== originalText.trim()) { // Check if actually different
                const originalTokenState = { ...token };
                token.text = modifiedText;
                if (DEBUG_ERROR_GENERATION) {
                    console.log(`[Error Service Debug/AI] Received incorrect form: '${modifiedText}'`);
                }
                return {
                    type: type,
                    originalToken: originalTokenState,
                    modifiedToken: token,
                    originalText: originalText,
                    modifiedText: modifiedText,
                };
            } else {
                 if (DEBUG_ERROR_GENERATION) {
                    console.log(`[Error Service Debug/AI] AI returned the same word: '${modifiedText}'`);
                }
            }
        } else {
            if (DEBUG_ERROR_GENERATION) {
                console.log(`[Error Service Debug/AI] AI failed to generate incorrect word for '${originalText}'. Result:`, aiResult);
            }
        }

        return null; // AI failed or returned same word
    }

    /**
     * Constructs the prompt for the AI to generate an incorrect word form.
     */
    private constructAIPromptForError(type: CorrectIncorrectErrorType, token: Token, context: ErrorLocationContext, language: string, structure: SentenceStructure): string | null {
        const fullSentence = structure.originalSentence; 
        const targetWord = token.text;
        let instruction = "";
        let errorHint = "";

        switch (type) {
            case 'ADJECTIVE_ENDING':
                errorHint = "The error should specifically be in the adjective ending, reflecting a common mistake in declension (e.g., using the wrong case, gender, or number ending, or confusing strong/weak/mixed declension).";
                instruction = `Generate a single, grammatically INCORRECT but plausible ${language} form for the adjective \"${targetWord}\" as it appears in the sentence: \"${fullSentence}\". ${errorHint}`;
                break;
            case 'ARTICLE_ENDING': 
                errorHint = "The error should be in the article/determiner form, reflecting a common mistake with case, gender, or number.";
                instruction = `Generate a single, grammatically INCORRECT but plausible ${language} form for the article/determiner \"${targetWord}\" as it appears in the sentence: \"${fullSentence}\". ${errorHint}`;
                break;
            // TODO: Add cases for NOUN_CASE, VERB_CONJUGATION with specific error hints
            default:
                console.warn(`Cannot construct AI prompt for unsupported error type: ${type}`);
                return null;
        }

        // Added explicit output instruction
        return `${instruction} Ensure the generated word is genuinely incorrect for this specific context. Output ONLY the single incorrect word form.`;
    }

    /**
     * Reconstructs the sentence string from the structure with better spacing.
     */
    private reconstructSentenceString(structure: SentenceStructure): string {
        let sentenceParts: string[] = [];
        
        function findAllTokens(node: ConstituentNode | Token | Clause): Token[] {
            if ('text' in node && node.pos) { return [node]; } 
            if ('constituents' in node) { 
                return node.constituents.flatMap((c: ConstituentNode) => findAllTokens(c));
            }
            if ('children' in node) { 
                 return node.children.flatMap((t: Token) => findAllTokens(t)); 
            }
            return [];
        }

        const allTokens = structure.clauses.flatMap(clause => findAllTokens(clause));
        if (DEBUG_ERROR_GENERATION) {
             console.log("[Error Service Debug/Reconstruct] Flattened Tokens:", allTokens.map(t => t.text));
        }

        for (let i = 0; i < allTokens.length; i++) {
            const currentTokenText = allTokens[i].text;
            const nextTokenText = (i + 1 < allTokens.length) ? allTokens[i+1].text : null;

            sentenceParts.push(currentTokenText);

            // Add a space if:
            // - Not the last token
            // - The next token is NOT punctuation (or other non-spacing chars)
            if (nextTokenText && !/^[.,!?;:]/.test(nextTokenText)) {
                 sentenceParts.push(' ');
            }
        }
        
        const reconstructed = sentenceParts.join('').trim();
        if (DEBUG_ERROR_GENERATION) {
             console.log("[Error Service Debug/Reconstruct] Reconstructed Sentence:", reconstructed);
        }
        return reconstructed;
    }
}

// Create a singleton instance
export const correctIncorrectErrorService = new CorrectIncorrectErrorService();

// Basic load confirmation
console.log("DEBUG: correct-incorrect.service.ts loaded (AI-based errors)"); 