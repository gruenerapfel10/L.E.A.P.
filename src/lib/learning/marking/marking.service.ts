import { aiService } from '../ai/ai.service';
import { moduleRegistryService } from '../registry/module-registry.service';
import { modalSchemaRegistryService } from '../modals/registry.service';
import { SubmoduleDefinition } from '../types';
import { ModalSchemaDefinition } from '../modals/types';
import { z } from 'zod'; // Import Zod
import { isDebugMode } from '@/lib/utils/debug'; // Import debug utility

const DEBUG_MARKING = isDebugMode('MARKING');

// Define the expected output structure for AI marking as a Zod schema
const AiMarkingResultSchema = z.object({
  isCorrect: z.boolean().describe("Whether the user's answer was correct."),
  score: z.number().min(0).max(100).describe("A score from 0 to 100."),
  feedback: z.string().describe("Feedback for the user, explaining the result."),
  correctAnswer: z.string().optional().describe("The correct answer or relevant correct segment, if the user was wrong.")
});
export type AiMarkingResult = z.infer<typeof AiMarkingResultSchema>;

interface MarkAnswerParams {
  moduleId: string;
  submoduleId: string;
  modalSchemaId: string;
  questionData: any;
  userAnswer: any;
  targetLanguage: string;
  sourceLanguage: string;
}

/**
 * Service responsible for marking user answers using modal schemas.
 */
export class MarkingService {

  constructor() {
    // Ensure registries are initialized
    moduleRegistryService.initialize().catch(err => console.error("Failed to init ModuleRegistry in Marker", err));
    modalSchemaRegistryService.initialize().catch(err => console.error("Failed to init ModalSchemaRegistry in Marker", err));
  }

  /**
   * Mark a user's answer to a learning question.
   */
  async markAnswer(params: MarkAnswerParams): Promise<any> {
    const {
      moduleId,
      submoduleId,
      modalSchemaId,
      questionData,
      userAnswer,
      targetLanguage, 
      sourceLanguage,
    } = params;
    
    if (DEBUG_MARKING) console.log(`[Marker Debug] Starting markAnswer for ${modalSchemaId}`);
    
    console.log(`Marking answer: Module=${moduleId}, Submodule=${submoduleId}, Schema=${modalSchemaId}`);
    
    // Get module and submodule definitions
    const module = moduleRegistryService.getModule(moduleId);
    if (!module) throw new Error(`Module not found: ${moduleId}`);
    
    const submodule = module.submodules.find(sub => sub.id === submoduleId);
    if (!submodule) throw new Error(`Submodule not found: ${submoduleId} in module ${moduleId}`);

    // Get the modal schema definition
    const modalSchema = modalSchemaRegistryService.getSchema(modalSchemaId);
    if (!modalSchema) throw new Error(`Modal schema not found: ${modalSchemaId}`);

    // --- Simple Marking Logic (Bypass AI if possible) ---
    // Can be expanded for different schema IDs if they have deterministic marking
    if (modalSchemaId === 'multiple-choice' && questionData.correctOptionIndex !== undefined && typeof userAnswer === 'number') {
        console.log("Using simple multiple-choice marking.");
      return this.markMultipleChoice(questionData, userAnswer);
    }
    if (modalSchemaId === 'true-false' && questionData.isCorrectAnswerTrue !== undefined && typeof userAnswer === 'boolean') {
        console.log("Using simple true/false marking.");
        return this.markTrueFalse(questionData, userAnswer);
    }
    // Add more simple markers here (e.g., strict fill-in-gap without AI check)

    // --- AI Marking Logic --- 
    if (DEBUG_MARKING) console.log("[Marker Debug] Using AI marking.");
    const override = submodule.overrides?.[modalSchemaId];
    const promptTemplate = override?.markingPromptOverride || modalSchema.markingConfig.promptTemplate;

    // Prepare context for placeholder replacement
    const markingContext = {
      targetLanguage,
      sourceLanguage,
      questionDataJSON: JSON.stringify(questionData), 
      taskType: questionData?.taskType || 'unknown', 
      userAnswer: typeof userAnswer === 'object' ? JSON.stringify(userAnswer) : String(userAnswer),
      // Pass specific fields from questionData if needed by prompts
      presentedSentence: questionData?.presentedSentence,
      correctSentence: questionData?.correctSentence,
      errorsIntroducedJSON: JSON.stringify(questionData?.errorsIntroduced || []), // Pass errors for context
      // Note: incorrectSegment/incorrectSegments might be ambiguous now, rely on errorsIntroducedJSON?
      // Add other context ...
    };

    // Replace placeholders
    console.log("[Marking Service] Context before replace:", markingContext);
    const prompt = this.replacePlaceholders(promptTemplate, markingContext);
    console.log("[Marking Service] Prompt after replace:", prompt); // Log the final prompt
    
    try {
        // Pass the Zod schema OBJECT to the AI service
        const markData: AiMarkingResult | null = await aiService.generateStructuredData(prompt, AiMarkingResultSchema);
        
        if (DEBUG_MARKING) console.log("[Marker Debug] Received markData from AI:", markData);

        if (!markData) {
            throw new Error('AI service returned null mark data.');
        }

        // Basic validation (already done by aiService, but belt-and-suspenders)
        if (typeof markData.isCorrect !== 'boolean' || typeof markData.score !== 'number') { 
             console.error("[Marker] AI mark data missing required fields (isCorrect or score).", markData);
             throw new Error("AI returned incomplete mark data.");
        }

        return markData;

    } catch (error) {
       // Use handleGenerationError for consistent logging
       this.handleGenerationError(error, prompt, `AiMarkingResultSchema`);
    }
  }
  
