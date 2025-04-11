import { Database } from '@/types/supabase'; // Corrected path for supabase types
import { z } from 'zod';
import { CorrectIncorrectErrorType } from '../error-generation/correct-incorrect.service'; // Import the error type

/**
 * Core type definitions for the Universal Module System (UMS)
 */

/**
 * Represents a learning interaction mode (how the user interacts with content)
 */
export type InteractionModal = 'speaking' | 'listening' | 'reading' | 'writing' | string;

/**
 * Configuration for AI question generation or answer marking
 */
export interface AIConfig {
  /** Template for the AI prompt with placeholders like {targetLang}, {sourceLang}, {difficulty} */
  promptTemplate: string;
  /** Stringified Zod schema defining the expected JSON output structure from the AI */
  zodSchema: string;
}

/**
 * Defines a specific UI presentation for a submodule + modal combination
 */
export interface UIFlavour {
  /** Unique identifier for this UI variation */
  id: string;
  /** The interaction modal this flavour belongs to */
  modal: InteractionModal;
  /** React component identifier to render for this flavour */
  uiComponent: string;
  /** Optional override for the AI prompt template specific to this flavour */
  generationPromptOverride?: string;
  /** Optional override for the marking prompt template specific to this flavour */
  markingPromptOverride?: string;
}

/**
 * Optional overrides for a specific modal schema within a submodule context
 */
export interface SubmoduleModalOverride {
  /** Override the default prompt template for question generation */
  generationPromptOverride?: string;
  /** Override the default prompt template for answer marking */
  markingPromptOverride?: string;
  /** Override the UI component used for this specific submodule/modal combination */
  uiComponentOverride?: string;
  /** Specify allowed error types for error generation modals */
  allowedErrorTypes?: CorrectIncorrectErrorType[]; 
}

/**
 * Represents a single help resource associated with a submodule.
 */
export interface HelperResource {
  title: string; // Title displayed for the resource (e.g., "Declension Table")
  content: string; // The actual help content, likely Markdown
  contentType?: 'markdown' | string; // Type of content, defaults to markdown
}

/**
 * Represents a specific aspect or variation within a module
 */
export interface SubmoduleDefinition {
  /** Unique identifier within the parent module */
  id: string;
  /** English title of this submodule */
  title_en: string;
  /** Translated titles and other text by language code */
  localization: Record<string, { title: string }>;
  /** IDs of the global modal schemas this submodule supports */
  supportedModalSchemaIds: string[];
  /** Optional context specific to this submodule to pass to AI prompts */
  submoduleContext?: string | Record<string, any>; // Added for passing context
  /** 
   * Optional overrides for specific modal schemas within this submodule. 
   * These take precedence over module-level overrides.
   */
  overrides?: Record<string, Partial<SubmoduleModalOverride>>; // Use Partial<> 
  /** Optional array of help resources for this submodule */
  helpers?: HelperResource[];
}

/**
 * Represents a top-level learning topic
 */
export interface ModuleDefinition {
  /** Unique identifier for this module */
  id: string;
  /** English title of the module */
  title_en: string;
  /** Languages where this module's concept is relevant */
  supportedSourceLanguages: string[];
  /** Languages this specific module definition provides content/logic for */
  supportedTargetLanguages: string[];
  /** Translated titles and other text by language code */
  localization: Record<string, { title: string }>;
  /** 
   * Optional overrides for specific modal schemas applicable to ALL submodules 
   * within this module definition. Submodule overrides take precedence.
   */
  moduleOverrides?: Record<string, Partial<SubmoduleModalOverride>>; // Add module-level overrides
  /** The specific aspects or variations within this module */
  submodules: SubmoduleDefinition[];
  /** Optional array of help resources for this module */
  helpers?: HelperResource[];
}

/**
 * Example Zod schemas for AI input/output validation
 */

/**
 * Schema for multiple-choice question generation
 */
export const multipleChoiceQuestionSchema = z.object({
  question: z.string().min(10),
  options: z.array(z.string()).min(2).max(5),
  correctOptionIndex: z.number().int().min(0),
  explanation: z.string().optional(),
});

/**
 * Schema for fill-in-gap question generation
 */
export const fillInGapQuestionSchema = z.object({
  sentence: z.string().min(10),
  gapWord: z.string().min(1),
  hint: z.string().optional(),
});

/**
 * Schema for marking results
 */
export const markingResultSchema = z.object({
  isCorrect: z.boolean(),
  score: z.number().min(0).max(100),
  feedback: z.string(),
  correctAnswer: z.string().optional(),
});

/**
 * Statistics-related types
 */

/**
 * Represents a user session event (a single question+answer interaction)
 */
export interface SessionEvent {
  submoduleId: string;
  modalSchemaId: string;
  questionData: any;
  userAnswer: any;
  markingResult: any;
  isCorrect?: boolean;
  timestamp: Date;
}

/**
 * Represents an active learning session
 */
export interface LearningSession {
  id: string;
  userId: string;
  moduleId: string;
  targetLanguage: string;
  sourceLanguage: string;
  startTime: Date;
  endTime?: Date;
  events: SessionEvent[];
}

// --- Example Zod Schemas (for use within AIConfig.zodSchema as strings) ---

// Example schema for a multiple-choice question generation
export const MultipleChoiceQuestionSchema = z.object({
  questionText: z.string().describe("The main text of the question presented to the user."),
  options: z.array(z.object({
    id: z.string().describe("Unique identifier for the option (e.g., 'a', 'b', 'c')."),
    text: z.string().describe("The text content of the choice."),
  })).min(2).describe("An array of possible answers."),
  correctOptionId: z.string().describe("The 'id' of the correct option."),
  explanation: z.string().optional().describe("An optional brief explanation of why the correct answer is right."),
});

// Example schema for marking a multiple-choice answer
export const MultipleChoiceMarkingSchema = z.object({
  isCorrect: z.boolean().describe("Whether the user's selected answer was correct."),
  feedback: z.string().describe("Feedback for the user, explaining the result."),
  correctAnswer: z.string().optional().describe("The text of the correct answer, if the user was wrong."),
});

// Example schema for a fill-in-the-gap question generation
export const FillInGapQuestionSchema = z.object({
  sentenceTemplate: z.string().describe("The sentence with a placeholder (e.g., '___') for the user to fill in."),
  correctAnswer: z.string().describe("The word or phrase that correctly fills the gap."),
  acceptedAnswers: z.array(z.string()).optional().describe("Optional list of other acceptable answers."),
  explanation: z.string().optional().describe("An optional brief explanation related to the grammar point."),
});

// Example schema for marking a fill-in-the-gap answer
export const FillInGapMarkingSchema = z.object({
  isCorrect: z.boolean().describe("Whether the user's answer is considered correct (matches correctAnswer or acceptedAnswers)."),
  feedback: z.string().describe("Feedback for the user."),
  correctAnswer: z.string().optional().describe("The primary correct answer, shown if the user was wrong."),
});

// Note: You would stringify these Zod schemas when putting them into the AIConfig.
// Example: JSON.stringify(MultipleChoiceQuestionSchema.shape) - needs careful handling of descriptions etc.
// Or more simply, define the schema structure directly as a string within the module definition.
// Using libraries like zod-to-json-schema might be helpful if generating schemas dynamically. 