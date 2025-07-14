import { streamText } from "ai";
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextRequest } from 'next/server';
import { z } from 'zod';

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set');
}

// Initialize the Google client with the API key
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const runtime = 'edge';

// Evaluation request schema
const EvaluationRequestSchema = z.object({
  audio_content: z.object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    topic: z.string(),
    transcript_de: z.string(),
    transcript_en: z.string(),
    questions: z.array(z.object({
      id: z.string(),
      type: z.string(),
      question: z.string(),
      correct_answer: z.string(),
      explanation: z.string().optional(),
      points: z.number(),
    })),
  }),
  submission: z.object({
    answers: z.record(z.string(), z.string()),
    time_taken_seconds: z.number(),
  }),
});

export async function POST(request: NextRequest) {
  console.log('[Listening Evaluation API] Starting evaluation');
  
  try {
    const body = await request.json();
    console.log('[Listening Evaluation API] Request body received');
    
    // Validate request
    const validatedRequest = EvaluationRequestSchema.parse(body);
    const { audio_content, submission } = validatedRequest;
    
    console.log('[Listening Evaluation API] Evaluating', Object.keys(submission.answers).length, 'answers');
    
    // Calculate basic scores
    const totalQuestions = audio_content.questions.length;
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;
    
    const detailedFeedback = audio_content.questions.map(question => {
      const userAnswer = submission.answers[question.id] || '';
      const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(question.correct_answer);
      
      if (isCorrect) {
        correctAnswers++;
        earnedPoints += question.points;
      }
      totalPoints += question.points;
      
      return {
        question_id: question.id,
        question: question.question,
        user_answer: userAnswer,
        correct_answer: question.correct_answer,
        is_correct: isCorrect,
        explanation: question.explanation || '',
        points_earned: isCorrect ? question.points : 0,
        points_possible: question.points,
      };
    });
    
    const scorePercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    
    // Generate AI feedback
    const prompt = generateEvaluationPrompt(
      audio_content,
      submission,
      detailedFeedback,
      scorePercentage,
      correctAnswers,
      totalQuestions
    );
    
    console.log('[Listening Evaluation API] Generating AI feedback');
    
    const response = await streamText({
      model: google('models/gemini-2.5-flash'),
      prompt,
    });

    console.log('[Listening Evaluation API] Got response from Gemini, converting to stream');
    const stream = response.toDataStream();
    
    console.log('[Listening Evaluation API] Returning stream response');
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'x-vercel-ai-data-stream': 'v1'
      }
    });
    
  } catch (error) {
    console.error('[Listening Evaluation API] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to evaluate listening submission' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

function normalizeAnswer(answer: string): string {
  return answer.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

function generateEvaluationPrompt(
  audioContent: any,
  submission: any,
  detailedFeedback: any[],
  scorePercentage: number,
  correctAnswers: number,
  totalQuestions: number
): string {
  const timeMinutes = Math.round(submission.time_taken_seconds / 60);
  
  return `Evaluate this German C1 listening comprehension test performance and provide detailed feedback.

AUDIO CONTENT:
- Type: ${audioContent.type}
- Title: ${audioContent.title}
- Topic: ${audioContent.topic}

PERFORMANCE SUMMARY:
- Score: ${correctAnswers}/${totalQuestions} (${scorePercentage}%)
- Time taken: ${timeMinutes} minutes
- Audio type: ${audioContent.type}

DETAILED ANSWERS:
${detailedFeedback.map((item, index) => `
Question ${index + 1}: ${item.question}
User Answer: "${item.user_answer}"
Correct Answer: "${item.correct_answer}"
Result: ${item.is_correct ? 'CORRECT' : 'INCORRECT'}
Points: ${item.points_earned}/${item.points_possible}
`).join('')}

TRANSCRIPT CONTEXT:
German: ${audioContent.transcript_de.substring(0, 500)}...
English: ${audioContent.transcript_en.substring(0, 500)}...

Please provide a comprehensive evaluation in the following format:

OVERALL_FEEDBACK:
[Provide overall assessment of performance in German and English, considering the C1 level requirements]

STRENGTHS:
[List 3-5 specific strengths demonstrated in this test]
- [Strength 1]
- [Strength 2]
- [Strength 3]

AREAS_FOR_IMPROVEMENT:
[List 3-5 specific areas needing improvement]
- [Area 1 with specific suggestions]
- [Area 2 with specific suggestions]
- [Area 3 with specific suggestions]

LISTENING_SKILLS_ANALYSIS:
[Analyze performance across different listening skills:]
- Main idea comprehension: [Assessment]
- Detail recognition: [Assessment]
- Inference and implication: [Assessment]
- Speaker attitude/opinion: [Assessment]
- Cultural context understanding: [Assessment]

RECOMMENDATIONS:
[Provide specific study recommendations based on performance]
- [Recommendation 1]
- [Recommendation 2]
- [Recommendation 3]

NEXT_STEPS:
[Suggest specific next steps for improvement]
- [Next step 1]
- [Next step 2]
- [Next step 3]

SCORE_INTERPRETATION:
[Interpret the score in context of C1 level expectations]
${scorePercentage >= 90 ? 'Excellent performance - demonstrates strong C1 listening skills' :
  scorePercentage >= 70 ? 'Good performance - solid C1 level with room for improvement' :
  scorePercentage >= 50 ? 'Developing performance - approaching C1 level' :
  'Needs improvement - below C1 expectations'}

Focus on providing constructive, specific feedback that helps the learner understand their current level and how to improve. Consider the complexity of C1-level listening comprehension and the specific challenges of the ${audioContent.type} format.`;
} 