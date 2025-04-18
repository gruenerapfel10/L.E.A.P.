import { z } from 'zod';
import { createGoogleGenerativeAI } from '@ai-sdk/google'; // Vercel AI SDK import
import { generateText, GenerateTextResult } from 'ai'; // Use generateText
import { jsonrepair } from 'jsonrepair'; // Import jsonrepair
import { isDebugMode } from '@/lib/utils/debug';

const DEBUG_AI_SERVICE = isDebugMode('AI_SERVICE');
const MAX_RETRIES = 1; // Allow one retry attempt upon validation failure

/**
 * Service responsible for AI interactions using the Vercel AI SDK.
 * Provides an abstraction layer over specific AI providers (currently Google Gemini).
 */
export class AIService {
  // Use the Vercel AI SDK Google provider factory
  private google;
  // Stick to 1.5 flash for now, supports generateObject well
  private readonly modelName = 'models/gemini-2.0-flash-001'; 

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn("GOOGLE_API_KEY not found for Vercel AI SDK... using dummy key.");
      // The SDK might handle this gracefully or throw later
      this.google = createGoogleGenerativeAI({ apiKey: 'MISSING_API_KEY' }); 
    } else {
      // Initialize the Google provider from the Vercel AI SDK
      this.google = createGoogleGenerativeAI({ apiKey: apiKey });
    }
  }

  /**
   * Generate structured data conforming to a Zod schema using the Vercel AI SDK.
   *
   * @param prompt The user prompt including necessary context and placeholders.
   * @param zodSchema The Zod schema defining the desired output structure.
   * @param schemaName A descriptive name for the schema (for logging).
   * @returns The validated data object matching the schema, or null if generation/validation fails after retries.
   */
  async generateStructuredData<T extends z.ZodType<any, any>>(
    prompt: string,
    zodSchema: T, 
    schemaName: string 
    // REMOVED inputData parameter
  ): Promise<z.infer<T> | null> {
    
    // REMOVED prompt compilation logic
    const finalPrompt = prompt; // Use the prompt directly as passed

    if (DEBUG_AI_SERVICE) {
      console.log(`[AI Service/Vercel SDK Debug] Generating object for schema '${schemaName}'`);
      // Log the raw prompt received
      console.log(`[AI Service/Vercel SDK Debug] Using prompt (first 200 chars): "${finalPrompt.substring(0, 200)}..."`); 
    }

    const model = this.google(this.modelName); 
    let attempts = 0;
    let lastError: any = null;

    // --- LOG FINAL PROMPT --- 
    console.log("\n===========================================================");
    console.log(`[AI Service] FINAL PROMPT Sent to AI for Schema: ${schemaName}`);
    console.log("-----------------------------------------------------------");
    console.log(finalPrompt); // Log the complete final prompt
    console.log("===========================================================\n");
    // ------------------------

    while (attempts <= MAX_RETRIES) {
      try {
         if (DEBUG_AI_SERVICE && attempts > 0) {
           console.log(`[AI Service/Vercel SDK Debug] Retrying generation for schema '${schemaName}' (Attempt ${attempts + 1}/${MAX_RETRIES + 1}). Last Error:`, lastError);
         }
         if (DEBUG_AI_SERVICE) {
             console.log(`[AI Service/Vercel SDK Debug] Calling generateText with model ${this.modelName}...`);
         }
         
        // Use generateText to get raw string output
        const result: GenerateTextResult<any, any> = await generateText<any, any>({
           model: model,
           prompt: finalPrompt,
           temperature: 0.8, 
           // Removed mode: 'json' and schema from generateText call
        });

        const rawText = result.text;

        if (DEBUG_AI_SERVICE) {
             console.log(`[AI Service/Vercel SDK Debug] Raw text received (Attempt ${attempts + 1}):\n`, rawText);
        }

        let repairedText = rawText;
        try {
            repairedText = jsonrepair(rawText);
            if (DEBUG_AI_SERVICE && repairedText !== rawText) {
                console.log(`[AI Service/Vercel SDK Debug] JSON repaired (Attempt ${attempts + 1}):\n`, repairedText);
            }
        } catch (repairError: any) {
            console.error(`[AI Service/Vercel SDK] jsonrepair failed (Attempt ${attempts + 1}):`, repairError.message);
            throw new Error(`JSON repair failed: ${repairError.message}`); // Rethrow to trigger retry
        }

        let parsedObject: any;
        try {
            parsedObject = JSON.parse(repairedText);
        } catch (parseError: any) {
             console.error(`[AI Service/Vercel SDK] JSON.parse failed after repair (Attempt ${attempts + 1}):`, parseError.message);
             throw new Error(`JSON parsing failed after repair: ${parseError.message}`); // Rethrow to trigger retry
        }

        // Now validate the parsed object with Zod
        const validationResult = zodSchema.safeParse(parsedObject);

        if (!validationResult.success) {
            console.error(`[AI Service/Vercel SDK] Zod validation failed after repair/parse (Attempt ${attempts + 1}):`, validationResult.error.flatten());
            // Construct a more informative error for retry
            throw new Error(`Zod validation failed: ${JSON.stringify(validationResult.error.flatten())}`); 
        }

        // If validation is successful, return the validated data
        const validatedData = validationResult.data;

        if (DEBUG_AI_SERVICE) {
             console.log(`[AI Service/Vercel SDK Debug] generateObject result (Attempt ${attempts + 1}):`, {
             object: validatedData, // Log the validated data
             usage: result.usage,
             warnings: result.warnings,
           });
        }

        return validatedData; // Success!

      } catch (error: any) {
        lastError = error;
        console.error(`[AI Service/Vercel SDK] Error generating/validating object for schema '${schemaName}' (Attempt ${attempts + 1}):`, error);
        // Log specific details if available (Vercel AI SDK might structure errors differently)
        if (error?.cause) {
             console.error(`[AI Service/Vercel SDK] Error Cause:`, error.cause);
        }
        attempts++;
        if (attempts > MAX_RETRIES) {
             console.error(`[AI Service/Vercel SDK] Failed to generate valid object for schema '${schemaName}' after ${attempts} attempts.`);
             return null; // Failed after all retries
        }
        // Wait a short time before retrying (optional)
        // await new Promise(resolve => setTimeout(resolve, 500)); 
      }
    } // End of while loop

    return null; // Should be unreachable if MAX_RETRIES >= 0, but included for safety
  }
}

// Create a singleton instance
export const aiService = new AIService();
console.log("DEBUG: ai.service.ts loaded (using Vercel AI SDK) - REVERTED"); // Added REVERTED note 