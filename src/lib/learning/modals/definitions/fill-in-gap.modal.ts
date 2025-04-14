import { z } from 'zod';
import { ModalTypeDefinition, InteractionTypeTag, ModalGenerationContext, ModalMarkingContext } from '../types';

// --- Generation Schema (Separate Fields) ---
const FillInGapSchema = z.object({
  question: z.string().describe("The question prompt instructing the user what to do."),
  sentence: z.string().describe("The sentence with a gap marked by ____."),
  baseWord: z.string().describe("The base form of the word that needs to be declined (e.g., 'kalt' for adjectives, infinitive for verbs)."),
  correctAnswer: z.string().describe("The exact correct word or phrase that should fill the gap."),
  acceptableAnswers: z.array(z.string()).optional().describe("Optional array of alternative acceptable answers."),
  hint: z.string().optional().describe("Optional concise hint about what type of word or form is needed (max 1 line)."),
  showHint: z.boolean().default(false).describe("Whether to show the hint by default."),
  caseSensitive: z.boolean().default(false).describe("Whether the answer should be case-sensitive."),
  explanation: z.string().describe("Brief explanation of why the answer is correct."),
  category: z.string().optional().describe("Grammatical category being tested (e.g., 'verb conjugation', 'noun case')."),
});

// --- Marking Schema ---
const FillInGapMarkingSchema = z.object({
  isCorrect: z.boolean().describe("Whether the user's answer matches the correct or acceptable answers."),
  feedback: z.string().describe("Feedback for the user, explaining why their answer is correct or incorrect."),
  correctAnswer: z.string().describe("The expected correct answer."),
  score: z.number().min(0).max(100).describe("A score from 0 to 100.")
});

// --- Prompt Generation Function (Separate Fields) ---
function getFillInGapGenerationPrompt(context: ModalGenerationContext): string {
  const {
    targetLanguage,
    sourceLanguage,
    difficulty,
    modulePrimaryTask = "Apply grammatical concepts",
    submodulePrimaryTask = "Fill in appropriate word forms",
    submoduleContext = {}
  } = context;

  let prompt = `You are an expert ${targetLanguage} linguist creating a fill-in-the-gap exercise for a ${sourceLanguage} speaker learning ${targetLanguage} at the ${difficulty} level.
The overall goal is: ${modulePrimaryTask}.
This specific task focuses on: ${submodulePrimaryTask}.
Submodule Context: ${typeof submoduleContext === 'string' ? submoduleContext : JSON.stringify(submoduleContext)}

Generate question data adhering EXACTLY to the following JSON schema:
\`\`\`json
${JSON.stringify(FillInGapSchema.shape, null, 2)}
\`\`\`

**Instructions:**
1.  Populate the \`question\` field with a concise instruction for the user (e.g., "Fill in the correct form of the adjective 'kalt'").
2.  Populate the \`sentence\` field with a ${targetLanguage} sentence containing a gap, marking the gap with exactly four underscores: ____.
3.  Specify the \`baseWord\` field with the base form of the word that needs to be declined (e.g., 'kalt' for adjectives, infinitive for verbs).
4.  Specify the \`correctAnswer\` that should fill the gap.
5.  Include \`acceptableAnswers\` if there are any (e.g., synonyms).
6.  Provide a brief \`explanation\` of why the answer is correct.
7.  Optionally add a \`hint\` - keep it concise (max 1 line) and focused on the key grammatical point.
8.  Set \`showHint\` to false by default - hints should be revealed only when requested.
9.  Optionally add a \`category\` (type of grammar tested).

Example output structure:
{
  "question": "Fill in the correct form of the adjective 'kalt'.",
  "sentence": "Mit ____ Wasser vom Tisch wäscht er sein Auto.",
  "baseWord": "kalt",
  "correctAnswer": "kaltem",
  "acceptableAnswers": ["kaltem"],
  "hint": "Dative case, masculine/neuter gender, strong declension",
  "showHint": false,
  "caseSensitive": false,
  "explanation": "The adjective 'kalt' takes the ending '-em' in dative case with masculine/neuter nouns in strong declension.",
  "category": "adjective declension"
}

Ensure the sentence is clear and appropriate for the difficulty level. The gap should test a specific grammatical concept relevant to the submodule task.`;
  return prompt;
}

// --- Marking Prompt Generation Function (Separate Fields) ---
function getFillInGapMarkingPrompt(context: ModalMarkingContext): string {
  const { questionData, userAnswer } = context;
  
  // Use separate fields
  const questionPart = questionData?.question || '[Question Missing]'; 
  const sentencePart = questionData?.sentence || '[Sentence Missing]';
  
  const correctAnswer = questionData?.correctAnswer || '';
  const acceptableAnswers = questionData?.acceptableAnswers || [];
  const caseSensitive = questionData?.caseSensitive === true;
  const userAnswerText = userAnswer || '';
  const comparisonNote = caseSensitive 
    ? 'Case-sensitive comparison required' 
    : 'Case-insensitive comparison allowed';
  
  return `You are an AI marking assistant for a ${questionData?.targetLanguage || 'target language'} learning exercise.
Task: Evaluate the user's answer to a fill-in-the-gap exercise.

Question: ${questionPart}
Sentence with gap: ${sentencePart}
Correct answer: "${correctAnswer}"
Acceptable alternative answers: ${JSON.stringify(acceptableAnswers)}
${comparisonNote}
User answered: "${userAnswerText}"

Additional context: ${questionData?.hint || ''}
Expected explanation: ${questionData?.explanation || ''}

Evaluate if the user's answer matches the correct answer or any of the acceptable alternatives, considering case sensitivity settings. Provide constructive feedback explaining why their answer is correct or incorrect. Assign a score (100 for correct matches, partial score for close answers, 0 for incorrect answers).

Respond ONLY with a JSON object adhering to this schema:
\`\`\`json
${JSON.stringify(FillInGapMarkingSchema.shape, null, 2)}
\`\`\`
`;
}

// --- Modal Definition ---
export const fillInGapModalDefinition: ModalTypeDefinition = {
  id: 'fill-in-gap',
  modalFamily: 'fill-in-gap',
  interactionType: 'writing',
  uiComponent: 'WritingFillInGap',
  title_en: 'Fill in the Gap',

  generationSchema: FillInGapSchema,
  getGenerationPrompt: getFillInGapGenerationPrompt,

  markingSchema: FillInGapMarkingSchema,
  getMarkingPrompt: getFillInGapMarkingPrompt,
}; 