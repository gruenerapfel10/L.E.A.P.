import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Ensure this is treated as a dynamic route handler
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Allow streaming up to 30 seconds

// Define the system prompt for the AI assistant
const systemPrompt = `You are an AI assistant integrated into a language learning platform called Leap. 
Your primary role is to help users understand concepts related to the specific module, submodule, and question they are currently working on. 
If context (Module, Submodule, Question Status) is provided below, ACKNOWLEDGE it briefly in your response before proceeding.
Be helpful, encouraging, and provide clear explanations. 
If the user asks something unrelated to the current learning context, gently guide them back or state that you cannot help with off-topic requests.
Avoid simply giving away the answer to the current question unless explicitly asked for a hint or the answer itself after the user has attempted it.
Focus on explaining the underlying grammar rules, vocabulary meanings, or concepts.`;

export async function POST(req: Request) {
  try {
    // Extract messages AND the data (context) from the request body
    const { messages, data } = await req.json();

    // Log the received context data (optional)
    console.log("[API Chat Route] Received context:", data);

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return new Response('Missing GOOGLE_API_KEY', { status: 500 });
    }

    const google = createGoogleGenerativeAI({
      apiKey: apiKey,
    });

    // --- Prepare context string --- 
    let contextString = "Current context:\n";
    if (data?.module?.title) contextString += `- Module: ${data.module.title}\n`;
    if (data?.submodule?.title) contextString += `- Submodule: ${data.submodule.title}\n`;
    // Optionally add concise question info if needed, be mindful of token limits
    // if (data?.currentQuestionData) contextString += `- Current Question Type: ${data.currentUiComponent || 'Unknown'}\n`;
    if (data?.isAnswered !== undefined) contextString += `- Question Status: ${data.isAnswered ? `Answered - ${data.markResult?.isCorrect ? 'Correct' : 'Incorrect'}` : 'Not Answered'}\n`;
    if (contextString === "Current context:\n") contextString = ""; // No context to add
    else contextString += "\n";

    // Filter out any previous system messages and prepend the system prompt and context
    const coreMessages = messages.filter((m: any) => m.role !== 'system');
    const messagesWithContext = [
      { role: 'system', content: systemPrompt + (contextString ? "\n\n" + contextString : "") },
      ...coreMessages
    ];
    
    // Log the final message array being sent (optional, for debugging)
    console.log("[API Chat Route] Messages sent to AI:", messagesWithContext);

    const result = await streamText({
      // Use the Gemini 2.0 Flash model
      model: google('models/gemini-2.0-flash-001'),
      // Pass the messages array including the system prompt and context
      messages: messagesWithContext, // Use the array with context
      
      // Optional: Add temperature or other generation settings if needed
      // temperature: 0.7, 
    });

    // Respond with the stream
    return result.toDataStreamResponse();

  } catch (error) {
    console.error("[API Chat Route Error]", error);
    // Basic error handling
    if (error instanceof Error && error.message.includes('API key not valid')) {
       return new Response('Invalid Google API Key', { status: 401 });
    }
    return new Response('Error processing chat request', { status: 500 });
  }
} 