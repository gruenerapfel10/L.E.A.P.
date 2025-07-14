import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { ReadingTextSchema, type ReadingText } from '../../../reading/lib/questionSchemas';
import { v4 as uuidv4 } from 'uuid';

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set');
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const runtime = 'edge';

export async function POST() {
  console.log('[Complete Generation API] Starting complete generation');
  
  const prompt = `Generate a complete German C1 level reading comprehension exercise.

Create:
1. A German reading text (200-300 words) about a contemporary topic suitable for Goethe C1 exam
2. 3-5 comprehension questions of different types

Text requirements:
- Contemporary and engaging topic
- Challenging but appropriate for C1 level
- Clear main ideas and supporting details
- Varied vocabulary and complex grammatical structures
- Include German title with English translation
- Include German content with English translation
- Specify text type (informative, narrative, functional, opinion)

Question requirements:
- Mix of question types: multiple-choice, true-false, matching, gap-fill
- Test genuine comprehension, not memorization
- Clear questions in German with English translations
- For multiple choice: 3-5 plausible options with translations
- For true-false: use "Richtig", "Falsch", "Nicht im Text"
- For matching: 3-6 related pairs with translations
- For gap-fill: focus on key vocabulary with options and translations
- Include explanations in English for all answers

Generate a complete ReadingText object with all required fields.`;

  try {
    console.log('[Complete Generation API] Calling Gemini API');
    const { object } = await generateObject<ReadingText>({
      model: google('models/gemini-2.5-flash'),
      schema: ReadingTextSchema,
      prompt,
      temperature: 0.7,
    });

    console.log('[Complete Generation API] Generated object:', object);

    // Add IDs to the object
    const completeReadingText: ReadingText = {
      ...object,
      id: uuidv4(),
      questions: object.questions.map(q => ({
        ...q,
        id: uuidv4()
      }))
    };

    console.log('[Complete Generation API] Returning complete reading text');
    return new Response(JSON.stringify(completeReadingText), {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    console.error('[Complete Generation API] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate reading exercise' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 