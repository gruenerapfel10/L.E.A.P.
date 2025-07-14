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
    const { text, question, context } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!question || typeof question !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Question is required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[AI Question API] Processing question about text:', text.substring(0, 50) + '...');
    
    let prompt = `You are a helpful German language learning assistant. `;
    
    if (context) {
      prompt += `The user is reading a German text about "${context}". `;
    }
    
    prompt += `Answer the following question about this German text passage:

Selected text: "${text}"

Question: "${question}"

Please provide a clear, helpful answer in English that helps the user understand the text better. If the text is in German, explain any relevant German language aspects, vocabulary, or grammar structures that might be helpful for a C1 level German learner.`;

    const { text: answer } = await generateText({
      model: google('models/gemini-2.5-flash'),
      prompt,
      temperature: 0.5,
    });

    console.log('[AI Question API] Answer generated');
    
    return new Response(
      JSON.stringify({ 
        answer: answer.trim(),
        question,
        selectedText: text,
        context
      }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('[AI Question API] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process AI question' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 