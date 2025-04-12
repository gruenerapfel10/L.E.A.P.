import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';
import { moduleRegistryService } from '@/lib/learning/registry/module-registry.service';
import { modalSchemaRegistryService } from '@/lib/learning/modals/registry.service';
import { initializeLearningRegistries } from '@/lib/learning/registry/init';
import { ModuleDefinition, SubmoduleDefinition, HelperResource } from '@/lib/learning/types/index';
import { ModalSchemaDefinition } from '@/lib/learning/modals/types';
import { z } from 'zod';

// Ensure this is treated as a dynamic route handler
export const dynamic = 'force-dynamic';

// Define Zod schema for the incoming request body
const chatRequestBodySchema = z.object({
  messages: z.array(z.any()), // Keep messages flexible for now
  userId: z.string().optional(), // Allow optional userId if user might not be logged in
  targetLanguage: z.string(),
  sourceLanguage: z.string(),
  questionContext: z.string().optional(), // Add optional question context
});

// Define the system prompt template
const systemPromptTemplate = `You are an AI assistant integrated into a language learning platform called Leap. 
Your primary role is to help users understand concepts related to the specific module, submodule, and question they are currently working on. 
User's native language: {nativeLanguage}. Language being learned: {targetLanguage}.

You have access to the module's help sheet content and should reference it when relevant.

When responding:
1. Acknowledge the current module and submodule context if relevant to the user's query.
2. Reference the help sheet content when explaining concepts.
3. Be helpful, encouraging, and provide clear explanations.
4. If the user asks something unrelated to the current learning context, gently guide them back.
5. Avoid simply giving away the answer to the current question unless explicitly asked for a hint or the answer itself after the user has attempted it.
6. Focus on explaining the underlying grammar rules, vocabulary meanings, or concepts.
7. Respond in the user's native language ({nativeLanguage}) unless they are practicing the target language ({targetLanguage}).

Remember: You are here to help the user learn, not just to provide answers.`;

export async function POST(req: Request) {
  try {
    await initializeLearningRegistries();

    const body = await req.json();
    
    // --- ADDED: Log the full request body --- 
    console.log("\n[API Chat Request Body RECEIVED]:", JSON.stringify(body, null, 2));
    // ----------------------------------------

    const validation = chatRequestBodySchema.safeParse(body);
    if (!validation.success) {
       console.error("[API Chat Validation Error]:", validation.error.flatten()); // Log validation errors
       return new Response(JSON.stringify({ error: 'Invalid request body', details: validation.error.flatten() }), { status: 400 });
    }
    const { messages: validatedMessages, userId: validatedUserId, targetLanguage: validatedTargetLanguage, sourceLanguage: validatedSourceLanguage, questionContext: validatedQuestionContext } = validation.data; // Extract context

    let sessionId: string | null = null;
    const coreMessages = [];
    for (const msg of validatedMessages) {
      if (msg.role === 'system' && msg.content?.startsWith('SESSION_ID::')) {
        sessionId = msg.content.split('::')[1];
      } else {
        coreMessages.push(msg);
      }
    }

    const supabase = await createClient();
    let userProfile: any = null;
    let learningState: any = null;

    if (validatedUserId) { 
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', validatedUserId)
        .single();
      if (profileError) console.error("Error fetching profile:", profileError);
      userProfile = profileData;

      if (sessionId) {
         const { data: stateData, error: stateError } = await supabase
           .from('learning_sessions')
           .select('last_state')
           .eq('session_id', sessionId)
           .single();
        if (stateError) console.error("Error fetching learning state:", stateError);
        learningState = stateData?.last_state; 
      }
    }

    const relevantModules = moduleRegistryService.getUniqueModuleConcepts()
      .map(concept => moduleRegistryService.getModule(concept.id, validatedTargetLanguage))
      .filter((mod): mod is ModuleDefinition => mod !== null);
    const relevantModals = modalSchemaRegistryService.getAllSchemas();

    let contextString = "User Profile: " + JSON.stringify(userProfile) + "\n";
    contextString += "Learning State: " + JSON.stringify(learningState) + "\n";
    contextString += "Target Language: " + validatedTargetLanguage + "\n";
    contextString += "Source Language: " + validatedSourceLanguage + "\n";
    contextString += "\nAvailable Learning Modules:\n";
    relevantModules.forEach((mod: ModuleDefinition) => {
      contextString += `- ${mod.id}: ${mod.localization[validatedTargetLanguage]?.title || mod.title_en}\n`;
      mod.submodules.forEach((sub: SubmoduleDefinition) => {
         contextString += `  - ${sub.id}: ${sub.localization[validatedTargetLanguage]?.title || sub.title_en}\n`;
      });
    });

    const systemPrompt = systemPromptTemplate
      .replace('{nativeLanguage}', validatedSourceLanguage || 'en')
      .replace('{targetLanguage}', validatedTargetLanguage || 'de');

    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'MISSING_KEY',
    });

    const result = await streamText({
      model: openai('gpt-4-turbo-preview'),
      system: systemPrompt,
      messages: [
        { role: 'system', content: systemPrompt },
        ...(validatedQuestionContext ? [{ role: 'system', content: `[Current Question Context]\n${validatedQuestionContext}[/Current Question Context]` }] : []),
        ...coreMessages
      ],
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error("[API Chat Error]:", error);
    return new Response(JSON.stringify({ error: error.message || 'An internal server error occurred' }), { status: 500 });
  }
} 