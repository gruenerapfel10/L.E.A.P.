import { z } from 'zod';

export type InteractionTypeTag = 'reading' | 'writing' | 'listening' | 'speaking';

export interface LocalizedContent {
  title: string;
  // Add other localized fields if needed, e.g., description
}

export interface ModalSchemaDefinition {
  /** Unique identifier for this interaction schema (e.g., "multiple-choice") */
  id: string;
  modalFamily?: string;
  /** The primary skill this interaction type engages */
  interactionType: InteractionTypeTag;
  /** English title of this interaction type */
  title_en: string;
  /** Translated titles by language code */
  localization?: Record<string, LocalizedContent>;
  /** Default configuration for AI-based question generation */
  generationConfig: {
    promptTemplate: string;
    // Remove zodSchema string placeholder if present
  };
  /** Default configuration for AI-based answer marking */
  markingConfig: {
    promptTemplate: string;
    zodSchema: string; // Keep zodSchema string for marking for now, might refactor later
  };
  /** Default React component identifier to render for this interaction */
  uiComponent: string;
  generationSchema: z.ZodType<any>;
  markingSchema: z.ZodType<any>;
  getGenerationPrompt: (context: any) => string;
  getMarkingPrompt: (context: any) => string;
}

// --- NEW Interface for TypeScript Modal Definitions ---
export interface ModalGenerationContext {
  targetLanguage: string;
  sourceLanguage: string;
  difficulty: string;
  modulePrimaryTask?: string; 
  submodulePrimaryTask?: string;
  submoduleContext?: string | any;
  vocabulary?: { word: string, // Assuming VocabularyItem structure or similar
                   pos?: string | null,
                   // Add other relevant vocab fields
                 }[]; 
}

export interface ModalMarkingContext {
  questionData: any;
  userAnswer: any;
  // Add other necessary context for marking
  submoduleContext?: string | any;
}

export interface ModalTypeDefinition {
  id: string;
  interactionType: InteractionTypeTag;
  uiComponent: string;
  title_en: string; // Keep for potential fallback/display
  localization?: Record<string, LocalizedContent>; // Keep for UI

  // Schema for AI generation output
  generationSchema: z.ZodType<any, any>;

  // Function to construct the generation prompt
  getGenerationPrompt: (context: ModalGenerationContext) => string;

  // Schema for AI marking output (using Zod object now)
  markingSchema: z.ZodType<any, any>; 

  // Function to construct the marking prompt
  getMarkingPrompt: (context: ModalMarkingContext) => string;

  // Optional: Add modalFamily if needed
  modalFamily?: string;
} 