import { aiService } from '../ai/ai.service';
import { moduleRegistryService } from '../registry/module-registry.service';
import { modalSchemaRegistryService } from '../modals/registry.service';
import { ModuleDefinition, SubmoduleDefinition } from '../types/index';
import { ModalTypeDefinition, ModalMarkingContext } from '../modals/types';
import { z } from 'zod'; // Import Zod
import { isDebugMode } from '@/lib/utils/debug'; // Import debug utility

const DEBUG_MARKING = isDebugMode('MARKING');

// --- Define the standard marking output structure HERE --- 
const AiMarkingResultSchema = z.object({
  isCorrect: z.boolean().describe("Whether the user's answer was correct."),
  score: z.number().min(0).max(100).describe("A score from 0 to 100."),
  feedback: z.string().describe("Feedback for the user, explaining the result."),
  correctAnswer: z.string().describe("The correct answer or relevant correct segment if the user was wrong. Return an empty string (\"\") if no specific correction applies (e.g., user was correct or task type is confirm).")
});
export type AiMarkingResult = z.infer<typeof AiMarkingResultSchema>;
// -------------------------------------------------------

// --- Define Interface for markAnswer parameters --- 
interface MarkAnswerParams {
  userId: string;
  sessionId: string;
  moduleId: string;
  submoduleId: string;
  modalSchemaId: string;
  moduleDefinition: ModuleDefinition;
  submoduleDefinition: SubmoduleDefinition;
  modalSchemaDefinition: ModalTypeDefinition;
  questionData: any;
  userAnswer: any;
  targetLanguage: string;
  sourceLanguage: string;
  difficulty: string;
}
// ----------------------------------------------

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
  async markAnswer(params: MarkAnswerParams): Promise<AiMarkingResult> {
    const {
      userId,
      sessionId,
      moduleId,
      submoduleId,
      modalSchemaId,
      moduleDefinition,
      submoduleDefinition,
      modalSchemaDefinition,
      questionData,
      userAnswer,
      targetLanguage,
      sourceLanguage,
      difficulty
    } = params;
    
    // --- Use the new ModalTypeDefinition structure --- 
    if (!modalSchemaDefinition || !modalSchemaDefinition.getMarkingPrompt || !modalSchemaDefinition.markingSchema) {
        throw new Error(`Marking configuration (getMarkingPrompt or markingSchema) missing for modal schema ${modalSchemaId}`);
    }

    // Prepare input context for the marking prompt function
    const markingContext: ModalMarkingContext = {
        questionData: questionData,
        userAnswer: userAnswer,
        submoduleContext: submoduleDefinition?.submoduleContext, // Pass context if available
        // Add any other fields needed by getMarkingPrompt implementations
    };

    // Generate the prompt using the modal's specific function
    const compiledPrompt = modalSchemaDefinition.getMarkingPrompt(markingContext);
    
    // Specific logging for listening-transcribe prompt
    if (modalSchemaId === 'listening-transcribe') {
        console.log("\n--- [ListenTranscribe Marking Log] ---");
        console.log("Modal ID:", modalSchemaId);
        console.log("Full Marking Prompt Sent:");
        console.log(compiledPrompt);
        console.log("-------------------------------------\n");
    }

    // Get the Zod schema for the expected marking result
    const expectedSchema = modalSchemaDefinition.markingSchema;
    // -------------------------------------------------

    if (DEBUG_MARKING) {
        console.log("[Marking Service] Marking Context:", markingContext);
        console.log("[Marking Service] COMPILED Prompt:", compiledPrompt.substring(0,500) + "...");
        console.log("[Marking Service] Using Zod Schema from Modal Definition.");
    }

    try {
      // Call AI service with the generated prompt and schema
      const result = await aiService.generateStructuredData(
        compiledPrompt,          
        expectedSchema, // Use the schema from the modal definition
        `MarkingSchema for ${modalSchemaId}`  
      );
      
      // Specific logging for listening-transcribe raw result
      if (modalSchemaId === 'listening-transcribe') {
          console.log("\n--- [ListenTranscribe Marking Log] ---");
          console.log("Modal ID:", modalSchemaId);
          console.log("Raw AI Result Received:");
          console.log(JSON.stringify(result, null, 2));
          console.log("-------------------------------------\n");
      }

      if (!result) {
          throw new Error('AI service returned null mark data.');
      }
      
      // Ensure the result conforms to the expected schema 
      // (aiService should handle this, but parsing here ensures type safety)
      const parsedResult = expectedSchema.parse(result);
      
      // --- Adapt/Validate the parsed result to the standard AiMarkingResult --- 
      // Check if the parsed result conforms to the *standard* AiMarkingResultSchema
      const validation = AiMarkingResultSchema.safeParse(parsedResult);
      if (!validation.success) {
         console.warn(`[Marking Service] Result from ${modalSchemaId} marking schema doesn't match standard AiMarkingResult structure. Validation errors:`, validation.error.issues);
         // Return default error if fields are incompatible
         return {
            isCorrect: false,
            score: 0,
            feedback: "Marking schema validation mismatch.",
            correctAnswer: ""
         };
      }
      // ---------------------------------------------------------------------------

      // Specific logging for listening-transcribe final validated result
      if (modalSchemaId === 'listening-transcribe' && validation.success) {
          console.log("\n--- [ListenTranscribe Marking Log] ---");
          console.log("Modal ID:", modalSchemaId);
          console.log("Final Validated Marking Data:");
          console.log(JSON.stringify(validation.data, null, 2));
          console.log("-------------------------------------\n");
      }

      return validation.data; // Return the validated data adhering to AiMarkingResult

    } catch (error) {
       console.error("[Marking Service] AI Marking Error:", error);
       // Return a default error marking result
       return {
         isCorrect: false,
         score: 0,
         feedback: "Error during marking process.",
         correctAnswer: ""
       };
    }
  }
}

// Remove the old compilePrompt helper if no longer needed elsewhere
/*
function compilePrompt(template: string, data: Record<string, any>): string {
  // ... old implementation ...
}
*/

// Create a singleton instance
export const markingService = new MarkingService(); 