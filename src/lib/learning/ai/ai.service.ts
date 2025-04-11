import { z } from 'zod';
import { createGoogleGenerativeAI } from '@ai-sdk/google'; // Vercel AI SDK import
import { generateObject, GenerateObjectResult } from 'ai'; // Vercel AI SDK core function
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
  private readonly modelName = 'models/gemini-1.5-flash-latest'; 

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
   * @param prompt The user prompt including necessary context.
   * @param zodSchema The Zod schema defining the desired output structure.
   * @param schemaName A descriptive name for the schema (for logging).
   * @returns The validated data object matching the schema, or null if generation/validation fails after retries.
   */
  async generateStructuredData<T extends z.ZodType<any, any>>(prompt: string, zodSchema: T, schemaName: string): Promise<z.infer<T> | null> {
    if (DEBUG_AI_SERVICE) {
      console.log(`[AI Service/Vercel SDK Debug] Generating object for schema '${schemaName}' with prompt: "${prompt.substring(0, 100)}..."`);
    }

    const model = this.google(this.modelName); // Get the model instance
    let attempts = 0;
    let lastError: any = null;

    while (attempts <= MAX_RETRIES) {
      try {
         if (DEBUG_AI_SERVICE && attempts > 0) {
           console.log(`[AI Service/Vercel SDK Debug] Retrying generation for schema '${schemaName}' (Attempt ${attempts + 1}/${MAX_RETRIES + 1}). Last Error:`, lastError);
         }
         if (DEBUG_AI_SERVICE) {
             console.log(`[AI Service/Vercel SDK Debug] Calling generateObject with model ${this.modelName}...`);
         }
         
        // Use generateObject from Vercel AI SDK
        const result: GenerateObjectResult<z.infer<T>> = await generateObject({
          model: model,
          schema: zodSchema,
          prompt: prompt, // Pass the full prompt
          mode: 'json', // Explicitly request JSON mode (though often inferred)
          // System prompt can be added here if needed:
          // system: "You are an assistant...", 
          temperature: 0.8, // Example parameter
        });
        
        if (DEBUG_AI_SERVICE) {
            console.log(`[AI Service/Vercel SDK Debug] generateObject result (Attempt ${attempts + 1}):`, {
              // Log key parts, avoid logging potentially large rawResponse
              object: result.object,
              usage: result.usage,
              warnings: result.warnings,
            });
        }

        // generateObject automatically validates against the schema.
        // If it doesn't throw, the object conforms.
        return result.object; // Success!

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
console.log("DEBUG: ai.service.ts loaded (using Vercel AI SDK)"); 