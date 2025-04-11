import { AIConfig } from '../types'; // Reuse existing AIConfig type

export type InteractionTypeTag = 'reading' | 'writing' | 'listening' | 'speaking';

export interface ModalSchemaDefinition {
  /** Unique identifier for this interaction schema (e.g., "multiple-choice") */
  id: string;
  /** The primary skill this interaction type engages */
  interactionType: InteractionTypeTag;
  /** English title of this interaction type */
  title_en: string;
  /** Translated titles by language code */
  localization: Record<string, { title: string }>;
  /** Default configuration for AI-based question generation */
  generationConfig: AIConfig;
  /** Default configuration for AI-based answer marking */
  markingConfig: AIConfig;
  /** Default React component identifier to render for this interaction */
  uiComponent: string;
} 