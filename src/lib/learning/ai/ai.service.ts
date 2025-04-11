import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
    GenerationConfig,
    Schema, // Use the Schema type for responseSchema
} from '@google/generative-ai';
import { z } from 'zod';
// Use the new converter
import { convertZodToGoogleSchema } from '../grammar/zod-schema-converter';
import { isDebugMode } from '@/lib/utils/debug';

const DEBUG_AI_SERVICE = isDebugMode('AI_SERVICE');
const MAX_RETRIES = 1; // Allow one retry attempt upon validation failure

// Define a system instruction
const systemInstruction = {
    role: "system", // Or potentially "user" if system role causes issues
    parts: [{ text: "You are an assistant helping generate structured linguistic data or evaluate user input for a language learning application. Adhere strictly to requested schemas and formats. Focus on grammatical accuracy and providing plausible examples or errors relevant to language learners." }]
};

/**
 * Service responsible for AI interactions using Google Gemini.
 */
export class AIService {
  private genAI: GoogleGenerativeAI;
  // Let's stick to 1.5 flash for now, known to support JSON mode well
  private readonly modelName = "gemini-1.5-flash-latest"; 

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn("GOOGLE_API_KEY not found...");
      this.genAI = new GoogleGenerativeAI('MISSING_API_KEY');
    } else {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  /**
   * Generate structured data using Google Gemini JSON mode (via responseSchema).
   *
   * @param prompt The user prompt.
   * @param zodSchema The Zod schema defining the desired output structure.
   * @returns The parsed JSON object matching the schema, or null if generation fails.
   */
  async generateStructuredData(prompt: string, zodSchema: z.ZodType<any, any>): Promise<any | null> {
    if (DEBUG_AI_SERVICE) {
      console.log(`[AI Service/Gemini Debug] Generating structured data (responseSchema mode) for prompt: "${prompt.substring(0, 100)}..."`);
    }

    let googleSchema: Schema;
    try {
      googleSchema = convertZodToGoogleSchema(zodSchema);
      if (DEBUG_AI_SERVICE) {
        // Avoid logging excessively large schemas
        console.log("[AI Service/Gemini Debug] Converted Google Schema (Top Level):", { type: googleSchema.type, desc: googleSchema.description });
        // console.log("[AI Service/Gemini Debug] Full Converted Google Schema:", JSON.stringify(googleSchema, null, 2));
      }
    } catch (conversionError) {
      console.error("[AI Service/Gemini] Failed to convert Zod schema to Google Schema format:", conversionError);
      return null; // Cannot proceed without a valid schema
    }

    const model = this.genAI.getGenerativeModel({ model: this.modelName });
    const generationConfig: GenerationConfig = {
      responseMimeType: "application/json",
      responseSchema: googleSchema,
      temperature: 0.8,
    };

    let attempts = 0;
    let lastError: any = null;

    while (attempts <= MAX_RETRIES) {
        let currentPrompt = prompt;
        // Construct retry prompt if this is not the first attempt
        if (attempts > 0 && lastError) {
             const errorString = JSON.stringify(lastError);
             currentPrompt = `Your previous attempt failed Zod validation with these errors: ${errorString}. Please analyze the errors and the schema description, then generate a new response that strictly adheres to the required structure. Original prompt was: ${prompt}`;
             if (DEBUG_AI_SERVICE) {
                console.log(`[AI Service/Gemini Debug] Retrying (Attempt ${attempts}) with correction prompt...`);
             }
        }
        
        // Prepare contents array including system instruction
        const contents = [
            // Place system instruction *before* the user prompt
            // systemInstruction, // --> Sometimes system role is problematic with specific APIs/tasks
            // Alternative: Prepend system-like instruction to the user prompt
            { role: "user", parts: [{ text: (attempts === 0 ? systemInstruction.parts[0].text + "\n\nUser Prompt:\n" : "Retry Prompt:\n") + currentPrompt }] }
        ];

        try {
            if (DEBUG_AI_SERVICE && attempts > 0) {
                 console.log(`[AI Service/Gemini Debug] Retry Prompt: ${currentPrompt.substring(0, 200)}...`);
            }
            if (DEBUG_AI_SERVICE && attempts === 0) {
                console.log(`[AI Service/Gemini Debug] Calling ${this.modelName} with responseSchema...`);
            }
      
            const result = await model.generateContent({ 
                // Pass the combined contents
                contents: contents, 
                generationConfig: generationConfig
            });

            if (DEBUG_AI_SERVICE) {
                console.log(`[AI Service/Gemini Debug] Raw API Response (Attempt ${attempts}):`, JSON.stringify(result, null, 2));
            }

            const responseText = result.response.text();
            if (!responseText) {
                 console.error(`[AI Service/Gemini] No response text received (Attempt ${attempts}).`);
                 lastError = "No response text received"; // Store error for potential retry prompt
                 attempts++;
                 continue; // Go to next attempt or exit loop
            }
      
            try {
                const jsonObject = JSON.parse(responseText);
                if (DEBUG_AI_SERVICE) {
                    console.log(`[AI Service/Gemini Debug] Parsed JSON object (Attempt ${attempts}):`, jsonObject);
                }

                const validationResult = zodSchema.safeParse(jsonObject);
                if (validationResult.success) {
                    if (DEBUG_AI_SERVICE) {
                    console.log(`[AI Service/Gemini Debug] Zod validation successful (Attempt ${attempts}).`);
                    }
                    return validationResult.data; // Success! Exit loop and return data.
                } else {
                    console.error(`[AI Service/Gemini] Zod validation failed (Attempt ${attempts}):`, validationResult.error.flatten());
                    lastError = validationResult.error.flatten(); // Store validation errors
                    attempts++; // Increment attempts and loop again if allowed
                }
            } catch (jsonParseError) {
                console.error(`[AI Service/Gemini] Failed to parse response text as JSON (Attempt ${attempts}):`, responseText, jsonParseError);
                lastError = `JSON Parse Error: ${jsonParseError instanceof Error ? jsonParseError.message : String(jsonParseError)}`;
                attempts++; // Increment attempts and loop again
            }

        } catch (error) {
            console.error(`[AI Service/Gemini] Error during API call (Attempt ${attempts}):`, error);
            lastError = `API Call Error: ${error instanceof Error ? error.message : String(error)}`;
            // Log API details only once on first major failure
            if (attempts === 0 && (error as any).response?.candidates) {
                console.error('Gemini API Error Details:', JSON.stringify((error as any).response.candidates, null, 2));
            }
            // If API call itself fails, maybe don't retry immediately unless it's a transient error? For simplicity, we retry.
            attempts++;
        }
    } // End of while loop

    // If loop finishes without returning, it means all attempts failed.
    console.error(`[AI Service/Gemini] Failed to generate valid structured data after ${MAX_RETRIES + 1} attempts.`);
    return null; // Indicate failure
  }
}

// Create a singleton instance
export const aiService = new AIService();
console.log("DEBUG: ai.service.ts loaded (responseSchema mode)"); 