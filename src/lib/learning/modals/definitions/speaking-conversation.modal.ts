import { z } from 'zod';
import { ModalTypeDefinition, InteractionTypeTag, ModalGenerationContext, ModalMarkingContext } from '../types';

// --- Generation Schema ---
const SpeakingConversationSchema = z.object({
  questions: z.array(z.object({
    content: z.string().describe("The question to be asked in the target language, with proper pronunciation and grammar."),
    expectedAnswers: z.array(z.string()).describe("Array of acceptable answers or key phrases the user might include."),
    difficulty: z.string().optional().describe("The difficulty level of this question (beginner, intermediate, advanced)."),
    contextNotes: z.string().optional().describe("Optional contextual information or notes about this question."),
  })).min(1).max(5).describe("An array of questions to ask the user. Start with simpler questions and gradually increase complexity."),
  conversationTheme: z.string().describe("The overall theme or topic of the conversation, such as 'Shopping', 'Restaurant', or 'Travel'."),
  hint: z.string().optional().describe("Optional concise hint about what vocabulary or grammar to use (max 1 line)."),
  showHint: z.boolean().default(false).describe("Whether to show the hint by default."),
  targetLanguageInstructions: z.string().describe("Brief instructions about the conversation in the target language."),
  sourceLanguageInstructions: z.string().describe("Brief instructions about the conversation in the source language."),
});

export type SpeakingConversationSchema = z.infer<typeof SpeakingConversationSchema>;

// --- Marking Schema ---
const SpeakingConversationMarkingSchema = z.object({
  isCorrect: z.boolean().describe("Whether the user's spoken answer was correct or acceptable."),
  score: z.number().min(0).max(100).describe("A score from 0 to 100 based on how well the user answered."),
  feedback: z.string().describe("Constructive feedback for the user, explaining what was good and what could be improved."),
  correctAnswer: z.string().describe("A sample correct answer or key points that should have been included."),
  pronunciation: z.object({
    score: z.number().min(0).max(100).describe("Pronunciation score from 0 to 100."),
    feedback: z.string().describe("Specific feedback about pronunciation."),
    problemWords: z.array(z.string()).optional().describe("Words that were mispronounced."),
  }).optional(),
  grammar: z.object({
    score: z.number().min(0).max(100).describe("Grammar score from 0 to 100."),
    feedback: z.string().describe("Specific feedback about grammar."),
    corrections: z.array(z.object({
      original: z.string(),
      correction: z.string(),
      explanation: z.string(),
    })).optional(),
  }).optional(),
  fluency: z.object({
    score: z.number().min(0).max(100).describe("Fluency score from 0 to 100."),
    feedback: z.string().describe("Specific feedback about speaking fluency."),
  }).optional(),
});

// --- Generation Prompt Function ---
function getSpeakingConversationGenerationPrompt(context: ModalGenerationContext): string {
  const {
    targetLanguage,
    sourceLanguage,
    difficulty,
    modulePrimaryTask = "Practical conversation skills",
    submodulePrimaryTask = "Answer questions in a conversational context",
    submoduleContext = {}
  } = context;

  let prompt = `You are an expert ${targetLanguage} conversation instructor creating a speaking practice exercise for a ${sourceLanguage} speaker learning ${targetLanguage} at the ${difficulty} level.
The overall goal is: ${modulePrimaryTask}.
This specific task focuses on: ${submodulePrimaryTask}.
Submodule Context: ${typeof submoduleContext === 'string' ? submoduleContext : JSON.stringify(submoduleContext)}

Generate question data adhering EXACTLY to the following JSON schema:
\`\`\`json
${JSON.stringify(SpeakingConversationSchema.shape, null, 2)}
\`\`\`

**Instructions:**
1. Create 2-3 questions in ${targetLanguage} that form a natural conversation progression.
2. The questions should be appropriate for the ${difficulty} level.
3. For each question, provide an array of acceptable answers or key phrases.
4. Start with simpler questions and gradually increase complexity.
5. Select a conversation theme relevant to the submodule context.
6. Provide brief instructions in both ${targetLanguage} and ${sourceLanguage}.
7. Include a helpful hint about what vocabulary or grammar to use (optional).

Example output structure:
{
  "questions": [
    {
      "content": "Wie heißt du?",
      "expectedAnswers": ["Ich heiße...", "Mein Name ist...", "Ich bin..."],
      "difficulty": "beginner"
    },
    {
      "content": "Woher kommst du?",
      "expectedAnswers": ["Ich komme aus...", "Ich bin aus...", "Ich wohne in..."],
      "difficulty": "beginner"
    },
    {
      "content": "Was machst du gerne in deiner Freizeit?",
      "expectedAnswers": ["Ich spiele gerne...", "Ich lese gerne...", "In meiner Freizeit..."],
      "difficulty": "intermediate",
      "contextNotes": "Tests vocabulary related to hobbies and free time activities"
    }
  ],
  "conversationTheme": "Personal Introduction",
  "hint": "Use the present tense and remember to conjugate verbs correctly.",
  "showHint": false,
  "targetLanguageInstructions": "Bitte antworten Sie auf Deutsch auf die folgenden Fragen.",
  "sourceLanguageInstructions": "Please answer the following questions in German."
}`;

  return prompt;
}

// --- Marking Prompt Function ---
function getSpeakingConversationMarkingPrompt(context: ModalMarkingContext): string {
  const { questionData, userAnswer } = context;
  
  // Extract the specific question being answered
  const questionIndex = typeof userAnswer?.questionIndex === 'number' ? userAnswer.questionIndex : 0;
  const specificQuestion = questionData?.questions?.[questionIndex] || { content: '[Question missing]', expectedAnswers: [] };
  
  const question = specificQuestion.content;
  const expectedAnswers = specificQuestion.expectedAnswers || [];
  const spokenResponse = userAnswer?.transcript || '[No response]';
  
  return `You are an AI language assessment assistant evaluating spoken responses in a ${questionData?.targetLanguage || 'target language'} conversation exercise.

Task: Evaluate the user's spoken answer to a conversation question.

Question: "${question}"
Expected answers or key elements: ${JSON.stringify(expectedAnswers)}
User's spoken response: "${spokenResponse}"

Evaluate the response based on:
1. Content: Does it address the question appropriately?
2. Grammar: Are there any grammatical errors?
3. Pronunciation: Based on the transcript, can you infer any likely pronunciation issues?
4. Fluency: Does the response demonstrate appropriate language use?

Be encouraging but provide specific feedback for improvement. For beginners, focus on basic communication rather than perfection. For intermediate/advanced levels, provide more detailed feedback on grammar and vocabulary.

Respond ONLY with a JSON object adhering to this schema:
\`\`\`json
${JSON.stringify(SpeakingConversationMarkingSchema.shape, null, 2)}
\`\`\`
`;
}

// --- Modal Definition ---
export const speakingConversationModalDefinition: ModalTypeDefinition = {
  id: 'speaking-conversation',
  modalFamily: 'speaking',
  interactionType: 'speaking',
  uiComponent: 'SpeakingConversation',
  title_en: 'Speaking Practice',

  generationSchema: SpeakingConversationSchema,
  getGenerationPrompt: getSpeakingConversationGenerationPrompt,

  markingSchema: SpeakingConversationMarkingSchema,
  getMarkingPrompt: getSpeakingConversationMarkingPrompt,
}; 