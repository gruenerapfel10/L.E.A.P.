import { aiService } from '../ai/ai.service';
import { moduleRegistryService } from '../registry/module-registry.service';
import { modalSchemaRegistryService } from '../modals/registry.service';
import { SubmoduleDefinition, SessionEvent, ModuleDefinition } from '../types/index';
import { ModalSchemaDefinition, InteractionTypeTag } from '../modals/types';
import { z } from 'zod'; // Import Zod
import { isDebugMode } from '@/lib/utils/debug'; // Import debug utility

const DEBUG_MARKING = isDebugMode('MARKING');

// Define the expected output structure for AI marking as a Zod schema
const AiMarkingResultSchema = z.object({
  isCorrect: z.boolean().describe("Whether the user's answer was correct."),
  score: z.number().min(0).max(100).describe("A score from 0 to 100."),
  feedback: z.string().describe("Feedback for the user, explaining the result."),
  // Require a string, but instruct AI to return empty string if no correction needed
  correctAnswer: z.string().describe("The correct answer or relevant correct segment if the user was wrong. Return an empty string (\"\") if no specific correction applies (e.g., user was correct or task type is confirm).")
});
export type AiMarkingResult = z.infer<typeof AiMarkingResultSchema>;

interface AiMarkingParams {
  promptTemplate: string;
  markingInput: Record<string, any>; 
  zodSchemaString: string;
}

/**
 * Service responsible for marking user answers using modal schemas.
 */
export class MarkingService {

  constructor() {
    // REMOVED: Initialize calls moved elsewhere
    // moduleRegistryService.initialize().catch(err => console.error("Failed to init ModuleRegistry in Marker", err));
    // modalSchemaRegistryService.initialize().catch(err => console.error("Failed to init ModalSchemaRegistry in Marker", err));
  }

  /**
   * Mark the user's answer based on the submodule and modal schema.
   */
  async markAnswer(
    userId: string,
    sessionId: string,
    submoduleId: string,
    modalSchemaId: string,
    moduleDefinition: ModuleDefinition, // Added type
    submoduleDefinition: SubmoduleDefinition, // Added type
    modalSchemaDefinition: ModalSchemaDefinition, // Added type
    questionData: any, // Keep any for flexibility or define specific question types
    userAnswer: any // Keep any for flexibility or define specific answer types
  ): Promise<AiMarkingResult> {
    
    const markingConfig = submoduleDefinition.overrides?.[modalSchemaId]?.markingPromptOverride
      ? { 
          promptTemplate: submoduleDefinition.overrides[modalSchemaId].markingPromptOverride!, 
          zodSchema: modalSchemaDefinition.markingConfig.zodSchema // Use schema from base modal
        }
      : modalSchemaDefinition.markingConfig;

    if (!markingConfig?.promptTemplate) {
      throw new Error(`Marking configuration or prompt template missing for modal schema ${modalSchemaId}`);
    }

    // Prepare input for the AI prompt
    const markingInput = {
      presentedSentence: questionData?.presentedSentence, // Example, adjust based on actual questionData structure
      correctSentence: questionData?.correctSentence, // Example
      errorsIntroducedJSON: JSON.stringify(questionData?.errorsIntroduced), // Example
      userAnswer: JSON.stringify(userAnswer),
      submoduleContext: submoduleDefinition.submoduleContext,
      // Add other relevant data from questionData, moduleDef, submoduleDef etc.
    };

    if (DEBUG_MARKING) {
        console.log("[Marking Service] Marking Input:", markingInput);
        console.log("[Marking Service] Prompt Template:", markingConfig.promptTemplate);
        console.log("[Marking Service] Zod Schema:", markingConfig.zodSchema);
    }

    try {
      // Revert to using generateStructuredData based on previous code
      const result = await aiService.generateStructuredData(
        markingConfig.promptTemplate, // Assuming this is the compiled prompt string
        AiMarkingResultSchema,      // Pass the Zod schema object
        'AiMarkingResultSchema'       // Pass a name/identifier for the schema
        // TODO: Pass the actual input data (markingInput) if needed by generateStructuredData
      );
      
      if (DEBUG_MARKING) {
        console.log("[Marking Service] Raw AI Result:", result);
      }

      if (!result) {
          throw new Error('AI service returned null mark data.');
      }
      
      // Ensure the result conforms to the schema (already done by aiService, but good practice)
      const parsedResult = AiMarkingResultSchema.parse(result);
      return parsedResult;

    } catch (error) {
       console.error("[Marking Service] AI Marking Error:", error);
       // Consider returning a default error marking result
       return {
         isCorrect: false,
         score: 0,
         feedback: "Error during marking process.",
         correctAnswer: ""
       };
    }
  }
}

// Create a singleton instance
export const markingService = new MarkingService(); 