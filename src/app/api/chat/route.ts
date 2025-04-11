import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { moduleRegistryService } from '@/lib/learning/registry/module-registry.service';
import { modalSchemaRegistryService } from '@/lib/learning/modals/registry.service';
import { ModuleDefinition, SubmoduleDefinition, HelperResource } from '@/lib/learning/types'; // Import types
import { ModalSchemaDefinition } from '@/lib/learning/modals/types'; // Import types

// Ensure this is treated as a dynamic route handler
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Allow streaming up to 30 seconds

// Initialize registries once (assuming this pattern is necessary)
let registriesInitialized = false;
async function initializeRegistries() {
  if (registriesInitialized) return;
  try {
    console.log("[API Chat Init] Initializing registries...");
    await Promise.all([
      moduleRegistryService.initialize(),
      modalSchemaRegistryService.initialize(),
    ]);
    registriesInitialized = true;
    console.log("[API Chat Init] Registries Initialized.");
  } catch (error) {
    console.error("[API Chat Init] Failed to initialize registries:", error);
    registriesInitialized = false; // Reset on error
    throw new Error("Failed to initialize learning registries");
  }
}

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
    await initializeRegistries(); // Ensure registries are ready

    // --- 1. Extract Session ID from Messages and Filter Messages --- 
    const { messages: incomingMessages } = await req.json();
    
    let sessionId: string | null = null;
    const coreMessages = [];
    
    for (const msg of incomingMessages) {
      if (msg.role === 'system' && msg.content?.startsWith('SESSION_ID::')) {
        sessionId = msg.content.split('::')[1];
        console.log(`[API Chat Route] Extracted sessionId from system message: ${sessionId}`);
      } else {
        coreMessages.push(msg); // Keep non-session ID messages
      }
    }
    
    if (!sessionId) {
      console.error("[API Chat Route] Missing sessionId in initial system message");
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }
    
    console.log(`[API Chat Route] Processing request for sessionId: ${sessionId}`);

    // --- 2. Fetch Context Data from DB & Registries (using extracted sessionId) --- 
    const supabase = await createClient();

    // Fetch session details (module ID, languages)
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_learning_sessions')
      .select('module_id, target_language, source_language, user_id')
      .eq('id', sessionId)
      .maybeSingle();
      
    if (sessionError || !sessionData) {
      console.error(`[API Chat Route] Error fetching session ${sessionId}:`, sessionError);
      return NextResponse.json({ error: 'Session not found or error fetching session' }, { status: 404 });
    }

    const { module_id: moduleId, target_language: targetLanguage, source_language: sourceLanguage, user_id: userId } = sessionData;

    // Fetch the latest event for current question context
    const { data: latestEvent, error: eventError } = await supabase
      .from('user_session_events')
      .select('submodule_id, modal_schema_id, question_data, is_correct, mark_data')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    // It's possible a session exists but has no events yet, handle gracefully
    const currentSubmoduleId = latestEvent?.submodule_id;
    const currentModalSchemaId = latestEvent?.modal_schema_id;
    const currentQuestionData = latestEvent?.question_data;
    const isAnswered = latestEvent?.is_correct !== null; // Check if marking happened
    const markResult = latestEvent?.mark_data;

    if (eventError) {
       console.error(`[API Chat Route] Error fetching latest event for session ${sessionId}:`, eventError);
       // Decide if this is fatal, maybe continue with less context?
    }

    // Fetch Module and Submodule Definitions (requires registries)
    const moduleDef: ModuleDefinition | undefined = moduleRegistryService.getModule(moduleId, targetLanguage);
    const submoduleDef: SubmoduleDefinition | undefined = moduleDef?.submodules.find(sub => sub.id === currentSubmoduleId);
    const modalSchemaDef: ModalSchemaDefinition | undefined = currentModalSchemaId ? modalSchemaRegistryService.getSchema(currentModalSchemaId) : undefined;
    const currentUiComponent = submoduleDef?.overrides?.[currentModalSchemaId || '']?.uiComponentOverride || modalSchemaDef?.uiComponent;

    // Fetch Session Stats (example - could be optimized)
    const { count: totalAnswered, error: countError } = await supabase
        .from('user_session_events')
        .select('*' , { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .not('is_correct', 'is', null); // Count only marked events
        
    const { count: correctCount, error: correctCountError } = await supabase
        .from('user_session_events')
        .select('*' , { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('is_correct', true);
        
    const sessionStats = {
        correctCount: correctCount ?? 0,
        totalAnswered: totalAnswered ?? 0
    };

    // --- 3. Construct Prompt and Context --- 
    
    // Format the base system prompt with language info
    const systemPrompt = systemPromptTemplate
      .replace('{nativeLanguage}', sourceLanguage || 'en') // Use fetched source language
      .replace('{targetLanguage}', targetLanguage || 'de'); // Use fetched target language
      
    // Prepare DETAILED context string using fetched data
    let detailedContextString = "";
    // System-level context
    if (moduleDef) {
        detailedContextString += `System Context:\n- Module: ${moduleDef.localization[sourceLanguage]?.title || moduleDef.title_en}\n`;
        const moduleHelp = moduleDef.helpers?.map((h: HelperResource) => `- ${h.title}:\n${h.content}`).join('\n\n');
        if(moduleHelp) detailedContextString += `- Module Help Content:\n${moduleHelp}\n`;
    }
    // Session-level context
    detailedContextString += "\nCurrent Session Context:\n";
    if (submoduleDef) {
      detailedContextString += `- Submodule: ${submoduleDef.localization[sourceLanguage]?.title || submoduleDef.title_en}\n`;
      const subHelp = submoduleDef.helpers?.map((h: HelperResource) => `- ${h.title}:\n${h.content}`).join('\n\n');
      if (subHelp) detailedContextString += `- Submodule Help Content:\n${subHelp}\n`;
    }
    if (currentQuestionData) {
      detailedContextString += `- Current Task Type: ${currentUiComponent || currentModalSchemaId || 'Unknown'}\n`;
      detailedContextString += `- Current Question Data: ${JSON.stringify(currentQuestionData, null, 2)}\n`;
    }
    detailedContextString += `- Session Stats: ${sessionStats.correctCount}/${sessionStats.totalAnswered} correct\n`;
    if (latestEvent) { // Only add status if we have event data
        detailedContextString += `- Current Question Status: ${isAnswered ? `Answered - ${markResult?.isCorrect ? 'Correct' : 'Incorrect'}` : 'Not Answered'}\n`;
    }
    // Add separator only if detailed context was added
    if (detailedContextString.length > ("\nCurrent Session Context:\n".length + "System Context:\n".length)) {
        detailedContextString = "\n\n--- Detailed Context ---\n" + detailedContextString;
    } else {
        detailedContextString = ""; // No detailed context found
    }

    // --- 4. Prepare Messages for AI (using filtered coreMessages) --- 
    const messagesWithContext = [
      { role: 'system', content: systemPrompt + detailedContextString },
      ...coreMessages
    ];
    
    // Log the final message array being sent
    console.log("[API Chat Route] Messages sent to AI:", JSON.stringify(messagesWithContext, null, 2));

    // --- 5. Call Vercel AI SDK --- 
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY || 'MISSING_KEY',
    });

    const result = await streamText({
      model: google('models/gemini-1.5-flash-latest'),
      messages: messagesWithContext,
      // temperature: 0.7, 
    });

    // --- 6. Respond with Stream --- 
    return result.toDataStreamResponse();

  } catch (error) {
    console.error("[API Chat Route Error]", error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    // Ensure a Response object is returned on error
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 