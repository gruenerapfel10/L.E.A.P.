import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { ReadingTextSchema, type ReadingText } from './questionSchemas';
import { v4 as uuidv4 } from 'uuid';
import { type ReadingSource } from './sourceGenerator';

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set');
}

// Initialize the Google client with the API key
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function generateQuestions(source: ReadingSource): Promise<ReadingText> {
  console.log('[questionGenerator] Starting question generation for source:', source);
  
  const prompt = `Generate questions for the following German C1 level reading comprehension text:

Title (German): ${source.title}
Title (English): ${source.titleTranslation}

Text (German):
${source.content}

Text (English):
${source.contentTranslation}

Generate 3-5 questions that best test comprehension of this text. Choose appropriate question types based on the content:

Available question types:
- Multiple choice (type: 'multiple-choice'): Best for testing specific details or main ideas
- True/False/Not Given (type: 'true-false'): Good for testing factual understanding and inference
- Matching (type: 'matching'): Ideal for connecting related concepts or testing vocabulary in context
- Gap fill (type: 'gap-fill'): Great for testing understanding of specific language use or key terms

For each question:
- Choose the most appropriate type for what you want to test
- Write clear, unambiguous questions in German with English translations
- For multiple choice: provide 3-5 plausible options
- For matching: provide 3-6 related pairs
- For gap fill: focus on key vocabulary or important concepts
- Include clear explanations in English for all answers

Important: 
- Focus on testing genuine comprehension, not just memorization
- Mix question types naturally based on what makes sense for the content
- Ensure questions progress from more straightforward to more challenging
`;

  try {
    console.log('[questionGenerator] Calling Gemini API with prompt');
    const { object } = await generateObject<ReadingText>({
      model: google('models/gemini-2.5-flash'),
      schema: ReadingTextSchema,
      prompt,
      temperature: 0.7,
    });
    console.log('[questionGenerator] Received response from Gemini:', object);

    // Combine the source text with generated questions
    const readingText: ReadingText = {
      ...object,
      id: source.id,
      title: source.title,
      titleTranslation: source.titleTranslation,
      content: source.content,
      contentTranslation: source.contentTranslation,
      type: source.type,
      difficulty: source.difficulty,
      questions: object.questions.map(q => ({
        ...q,
        id: uuidv4()
      }))
    };
    console.log('[questionGenerator] Created final reading text:', readingText);

    return readingText;
  } catch (error) {
    console.error('[questionGenerator] Error generating questions:', error);
    throw error;
  }
} 