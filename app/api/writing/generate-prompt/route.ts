import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamObject } from 'ai';
import { WritingPromptSchema } from '../../../writing/lib/writingSchemas';

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set');
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const runtime = 'edge';

export async function POST(request: Request) {
  console.log('[Writing Prompt API] Starting prompt generation');
  
  try {
    const body = await request.json();
    const { type, topic, difficulty = 'C1' } = body;

    const prompt = `Generate a German ${difficulty} level writing prompt for the Goethe exam.

Create a ${type || 'argumentative-essay'} writing task about ${topic || 'a contemporary social issue'}.

Requirements:
1. Generate a complete writing prompt with clear instructions in German
2. Include English translations for all German text
3. Provide specific requirements and structure guidance
4. Include 8-10 key phrases with translations and usage examples
5. Set appropriate time limit and word count for ${difficulty} level
6. Create a sample structure outline

The prompt should:
- Address contemporary, relevant topics suitable for ${difficulty} level
- Require critical thinking and structured argumentation
- Include clear task requirements
- Be challenging but achievable within the time limit
- Follow Goethe exam standards and format

Topics can include:
- Technology and digitalization
- Environmental issues and sustainability  
- Social changes and multiculturalism
- Education and learning
- Work and career development
- Health and lifestyle
- Media and communication
- Economic and political issues

For argumentative essays: Present a debatable statement requiring balanced discussion
For opinion essays: Ask for personal stance with supporting arguments
For formal letters: Create a realistic scenario requiring formal communication
For reports: Request analysis of data, trends, or situations
For analysis: Ask to examine and evaluate a complex issue

Generate a complete WritingPrompt object with all required fields. Ensure the difficulty matches ${difficulty} level expectations.`;

    console.log('[Writing Prompt API] Calling streamObject with Gemini');
    
    const result = await streamObject({
      model: google('models/gemini-2.5-flash'),
      schema: WritingPromptSchema,
      prompt,
      temperature: 0.8,
    });

    console.log('[Writing Prompt API] Creating manual streaming response');
    
    // Create a manual streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const partialObject of result.partialObjectStream) {
            const chunk = JSON.stringify(partialObject) + '\n';
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (error) {
          console.error('[Writing Prompt API] Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    console.error('[Writing Prompt API] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate writing prompt' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 