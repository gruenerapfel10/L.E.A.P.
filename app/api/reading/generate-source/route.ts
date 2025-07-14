import { streamText } from "ai";
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { C1_TOPICS, getRandomTopic } from '../../../reading/lib/sourceGenerator';

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set');
}

// Initialize the Google client with the API key
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const runtime = 'edge';

export async function POST() {
  console.log('[Source Generation API] Starting source generation');
  
  const selectedTopic = getRandomTopic();
  console.log('[Source Generation API] Selected topic:', selectedTopic);
  
  const prompt = `Generate a German C1 level reading comprehension text focused on the topic: "${selectedTopic}".

The text should explore the theme of ${selectedTopic} in a way suitable for the Goethe C1 exam. Include:
1. A title in German with its English translation
2. The main text in German (200-300 words) with its English translation
3. The type of text (one of: informative, narrative, functional, opinion)

Important:
- Focus on exploring the ${selectedTopic} theme in depth
- Make the content challenging but appropriate for C1 level German learners
- Ensure the text has clear main ideas and supporting details about ${selectedTopic}
- Include varied vocabulary and complex grammatical structures appropriate for C1 level

Format the response as follows:
TOPIC: ${selectedTopic}
TITLE_DE: [German title]
TITLE_EN: [English title]
TYPE: [text type]
CONTENT_DE:
[German content]
CONTENT_EN:
[English content]
`;

  try {
    console.log('[Source Generation API] Calling Gemini API');
    const response = await streamText({
      model: google('models/gemini-2.5-flash'),
      prompt,
    });

    console.log('[Source Generation API] Got response from Gemini, converting to stream');
    const stream = response.toDataStream();
    
    console.log('[Source Generation API] Returning stream response');
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'x-vercel-ai-data-stream': 'v1'
      }
    });
  } catch (error) {
    console.error('[Source Generation API] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate reading text' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 