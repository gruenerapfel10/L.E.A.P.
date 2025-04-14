import { z } from 'zod';
import { ModalTypeDefinition, InteractionTypeTag, ModalGenerationContext, ModalMarkingContext } from '../types';

// --- Generation Schema (Separate Fields) ---
const TrueFalseSchema = z.object({
  question: z.string().describe("The question prompt instructing the user what to do."),
  statement: z.string().describe("The statement to be evaluated as true or false."),
  isTrue: z.boolean().describe("Whether the statement is true or false."),
  explanation: z.string().describe("Brief explanation of why the statement is true or false."),
  hint: z.string().optional().describe("Optional concise hint about what to consider (max 1 line)."),
  showHint: z.boolean().default(false).describe("Whether to show the hint by default."),
  topic: z.string().optional().describe("Optional topic or theme of the statement."),
});

// --- Marking Schema ---
const TrueFalseMarkingSchema = z.object({
  isCorrect: z.boolean().describe("Whether the user correctly identified if the statement is true or false."),
  feedback: z.string().describe("Feedback for the user, explaining why the statement is true or false."),
  correctAnswer: z.string().describe("The correct answer ('true' or 'false')."),
  score: z.number().min(0).max(100).describe("A score from 0 to 100.")
});

// --- Prompt Generation Function ---
function getTrueFalseGenerationPrompt(context: ModalGenerationContext): string {
  const {
    targetLanguage,
    sourceLanguage,
    difficulty,
    modulePrimaryTask = "Understand grammatical concepts",
    submodulePrimaryTask = "Apply specific grammatical rules",
    submoduleContext = {}
  } = context;

  let prompt = `You are an expert ${targetLanguage} linguist creating a true/false question for a ${sourceLanguage} speaker learning ${targetLanguage} at the ${difficulty} level.
The overall goal is: ${modulePrimaryTask}.
This specific task focuses on: ${submodulePrimaryTask}.
Submodule Context: ${typeof submoduleContext === 'string' ? submoduleContext : JSON.stringify(submoduleContext)}

Generate question data adhering EXACTLY to the following JSON schema:
\`\`\`json
${JSON.stringify(TrueFalseSchema.shape, null, 2)}
\`\`\`

**CRITICAL Instructions:**
1. Create a concise question asking the user to determine if a statement is true or false (e.g., "Is this statement true or false?").
2. Create a ${targetLanguage} statement that is either true or false regarding grammatical rules or language usage.
3. Place the question in the \`question\` field and the statement in the \`statement\` field.
4. Set 'isTrue' to whether the statement is actually true or false.
5. Provide a clear explanation of why the statement is true or false.
6. Optionally indicate the grammatical or vocabulary topic being tested.

Example output structure:
{
  "question": "Is this statement true or false?",
  "statement": "In German, all nouns are capitalized.",
  "isTrue": true,
  "explanation": "In German grammar, all nouns are indeed capitalized, unlike in English where only proper nouns are capitalized.",
  "topic": "Noun capitalization rules"
}

Ensure the statement is clear, unambiguous, and matches the difficulty level. The explanation should be educational.`;
  return prompt;
}

// --- Marking Prompt Generation Function ---
function getTrueFalseMarkingPrompt(context: ModalMarkingContext): string {
  const { questionData, userAnswer } = context;
  
  // Use question and statement directly instead of splitting content
  const questionPart = questionData?.question || '[Missing Question]';
  const statementPart = questionData?.statement || '[Missing Statement]';
  
  // Format expected vs user answer
  const isActuallyTrue = questionData?.isTrue === true;
  const userAnsweredTrue = userAnswer === true;
  
  return `You are an AI marking assistant for a ${questionData?.targetLanguage || 'target language'} learning exercise.
Task: Evaluate the user's answer to a true/false question about language rules or usage.

Question: ${questionPart}
Statement to verify: ${statementPart}
The statement is actually: ${isActuallyTrue ? 'TRUE' : 'FALSE'}
User answered: ${userAnsweredTrue ? 'TRUE' : 'FALSE'}

Correct explanation: ${questionData?.explanation || '[No explanation provided]'}

Evaluate if the user correctly identified whether the statement is true or false. Provide constructive feedback explaining why the statement is true or false, and why their answer was correct or incorrect. Assign a score (100 for correct, 0 for incorrect).

Respond ONLY with a JSON object adhering to this schema:
\`\`\`json
${JSON.stringify(TrueFalseMarkingSchema.shape, null, 2)}
\`\`\`
`;
}

// --- Modal Definition ---
export const trueFalseModalDefinition: ModalTypeDefinition = {
  id: 'true-false',
  modalFamily: 'true-false',
  interactionType: 'reading', // This is a reading comprehension task
  uiComponent: 'ReadingTrueFalse',
  title_en: 'True or False Statement',

  generationSchema: TrueFalseSchema,
  getGenerationPrompt: getTrueFalseGenerationPrompt,

  markingSchema: TrueFalseMarkingSchema,
  getMarkingPrompt: getTrueFalseMarkingPrompt,
}; 