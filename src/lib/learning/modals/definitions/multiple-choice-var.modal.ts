import { z } from 'zod';
import { ModalTypeDefinition, ModalGenerationContext, ModalMarkingContext } from '../types';
import { WordDetailSchema } from './multiple-choice.modal'; // Reuse WordDetailSchema

// --- Generation Schema Variation (Combined Content) ---
const MultipleChoiceVarSchema = z.object({
  content: z.string().describe("The question, followed by a double newline (\\n\\n), followed by the sentence."),
  sentenceStructure: z.array(WordDetailSchema).optional().describe("Structured breakdown of the sentence part (optional)."),
  targetReplace: z.string().describe("The word/placeholder in the sentence part that needs to be replaced/chosen."),
  targetReplaceWith: z.string().describe("Placeholder indicating where the choice goes (e.g., '__' or the base word like 'groß__')."),
  options: z.array(z.string()).min(2).max(5).describe("An array of full word options (e.g., ['großen', 'große', 'großer', 'großes']). The correct answer must be one of the options."),
  correctOptionIndex: z.number().min(0).describe("The 0-based index of the correct option in the options array."),
  targetWordBase: z.string().optional().describe("The base form of the target word (e.g., 'groß') for dictionary lookup."),
  explanation: z.string().optional().describe("A brief explanation of why the correct option is right.")
});

// --- Marking Schema Variation (Combined Content) ---
const MultipleChoiceVarMarkingSchema = z.object({
    isCorrect: z.boolean().describe("Whether the user selected the correct full word."),
    feedback: z.string().describe("Feedback for the user, explaining the choice."),
    correctAnswer: z.string().describe("The correct full word option."),
    score: z.number().min(0).max(100).describe("A score from 0 to 100.")
});

// --- Prompt Generation Function Variation (Combined Content) ---
function getMultipleChoiceVarGenerationPrompt(context: ModalGenerationContext): string {
  const {
    targetLanguage,
    sourceLanguage,
    difficulty,
    modulePrimaryTask = "Translate or understand grammatical concepts",
    submodulePrimaryTask = "Apply specific grammatical rules",
    submoduleContext = {}
  } = context;

  let prompt = `You are an expert ${targetLanguage} linguist creating a multiple-choice question (full word focus) for a ${sourceLanguage} speaker learning ${targetLanguage} at the ${difficulty} level.
The overall goal is: ${modulePrimaryTask}.
This specific task focuses on: ${submodulePrimaryTask}.
Submodule Context: ${typeof submoduleContext === 'string' ? submoduleContext : JSON.stringify(submoduleContext)}

Generate question data adhering EXACTLY to the following JSON schema:
\`\`\`json
${JSON.stringify(MultipleChoiceVarSchema.shape, null, 2)}
\`\`\`

**Instructions:**
1.  Create a clear question related to the submodule task.
2.  Provide a ${targetLanguage} sentence that requires the user to choose the correct form of a specific word (the target word), often using a placeholder like \"______\".
3.  Combine the question and the sentence into the single \`content\` field, separated by exactly one double newline (\\n\\n).
    Example: "Choose the correct form of the adjective.\\n\\nIch habe das ______ Auto gesehen."
4.  Identify the target placeholder/word in the sentence (\`targetReplace\`).
5.  Provide the placeholder again or the base word (\`targetReplaceWith\`) indicating where the choice fits.
6.  Provide an array (\`options\`) containing 2-5 plausible **full word** options. One MUST be the correct full word. Others should be common errors.
7.  Indicate the 0-based index (\`correctOptionIndex\`) of the single correct full word option.
8.  Provide the base form (\`targetWordBase\`) if applicable.
9.  Optionally add a concise \`explanation\`.
10. Optionally include \`sentenceStructure\`.

Example output structure (focus on FULL WORD options):
{
  "content": "Choose the correct form of the adjective.\n\nIch habe das ______ Auto gesehen.",
  "targetReplace": "______",
  "targetReplaceWith": "______",
  "options": ["neue", "neuen", "neues", "neuer"],
  "correctOptionIndex": 2,
  "targetWordBase": "neu",
  "explanation": "'Auto' is neuter accusative, requiring the '-es' ending after 'das'."
}`;
  return prompt;
}

// --- Marking Prompt Generation Function Variation (Combined Content) ---
function getMultipleChoiceVarMarkingPrompt(context: ModalMarkingContext): string {
  const { questionData, userAnswer, submoduleContext = {} } = context;
  const userSelectedIndex = userAnswer; // Assuming userAnswer is the index
  const correctIndex = questionData?.correctOptionIndex;
  const options = questionData?.options;
  const userSelectedWord = options?.[userSelectedIndex] ?? "[Invalid Index]";
  const correctWord = options?.[correctIndex] ?? "[Correct Index Invalid]";

  // Derive question/sentence from content for context
  const contentParts = questionData?.content?.split('\n\n') || ['[Missing Content]', ''];
  const questionPart = contentParts[0];
  const sentencePart = contentParts.length > 1 ? contentParts[1] : '[Missing Sentence Part]';

  return `You are an AI marking assistant for a ${questionData?.targetLanguage || 'target language'} learning exercise.
Task: Evaluate the user's answer to a multiple-choice question where they selected a full word.
Submodule Context: ${typeof submoduleContext === 'string' ? submoduleContext : JSON.stringify(submoduleContext)}

Question: ${questionPart}
Sentence Context: ${sentencePart}
Options (Full Words): ${JSON.stringify(options)}
Correct Option: "${correctWord}" (Index ${correctIndex})

User's Selected Option (Index ${userSelectedIndex}): "${userSelectedWord}"

Evaluate the user's selection. Provide feedback explaining *why* their choice is right or wrong, referencing the grammar rule if possible. Determine if the selected word is correct. Assign a score (100 for correct, 0 for incorrect).

Respond ONLY with a JSON object adhering to this schema:
\`\`\`json
${JSON.stringify(MultipleChoiceVarMarkingSchema.shape, null, 2)}
\`\`\`
`;
}

// --- Modal Definition Variation ---
export const multipleChoiceVarModalDefinition: ModalTypeDefinition = {
  id: 'multiple-choice-var',
  modalFamily: 'multiple-choice',
  interactionType: 'writing',
  uiComponent: 'MultipleChoiceModal',
  title_en: 'Multiple Choice (Full Word)',

  generationSchema: MultipleChoiceVarSchema,
  getGenerationPrompt: getMultipleChoiceVarGenerationPrompt,

  markingSchema: MultipleChoiceVarMarkingSchema,
  getMarkingPrompt: getMultipleChoiceVarMarkingPrompt,
}; 