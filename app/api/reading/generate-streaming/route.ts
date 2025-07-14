import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamObject } from 'ai';
import { ReadingTextSchema } from '../../../reading/lib/questionSchemas';
import { C1_TOPICS, getRandomTopic } from '../../../reading/lib/sourceGenerator';

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set');
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const runtime = 'edge';

export async function POST() {
  console.log('[Streaming Generation API] Starting streaming generation');
  
  const selectedTopic = getRandomTopic();
  console.log('[Streaming Generation API] Selected topic:', selectedTopic);
  
  const prompt = `Generate a complete German C1 level reading comprehension exercise focused on the topic: "${selectedTopic}".

Create:
1. A German reading text (200-300 words) that explores the topic of ${selectedTopic}
2. 3-5 comprehension questions of different types that test understanding of this topic

Text requirements:
- Focus on the theme of ${selectedTopic}
- Challenging but appropriate for C1 level
- Clear main ideas and supporting details about ${selectedTopic}
- Varied vocabulary and complex grammatical structures
- Include German title with English translation
- Include German content with English translation
- Specify text type (informative, narrative, functional, opinion)

Question requirements:
- Mix of question types: multiple-choice, true-false, matching, gap-fill
- Test genuine comprehension of the ${selectedTopic} theme
- Clear questions in German with English translations
- For multiple choice: 3-5 plausible options with translations
- For true-false: use "Richtig", "Falsch", "Nicht im Text"
- For matching: 3-6 related pairs with translations
- For gap-fill: focus on key vocabulary with options and translations
- Include explanations in English for all answers

Generate a complete ReadingText object with all required fields. Structure your response to strictly match the provided schema.`;

  try {
    console.log('[Streaming Generation API] Calling streamObject with Gemini');
    
    const result = await streamObject({
      model: google('models/gemini-2.5-flash'),
      schema: ReadingTextSchema,
      prompt,
      temperature: 0.7,
    });

    console.log('[Streaming Generation API] Creating manual streaming response');
    
    // Create a manual streaming response since there's no toDataStreamResponse
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
          console.error('[Streaming Generation API] Stream error:', error);
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
    console.error('[Streaming Generation API] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate reading exercise' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 