  /**
   * Replace placeholders in a prompt template with actual values.
   */
  private replacePlaceholders(template: string, values: Record<string, any>): string {
    let result = template;
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && value !== null) {
        // Escape special regex characters in the value if needed, but usually not for prompts
        result = result.replace(new RegExp(`{${key}}`, 'g'), String(value));
      }
    }
    // Cleanup any remaining/unfilled placeholders
    result = result.replace(/{\w+}/g, ''); // Replace unfilled placeholders with empty string
    return result;
  }
  
  /** Helper to extract the correct answer string from questionData based on schema */
  private extractCorrectAnswer(questionData: any, modalSchemaId: string): string {
      if (modalSchemaId === 'multiple-choice' && questionData.correctOptionIndex !== undefined && Array.isArray(questionData.options)) {
        return questionData.options[questionData.correctOptionIndex];
      } else if (modalSchemaId === 'fill-in-gap' && questionData.correctAnswer) {
        return questionData.correctAnswer;
      } else if (modalSchemaId === 'true-false' && questionData.isCorrectAnswerTrue !== undefined) {
        return String(questionData.isCorrectAnswerTrue);
      } else if (questionData.correctAnswer) { // Generic fallback
          return String(questionData.correctAnswer);
      }
      return '[Correct Answer Unavailable]';
  }

  /** Simple non-AI marking for multiple choice questions */
  private markMultipleChoice(questionData: any, userAnswer: number): any {
    const isCorrect = userAnswer === questionData.correctOptionIndex;
    const correctAnswerText = questionData.options[questionData.correctOptionIndex];
    return {
      isCorrect,
      score: isCorrect ? 100 : 0,
      feedback: isCorrect ? "Correct!" : `Incorrect. The correct answer is "${correctAnswerText}".`,
      correctAnswer: correctAnswerText,
    };
  }

  /** Simple non-AI marking for true/false questions */
  private markTrueFalse(questionData: any, userAnswer: boolean): any {
    const isCorrect = userAnswer === questionData.isCorrectAnswerTrue;
    return {
        isCorrect,
        score: isCorrect ? 100 : 0,
        feedback: isCorrect ? "Correct!" : `Incorrect. The statement was ${questionData.isCorrectAnswerTrue ? 'true' : 'false'}. ${questionData.explanation || ''}`.trim(),
        correctAnswer: questionData.isCorrectAnswerTrue,
    };
  }

  // --- Add Centralized Error Handling --- 
  private handleGenerationError(error: unknown, prompt: string, schemaContext: string): never {
    console.error("Error during AI marking:", error);
    console.error("Prompt used:", prompt);
    console.error("Schema Context:", schemaContext);
    // Rethrow with a more specific message
    throw new Error(`Failed to generate mark data from AI. Error: ${(error instanceof Error ? error.message : String(error))}`);
  }
}

// Create a singleton instance
export const markingService = new MarkingService(); 