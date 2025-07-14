import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextRequest } from 'next/server';

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set');
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { text, sourceLanguage = 'German', targetLanguage = 'English' } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[Translation API] Translating text:', text.substring(0, 50) + '...');
    
    const prompt = `Translate the following ${sourceLanguage} text to ${targetLanguage}. 
    Provide a natural, accurate translation that maintains the original meaning and tone:

    "${text}"
    
    Only return the translation, nothing else.`;

    const { text: translation } = await generateText({
      model: google('models/gemini-2.5-flash'),
      prompt,
      temperature: 0.3,
    });

    console.log('[Translation API] Translation completed');
    
    return new Response(
      JSON.stringify({ 
        translation: translation.trim(),
        sourceText: text,
        sourceLanguage,
        targetLanguage
      }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('[Translation API] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to translate text' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 