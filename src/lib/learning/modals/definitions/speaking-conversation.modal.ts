import { z } from 'zod';
import { ModalTypeDefinition, ModalGenerationContext, ModalMarkingContext } from '../types';

/**
 * Schema for the speaking conversation question generation
 * Defines the structure of what the AI should generate:
 * - Three distinct questions related to the language learning context
 * - Optional hint for help
 * - Option to show hint by default
 */
export const SpeakingConversationSchema = z.object({
  questions: z.array(z.string()).length(3).describe(
    "An array of exactly 3 conversational questions in the target language for the user to answer verbally. " +
    "Questions should be appropriate for the learner's level and related to the module/submodule topic."
  ),
  hint: z.string().optional().describe(
    "Optional hint to help the user formulate their response. For example, vocabulary suggestions or grammar tips."
  ),
  showHint: z.boolean().default(false).describe(
    "Whether to show the hint by default."
  ),
});

export type SpeakingConversationSchema = z.infer<typeof SpeakingConversationSchema>;

/**
 * Schema for the speaking conversation marking
 * Defines how the AI should evaluate the user's spoken answers
 */
export const SpeakingConversationMarkingSchema = z.object({
  isCorrect: z.boolean().describe("Whether the user's verbal answer was generally correct and appropriate."),
  score: z.number().min(0).max(100).describe("A score from 0 to 100 reflecting the quality of the response."),
  feedback: z.string().describe(
    "Constructive feedback for the user about their answer, including strengths and suggestions for improvement."
  ),
  correctAnswer: z.string().describe(
    "An example of a good answer to the question. Return an empty string (\"\") if the user's answer was already excellent."
  )
});

export type SpeakingConversationMarkingSchema = z.infer<typeof SpeakingConversationMarkingSchema>;

/**
 * Function to generate the prompt for creating speaking conversation questions
 */
export function getSpeakingConversationGenerationPrompt(context: ModalGenerationContext): string {
  const {
    targetLanguage,
    difficulty,
    modulePrimaryTask,
    submodulePrimaryTask,
    submoduleContext
  } = context;

  // Get language name for better prompting
  const languageNames: Record<string, string> = {
    'de': 'German',
    'fr': 'French',
    'es': 'Spanish',
    // Add more languages as needed
  };
  const languageName = languageNames[targetLanguage] || targetLanguage;

  // Define difficulty level descriptions
  const difficultyDescriptions: Record<string, string> = {
    'beginner': 'simple questions using basic vocabulary and grammar structures, suitable for A1-A2 level',
    'intermediate': 'moderately complex questions requiring more varied vocabulary and grammar, suitable for B1-B2 level',
    'advanced': 'sophisticated questions that may include idiomatic expressions and complex grammar, suitable for C1-C2 level'
  };

  const difficultyDesc = difficultyDescriptions[difficulty] || difficultyDescriptions['intermediate'];

  return `
You are a ${languageName} language tutor creating a speaking practice exercise.

Task: Create 3 conversational questions in ${languageName} for a ${difficulty} level student to answer verbally.

${modulePrimaryTask ? `Module focus: ${modulePrimaryTask}` : ''}
${submodulePrimaryTask ? `Specific topic: ${submodulePrimaryTask}` : ''}
${submoduleContext ? `Context: ${submoduleContext}` : ''}

Requirements:
- Generate exactly 3 ${languageName} questions that are ${difficultyDesc}.
- Questions should be related to the module focus and specific topic.
- Questions should encourage the student to use the grammar or vocabulary being studied.
- Questions should encourage responses of at least 2-3 sentences.
- Also provide a helpful hint that could assist the user in formulating their answer.

Example output format:
{
  "questions": [
    "Question 1 in ${languageName}?",
    "Question 2 in ${languageName}?",
    "Question 3 in ${languageName}?"
  ],
  "hint": "Consider using these vocabulary items or grammar structures in your response...",
  "showHint": false
}
`;
}

/**
 * Function to generate the prompt for marking a spoken answer
 */
export function getSpeakingConversationMarkingPrompt(context: ModalMarkingContext): string {
  const { 
    questionData, 
    userAnswer, 
    submoduleContext 
  } = context;

  // Extract the original question and the user's transcript
  const originalQuestion = questionData.questions[userAnswer.questionIndex];
  const userTranscript = userAnswer.transcript || '';

  return `
You are a language tutor evaluating a student's spoken response. The student was asked to respond to a question in the target language, and their response was transcribed using speech-to-text.

Original Question: "${originalQuestion}"

Student's Transcribed Response: "${userTranscript}"

${submoduleContext ? `Context/Topic: ${submoduleContext}` : ''}

Task: Evaluate the student's response based on the following criteria:
1. Relevance to the question
2. Grammatical accuracy (considering that speech recognition may introduce some errors)
3. Vocabulary usage
4. Fluency and coherence

Be fair and understanding that this was a spoken response that went through transcription, so minor errors or odd phrasing might be due to the speech recognition process rather than the student's actual speaking.

Provide your evaluation in the following format:
{
  "isCorrect": true/false (was the answer generally appropriate and on-topic?),
  "score": A number from 0-100,
  "feedback": "Your constructive feedback here, mentioning strengths and areas for improvement",
  "correctAnswer": "An example of a good answer or correction if needed. Leave empty string if the student's answer was already excellent."
}
`;
}

/**
 * The modal definition for speaking conversation exercises
 */
export const speakingConversationModalDefinition: ModalTypeDefinition = {
  id: 'speaking-conversation',
  modalFamily: 'speaking-practice',
  interactionType: 'speaking',
  uiComponent: 'SpeakingConversation',
  title_en: 'Speaking Practice',

  generationSchema: SpeakingConversationSchema,
  getGenerationPrompt: getSpeakingConversationGenerationPrompt,

  markingSchema: SpeakingConversationMarkingSchema,
  getMarkingPrompt: getSpeakingConversationMarkingPrompt,
}; 