import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { WritingRubricSchema } from '../../../writing/lib/writingSchemas';

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set');
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const runtime = 'edge';

export async function POST(request: Request) {
  console.log('[Writing Evaluation API] Starting comprehensive evaluation');
  
  try {
    const body = await request.json();
    const { prompt, submission } = body;

    if (!prompt || !submission || !submission.content) {
      return new Response(
        JSON.stringify({ error: 'Missing prompt or submission content' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const evaluationPrompt = `Evaluate this German C1 level writing submission according to Goethe exam standards with COMPREHENSIVE analysis for detailed progress tracking.

WRITING PROMPT:
Type: ${prompt.type}
Topic: ${prompt.topic}
Prompt: ${prompt.prompt}
Requirements: ${prompt.requirements.join(', ')}
Word Count Range: ${prompt.wordCountMin}-${prompt.wordCountMax} words
Time Limit: ${prompt.timeLimit} minutes

STUDENT SUBMISSION:
Content: ${submission.content}
Word Count: ${submission.wordCount} words
Time Spent: ${submission.timeSpent} minutes

COMPREHENSIVE EVALUATION REQUIRED:

1. CORE ASSESSMENT CRITERIA (0-100 each):
   - Task Fulfillment: Did the student address all aspects of the prompt?
   - Coherence and Cohesion: Is the text well-organized with clear structure?
   - Vocabulary and Language Range: Appropriate and varied vocabulary for C1 level?
   - Grammar and Accuracy: Correct use of complex grammatical structures?
   - Appropriateness of Style: Suitable register and tone for the task?

2. GRANULAR GRAMMAR ANALYSIS:
   - Identify ALL grammar mistakes with:
     * Type (verb-tense, subject-verb-agreement, article-usage, preposition-errors, word-order, case-errors, plural-forms, adjective-declension, modal-verbs, conditional-forms, passive-voice, subjunctive-mood, other)
     * Original text and corrected text
     * Detailed explanation
     * Severity (minor, moderate, major)
     * Position in text (approximate)

3. VOCABULARY USAGE ANALYSIS:
   - Total words, unique words, advanced words count
   - Identify repeated words as array of objects with word and count properties (e.g., [{word: "sehr", count: 3}, {word: "aber", count: 2}])
   - List inappropriate word choices with suggestions
   - Identify missed opportunities for better vocabulary
   - Assess if vocabulary is level-appropriate
   - Rate vocabulary range (limited, adequate, good, excellent)

4. WRITING METRICS:
   - Calculate words per minute and characters per minute
   - Analyze average sentence length and paragraph count
   - Estimate revision patterns and writing flow
   - Count sentences and paragraphs

5. STRUCTURAL ANALYSIS:
   - Check for introduction and conclusion
   - Count body paragraphs
   - Evaluate paragraph transitions
   - Rate overall structure, logical flow, and argument development

6. STYLE ANALYSIS:
   - Assess formality level (too-informal, appropriate, too-formal)
   - Evaluate consistency and register
   - Rate tone and idiomatic expression usage
   - Check cultural appropriateness

7. DETAILED FEEDBACK:
   - List 3-5 specific strengths
   - List 3-5 areas for improvement
   - Suggest 5-8 key German phrases for this writing type
   - Provide next steps for improvement
   - Recommend specific practice areas with priorities

8. METADATA:
   - Include evaluation timestamp
   - Specify AI model and version used

Be thorough, constructive, and provide actionable feedback. Focus on helping the student improve their German writing skills at C1 level. Each grammar mistake should be precisely identified with clear corrections and explanations.

Return a complete WritingRubric object with all required fields filled comprehensively.`;

    console.log('[Writing Evaluation API] Calling generateObject with enhanced prompt');
    
    const startTime = Date.now();
    const result = await generateObject({
      model: google('models/gemini-2.5-flash'),
      schema: WritingRubricSchema,
      prompt: evaluationPrompt,
      temperature: 0.3, // Lower temperature for more consistent evaluation
    });
    const endTime = Date.now();

    // Add metadata to the evaluation
    const enhancedEvaluation = {
      ...result.object,
      id: `eval-${Date.now()}`,
      submissionId: submission.id,
      evaluatedAt: new Date().toISOString(),
      timeToEvaluate: Math.round((endTime - startTime) / 1000),
      aiModel: 'gemini-2.5-flash',
      evaluatorVersion: '1.0.0',
    };

    console.log('[Writing Evaluation API] Comprehensive evaluation completed');
    
    return new Response(JSON.stringify(enhancedEvaluation), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('[Writing Evaluation API] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to evaluate writing submission' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 