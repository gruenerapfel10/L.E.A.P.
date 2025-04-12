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

// --- Define Interface for markAnswer parameters --- 
interface MarkAnswerParams {
  userId: string;
  sessionId: string;
  moduleId: string; // Added moduleId
  submoduleId: string;
  modalSchemaId: string;
  moduleDefinition: ModuleDefinition;
  submoduleDefinition: SubmoduleDefinition;
  modalSchemaDefinition: ModalSchemaDefinition;
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
    // Destructure properties from the params object
    const {
      userId,
      sessionId,
      moduleId, // Destructure moduleId
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
    
    // Safely access overrides using optional chaining
    const overrideConfig = submoduleDefinition?.overrides?.[modalSchemaId];
    const markingPromptOverride = overrideConfig?.markingPromptOverride;

    const markingConfig = markingPromptOverride
      ? { 
          promptTemplate: markingPromptOverride, // Use the safely accessed variable
          zodSchema: modalSchemaDefinition.markingConfig.zodSchema // Use schema from base modal
        }
      : modalSchemaDefinition.markingConfig;

    // Check if modalSchemaDefinition or its markingConfig is missing
    if (!modalSchemaDefinition?.markingConfig) {
      throw new Error(`Base marking configuration missing for modal schema ${modalSchemaId}`);
    }

    if (!markingConfig?.promptTemplate) {
      // Log details if the prompt is still missing
      console.warn(`Marking prompt template missing for modal schema ${modalSchemaId}. Submodule override exists: ${!!overrideConfig}, Override prompt exists: ${!!markingPromptOverride}`);
      throw new Error(`Marking configuration or prompt template missing for modal schema ${modalSchemaId}`);
    }

    // Prepare input for the AI prompt - Tailor based on modalSchemaId
    let markingInput: Record<string, any> = {
        // Common fields
        submoduleContext: submoduleDefinition?.submoduleContext,
        targetLanguage: targetLanguage,
        sourceLanguage: sourceLanguage,
        difficulty: difficulty,
        userId: userId,
        sessionId: sessionId
    };

    // Add specific fields based on the modal schema being marked
    if (modalSchemaId === 'multiple-choice') {
        const userSelectedIndex = userAnswer; // User answer is the index for MC
        const correctOptionIndex = questionData?.correctOptionIndex;
        const options = questionData?.options;
        
        markingInput = {
            ...markingInput,
            question: questionData?.question,                 
            sentence: questionData?.sentence,                   
            options: JSON.stringify(options),      
            targetWordBase: questionData?.targetWordBase,
            correctOptionIndex: correctOptionIndex,
            userAnswerIndex: userSelectedIndex, // Use the correct placeholder name
            // Safely get text based on indices
            userAnswer: options?.[userSelectedIndex], // Text of user's choice
            correctAnswer: options?.[correctOptionIndex], // Text of correct choice
        };
    } else if (modalSchemaId === 'true-false') {
        markingInput = {
            ...markingInput,
            statement: questionData?.statement,               
            userAnswerBool: userAnswer, // User answer is boolean for T/F                       
            isCorrectAnswerTrue: questionData?.isCorrectAnswerTrue,
            explanation: questionData?.explanation,          
        };
    } else {
        // Default/Fallback for other types (might need refinement)
        markingInput = {
            ...markingInput,
            questionData: JSON.stringify(questionData), 
            userAnswer: JSON.stringify(userAnswer),    
        };
        console.warn(`[Marking Service] Using generic markingInput for unhandled modalSchemaId: ${modalSchemaId}`);
    }
    
    // Compile the retrieved prompt template WITH the prepared markingInput data
    const compiledPrompt = compilePrompt(markingConfig.promptTemplate, markingInput);

    if (DEBUG_MARKING) {
        console.log("[Marking Service] Marking Input (Specific Fields):", markingInput);
        console.log("[Marking Service] Base Prompt Template Retrieved:", markingConfig.promptTemplate); // Log the template string we *think* we are using
        console.log("[Marking Service] COMPILED Prompt:", compiledPrompt.substring(0,500) + "..."); // Log compiled prompt
        console.log("[Marking Service] Zod Schema:", markingConfig.zodSchema);
    }

    try {
      // Call AI service with the COMPILED prompt
      const result = await aiService.generateStructuredData(
        compiledPrompt,          
        AiMarkingResultSchema,   
        'AiMarkingResultSchema'  
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

// Helper function compilePrompt (ensure it handles boolean values properly)
function compilePrompt(template: string, data: Record<string, any>): string {
  let compiled = template;
  for (const key in data) {
    // Use optional chaining for safety, skip null/undefined values
    const value = data[key]; 
    if (value !== null && value !== undefined) { 
        const regex = new RegExp(`\{${key}\}`, 'g');
        // Convert value to string before replacement
        compiled = compiled.replace(regex, String(value)); 
    }
  }
  // Handle potential missing placeholders gracefully (replace with empty string or [MISSING])
  compiled = compiled.replace(/\{[^{}]+\}/g, '[MISSING]'); 
  return compiled;
}

// Create a singleton instance
export const markingService = new MarkingService(); 