import { z } from 'zod';
import { SentenceType } from '../generation/structure-constraint.service'; // Assuming path
// import { CorrectIncorrectErrorType } from '../error-generation/correct-incorrect.service'; // REMOVE this import

// Define the ErrorType Enum directly in Zod
const CorrectIncorrectErrorTypeEnum = z.enum([
    'ARTICLE_ENDING', 
    'ADJECTIVE_ENDING', 
    'NOUN_CASE', 
    'VERB_CONJUGATION', 
    'WORD_ORDER'
    // Add more types here if they exist
]);

// Helper schema for Localization (reused)
const LocalizationSchema = z.record(z.string(), z.object({ title: z.string() }));

// Schema for AIConfig (used in ModalSchemaDefinition)
const AIConfigSchema = z.object({
    promptTemplate: z.string(),
    zodSchema: z.string(), // Keep as string as it references schemas not defined here directly
});

// Schema for HelperResource
const HelperResourceSchema = z.object({
    title: z.string(),
    contentType: z.enum(['markdown']).optional(), // Add other types if needed
    content: z.string(),
});

// Schema for SubmoduleModalOverride (used in Module/Submodule definitions)
// Note: Making fields optional as it's used with Partial<> in the main types
const SubmoduleModalOverrideSchema = z.object({
    generationPromptOverride: z.string().optional(),
    markingPromptOverride: z.string().optional(),
    uiComponentOverride: z.string().optional(),
    allowedErrorTypes: z.array(CorrectIncorrectErrorTypeEnum).optional(), // Use the Zod enum
}).partial(); // Ensure it matches Partial usage

// Schema for SubmoduleDefinition
const SubmoduleDefinitionSchema = z.object({
    id: z.string(),
    title_en: z.string(),
    localization: LocalizationSchema,
    supportedModalSchemaIds: z.array(z.string()),
    submoduleContext: z.union([z.string(), z.record(z.any())]).optional(),
    overrides: z.record(z.string(), SubmoduleModalOverrideSchema).optional(), 
    helpers: z.array(HelperResourceSchema).optional(),
});

// Schema for ModuleDefinition
export const ModuleDefinitionSchema = z.object({
    id: z.string(),
    title_en: z.string(),
    supportedSourceLanguages: z.array(z.string()),
    supportedTargetLanguages: z.array(z.string()),
    localization: LocalizationSchema,
    moduleOverrides: z.record(z.string(), SubmoduleModalOverrideSchema).optional(),
    submodules: z.array(SubmoduleDefinitionSchema), // Nested schema
    helpers: z.array(HelperResourceSchema).optional(),
});

// Schema for ModalSchemaDefinition
export const ModalSchemaDefinitionSchema = z.object({
    id: z.string(),
    interactionType: z.string(), // Consider an enum if types are fixed
    title_en: z.string(),
    localization: LocalizationSchema,
    generationConfig: AIConfigSchema,
    markingConfig: AIConfigSchema,
    uiComponent: z.string(),
    modalFamily: z.string().optional(), // Added from types/index.ts review
});

// Type inference (optional but useful)
export type ZodModuleDefinition = z.infer<typeof ModuleDefinitionSchema>;
export type ZodModalSchemaDefinition = z.infer<typeof ModalSchemaDefinitionSchema>;

console.log("DEBUG: Definition Zod Schemas loaded"); 