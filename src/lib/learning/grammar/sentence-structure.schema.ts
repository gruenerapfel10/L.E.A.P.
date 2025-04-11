import { z } from 'zod';

/**
 * Defines grammatical features that can apply to tokens or constituents.
 * These are often language-specific, so most are optional.
 */
const GrammaticalFeaturesSchema = z.object({
  grammaticalCase: z.string().optional().describe("Grammatical case (e.g., Nominative, Accusative, Dative, Genitive)"),
  gender: z.string().optional().describe("Grammatical gender (e.g., Masculine, Feminine, Neuter)"),
  number: z.string().optional().describe("Grammatical number (e.g., Singular, Plural)"),
  person: z.string().optional().describe("Grammatical person (e.g., First, Second, Third)"),
  tense: z.string().optional().describe("Verb tense (e.g., Present, Past, Future)"),
  mood: z.string().optional().describe("Verb mood (e.g., Indicative, Subjunctive, Imperative)"),
  voice: z.string().optional().describe("Verb voice (e.g., Active, Passive)"),
  aspect: z.string().optional().describe("Verb aspect (e.g., Perfective, Imperfective)"),
  degree: z.string().optional().describe("Adjective/Adverb degree (e.g., Positive, Comparative, Superlative)"),
  // Add other potential features as needed
}).describe("Optional grammatical features associated with a token or constituent.");

/**
 * Represents a single token (word or punctuation) in the sentence.
 */
const TokenSchema = z.object({
  text: z.string().describe("The exact text of the token as it appears in the sentence."),
  lemma: z.string().optional().describe("The base or dictionary form of the word (e.g., 'running' -> 'run')."),
  pos: z.string().describe("Part-of-speech tag (e.g., using Universal Dependencies tags like NOUN, VERB, ADJ, ADP, DET, PUNCT)."),
  features: GrammaticalFeaturesSchema.optional().describe("Grammatical features specific to this token."),
  // index: z.number().int().optional().describe("0-based index of the token in the sentence (optional, might be derivable)")
}).describe("A single word or punctuation mark.");

/**
 * Represents a grammatical constituent (phrase or major component).
 * Constituents within a clause should be sequential and generally non-overlapping.
 */
const SimplifiedConstituentSchema = z.object({
  type: z.string().describe("Type of the constituent (e.g., NP, VP, PP, ADJP, ADVP, S-MAIN, S-SUB). Should represent a distinct phrase."),
  children: z.array(TokenSchema)
            .describe("An ordered list of ALL tokens belonging ONLY to this specific constituent."),
  features: GrammaticalFeaturesSchema.optional().describe("Optional grammatical features applying to the whole constituent."),
  headTokenIndex: z.number().int().optional().describe("Optional: 0-based index of the head token within this constituent's children.")
}).describe("A distinct grammatical phrase or clause component containing its tokens.");

/**
 * Represents a clause (main or subordinate).
 */
const ClauseSchema = z.object({
  type: z.string().describe("Type of the clause (e.g., Main, Subordinate-Relative, Subordinate-Complement)."),
  // Added description about sequence
  constituents: z.array(SimplifiedConstituentSchema).describe("The sequence of major, generally non-overlapping constituents (phrases) making up the clause in order.")
}).describe("A single clause, containing an ordered sequence of its constituent phrases.");

/**
 * The overall schema representing a parsed sentence.
 */
export const SentenceStructureSchema = z.object({
  originalSentence: z.string().describe("The original, correct sentence string provided."),
  clauses: z.array(ClauseSchema).min(1).describe("An array containing one or more clauses that make up the sentence.")
}).describe("Hierarchical grammatical structure of a sentence (simplified constituents). Tokens have features.");

// Exporting the inferred type for usage elsewhere
export type SentenceStructure = z.infer<typeof SentenceStructureSchema>;
export type Clause = z.infer<typeof ClauseSchema>;
export type ConstituentNode = z.infer<typeof SimplifiedConstituentSchema>; // Use simplified schema
export type Token = z.infer<typeof TokenSchema>;
export type GrammaticalFeatures = z.infer<typeof GrammaticalFeaturesSchema>;

// --- Debugging Utility Placeholder ---
// We can introduce a simple logger that checks an env var
// Example (conceptual):
/*
import { isDebugEnabled } from '@/lib/utils/debug'; // Assuming a utility function

if (isDebugEnabled('GRAMMAR_SCHEMA')) {
  console.log("Grammar Schema Definitions Loaded");
  // Potentially log more details about the schema itself if needed
}
*/

console.log("DEBUG: sentence-structure.schema.ts loaded"); // Basic load confirmation 