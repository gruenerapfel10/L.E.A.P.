import { isDebugMode } from '@/lib/utils/debug';
import { z } from 'zod';
import { aiService } from '../ai/ai.service';
import { vocabularyService } from '../vocabulary/vocabulary.service';
import { ModuleDefinition, SubmoduleDefinition } from '@/lib/learning/types/index';
import { modalSchemaRegistryService } from '../modals/registry.service';
import { ModalTypeDefinition } from '../modals/types';

const DEBUG_GENERATION = isDebugMode('GENERATION');

// Define difficulty levels type
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

// Input parameters for generateQuestion
export interface GenerateQuestionParams {
    moduleId: string;
    submoduleId: string;
    modalSchemaId: string;
    moduleDefinition: ModuleDefinition;
    submoduleDefinition: SubmoduleDefinition;
    targetLanguage: string;
    sourceLanguage: string;
    difficulty: DifficultyLevel;
    userId?: string;
}

// Zod schema for the combined output of generateQuestion
export const GenerationResultOutputSchema = z.object({
  questionData: z.any().describe("The structured data representing the generated question, specific to the modal schema."),
  debugInfo: z.object({
    stage1Prompt: z.string().optional(),
    stage1Result: z.any().optional(),
    stage2Prompt: z.string().optional(),
    stage2Result: z.any().optional(),
    vocabularyUsed: z.array(z.any()).optional(),
  }).optional().describe("Optional debugging information from the multi-stage process.")
});
export type GenerationResult = z.infer<typeof GenerationResultOutputSchema>;

export class QuestionGenerationService {
  constructor() {
    // Initialize the schema registry
    modalSchemaRegistryService.initialize().catch(err => {
      console.error("Failed to initialize ModalSchemaRegistry:", err);
    });
  }

  /**
   * Generate a question based on the module, submodule, and modal schema using a two-stage process.
   */
  async generateQuestion(params: GenerateQuestionParams): Promise<GenerationResult> {
    const {
      moduleId, 
      submoduleId, 
      modalSchemaId, 
      moduleDefinition,
      submoduleDefinition, 
      targetLanguage,
      sourceLanguage,
      difficulty,
    } = params;

    if (DEBUG_GENERATION) console.log(`[Generator Debug] Start Generation: ${moduleId}/${submoduleId}/${modalSchemaId}`);
    
    // Validation: Ensure the passed definitions are valid
    if (!moduleDefinition || !submoduleDefinition) {
      throw new Error(`Invalid definitions passed for ${moduleId}/${submoduleId}`);
    }
    
    // Check if submodule supports the modal schema
    if (!submoduleDefinition.supportedModalSchemaIds?.includes(modalSchemaId)) {
      throw new Error(`Submodule ${submoduleId} does not support modal ${modalSchemaId}`);
    }

    // Get the modal schema definition from the registry
    const modalSchemaDefinition = modalSchemaRegistryService.getSchema(modalSchemaId);
    if (!modalSchemaDefinition) {
      throw new Error(`Modal schema ${modalSchemaId} not found in registry`);
    }

    // --- Resolve Configs --- 
    const submoduleOverride = submoduleDefinition.overrides?.[modalSchemaId];
    const moduleOverride = moduleDefinition.moduleOverrides?.[modalSchemaId];
    
    // Get the schema from the modal definition
    const schemaToUse = modalSchemaDefinition.generationSchema;
    const schemaDescription = `Schema for ${modalSchemaId}`;
    if (DEBUG_GENERATION) console.log(`[Generator Debug] Using schema: ${schemaDescription}`);

    // --- Stage 1: Generate Initial Question --- 
    console.log("\n--- Stage 1: Initial Generation ---");
    const modulePrimaryTask = moduleDefinition.primaryTask || "";
    const submodulePrimaryTask = submoduleDefinition.primaryTask || "";
    
    // Use the modal's getGenerationPrompt function
    const stage1Prompt = modalSchemaDefinition.getGenerationPrompt({
      targetLanguage,
      sourceLanguage,
      difficulty,
      modulePrimaryTask,
      submodulePrimaryTask,
      submoduleContext: submoduleDefinition.submoduleContext
    });
    console.log("Stage 1 Prompt:\n", stage1Prompt);

    let stage1Result: any = null;
    try {
        stage1Result = await aiService.generateStructuredData(stage1Prompt, schemaToUse, schemaDescription);
        console.log("Stage 1 Result:\n", JSON.stringify(stage1Result, null, 2));
        if (!stage1Result) throw new Error("AI returned null during Stage 1.");
    } catch (error) {
        console.error("Error during Stage 1 generation:", error);
        throw new Error(`Failed to generate question data for ${schemaDescription}. Error: ${(error instanceof Error ? error.message : String(error))}`);
    }

    // --- Stage 2: Integrate Vocabulary --- 
    console.log("\n--- Stage 2: Vocabulary Integration ---");
    
    // Fetch random vocabulary
    const vocabLimit = 1;
    const randomVocab = await vocabularyService.getVocabularyItems({ language: targetLanguage, limit: vocabLimit });
    const vocabListString = randomVocab.length > 0 ? randomVocab[0].word : "(no specific word required)";
    
    if (vocabListString === "(no specific word required)") {
        console.log("Skipping Stage 2: No specific vocabulary word to integrate.");
        return { 
            questionData: stage1Result, 
            debugInfo: {
                stage1Prompt,
                stage1Result,
                stage2Prompt: "Skipped",
                stage2Result: stage1Result,
                vocabularyUsed: randomVocab
            }
        };
    }

    const stage2Prompt = `Original Question: ${JSON.stringify(stage1Result)}\nVocabulary Word to Integrate: "${vocabListString}"\n\nTask: Minimally modify the question to naturally incorporate the vocabulary word while maintaining the original structure and learning objectives.\n\nOutput ONLY the updated JSON object.`;

    console.log("Stage 2 Prompt:\n", stage2Prompt);
    
    let finalResult: any = null;
    try {
        finalResult = await aiService.generateStructuredData(stage2Prompt, schemaToUse, `Stage 2 Refinement - ${schemaDescription}`);
        console.log("Stage 2 Result (Final Output):\n", JSON.stringify(finalResult, null, 2));
        if (!finalResult) throw new Error("AI returned null during Stage 2.");
    } catch (error) {
        console.error("Error during Stage 2 generation:", error);
        throw new Error(`Failed to refine question data for ${schemaDescription}. Error: ${(error instanceof Error ? error.message : String(error))}`);
    }

           return {
        questionData: finalResult,
        debugInfo: {
            stage1Prompt,
            stage1Result,
            stage2Prompt,
            stage2Result: finalResult,
            vocabularyUsed: randomVocab
        }
    };
  }
}

export const questionGenerationService = new QuestionGenerationService(); 
