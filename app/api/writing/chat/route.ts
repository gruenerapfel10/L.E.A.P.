import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set');
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const runtime = 'edge';

export async function POST(request: Request) {
  console.log('[Writing Chat API] Starting chat response');
  
  try {
    const body = await request.json();
    const { message, exercise, evaluation, chatHistory } = body;

    if (!message || !exercise || !evaluation) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Build context from the exercise and evaluation
    const essayContent = exercise.submission?.content || '';
    const prompt = exercise.prompt;
    const rubric = evaluation;

    // Format chat history for context
    const chatHistoryText = chatHistory
      .map((msg: any) => `${msg.role === 'user' ? 'Student' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const systemPrompt = `You are a helpful German language writing tutor. You have evaluated a student's C1 level German essay and are now providing personalized feedback and assistance.

ESSAY DETAILS:
Topic: ${prompt.topic}
Type: ${prompt.type}
Requirements: ${prompt.requirements.join(', ')}
Word Count: ${exercise.submission?.wordCount || 0} words
Time Spent: ${exercise.submission?.timeSpent || 0} minutes

STUDENT'S ESSAY:
${essayContent}

EVALUATION RESULTS:
Overall Score: ${rubric.overallScore}%
Task Fulfillment: ${rubric.criteria.taskFulfillment}%
Coherence & Cohesion: ${rubric.criteria.coherenceAndCohesion}%
Vocabulary & Language: ${rubric.criteria.vocabularyAndLanguageRange}%
Grammar & Accuracy: ${rubric.criteria.grammarAndAccuracy}%
Style: ${rubric.criteria.appropriatenessOfStyle}%

SPECIFIC FEEDBACK:
Strengths: ${rubric.strengths.join(', ')}
Areas for Improvement: ${rubric.areasForImprovement.join(', ')}

GRAMMAR MISTAKES: ${rubric.grammarMistakes.length} total
${rubric.grammarMistakes.map((mistake: any) => `- ${mistake.type}: "${mistake.originalText}" → "${mistake.correctedText}" (${mistake.explanation})`).join('\n')}

VOCABULARY ANALYSIS:
Total Words: ${rubric.vocabularyUsage.totalWords}
Unique Words: ${rubric.vocabularyUsage.uniqueWords}
Advanced Words: ${rubric.vocabularyUsage.advancedWords}
Vocabulary Range: ${rubric.vocabularyUsage.vocabularyRange}

STRUCTURAL ANALYSIS:
Has Introduction: ${rubric.structuralAnalysis.hasIntroduction}
Has Conclusion: ${rubric.structuralAnalysis.hasConclusion}
Body Paragraphs: ${rubric.structuralAnalysis.bodyParagraphs}
Overall Structure: ${rubric.structuralAnalysis.overallStructure}

STYLE ANALYSIS:
Formality: ${rubric.styleAnalysis.formality}
Consistency: ${rubric.styleAnalysis.consistency}
Register: ${rubric.styleAnalysis.register}
Tone: ${rubric.styleAnalysis.tone}

PREVIOUS CHAT HISTORY:
${chatHistoryText}

INSTRUCTIONS:
1. Provide specific, actionable feedback related to the student's question
2. Reference specific parts of their essay when relevant
3. Explain grammar rules clearly with examples
4. Suggest concrete improvements and alternatives
5. Be encouraging and supportive while being honest about areas for improvement
6. Use the comprehensive evaluation data to provide detailed, personalized responses
7. When discussing grammar, reference the specific mistakes found in the evaluation
8. When discussing vocabulary, suggest specific German words or phrases that would improve their writing
9. For structural questions, refer to the structural analysis
10. Keep responses focused and practical

Respond to the student's message in a helpful, encouraging, and educational manner.`;

    const userPrompt = `Student's question: ${message}`;

    console.log('[Writing Chat API] Calling generateText with comprehensive context');
    
    const result = await generateText({
      model: google('models/gemini-2.5-flash'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxTokens: 1000,
    });

    console.log('[Writing Chat API] Generated response');
    
    return new Response(JSON.stringify({
      response: result.text
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('[Writing Chat API] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate chat response' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 