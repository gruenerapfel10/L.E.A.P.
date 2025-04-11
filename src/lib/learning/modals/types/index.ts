/**
 * Represents a learning interaction mode (how the user interacts with content)
 * Copied from src/lib/learning/types/index.ts
 */
export type InteractionModal = 'speaking' | 'listening' | 'reading' | 'writing' | string;

/**
 * Configuration for AI question generation or answer marking
 * Copied from src/lib/learning/types/index.ts
 */
export interface AIConfig {
  /** Template for the AI prompt with placeholders like {targetLang}, {sourceLang}, {difficulty} */
  promptTemplate: string;
  /** Stringified Zod schema defining the expected JSON output structure from the AI */
  zodSchema: string;
}


/**
 * Represents the structure of a modal schema definition JSON file.
 * This is the canonical definition for modal schemas.
 */
export interface ModalSchemaDefinition {
  /** Unique identifier for this modal schema (e.g., 'multiple-choice', 'sentence-error-identify') */
  id: string;
  /** English title (optional, mainly for reference) */
  title_en?: string;
  /** Optional grouping identifier for related modals (e.g., 'sentence-error') (for analytics) */
  modalFamily?: string; 
  /** Defines the primary interaction mode */
  interactionType: InteractionModal;
  /** Localized titles/text */
  localization: Record<string, { title: string }>;
  /** Configuration for AI question generation */
  generationConfig: AIConfig;
  /** Configuration for AI answer marking */
  markingConfig: AIConfig;
  /** Identifier for the React component to render (e.g., 'WritingCorrectIncorrectSentence') */
  uiComponent: string;
}

// Basic load confirmation
console.log("DEBUG: modals/types/index.ts loaded"); 