import { z } from 'zod';
import { ModalTypeDefinition, InteractionTypeTag, ModalGenerationContext, ModalMarkingContext } from '../types';

// Schema for individual words in the structured sentence
export const WordDetailSchema = z.object({
  content: z.string().describe("The actual word or token in the sentence."),
  type: z.string().describe("The grammatical type (e.g., 'article', 'noun', 'adjective', 'verb')."),
  target: z.boolean().describe("Is this word the target for modification/testing?")
});

// --- Generation Schema (Combined Content) ---
export const MultipleChoiceSchema = z.object({
  content: z.string().describe("The question, followed by a double newline (\\n\\n), followed by the sentence."),
  sentenceStructure: z.array(WordDetailSchema).optional().describe("Structured breakdown of the sentence part."),
  targetReplace: z.string().describe("The word in the sentence part that needs its ending completed."),
  targetReplaceWith: z.string().describe("The base of the target word plus a separator (e.g., 'groß-', 'ein-')."),
  options: z.array(z.string()).min(2).max(5).describe("An array of possible endings (e.g., ['-en', '-e', '-es']). The correct ending must be one of the options."),
  correctOptionIndex: z.number().min(0).describe("The 0-based index of the correct ending option."),
  targetWordBase: z.string().optional().describe("The base form of the target word (e.g., 'groß', 'ein') for dictionary lookup."),
  explanation: z.string().optional().describe("A brief explanation of why the correct ending is right."),
  hint: z.string().optional().describe("Optional concise hint about what to consider (max 1 line)."),
  showHint: z.boolean().default(false).describe("Whether to show the hint by default."),
});

export type MultipleChoiceSchema = z.infer<typeof MultipleChoiceSchema>;

// --- Marking Schema ---
const MultipleChoiceMarkingSchema = z.object({
    isCorrect: z.boolean().describe("Whether the user selected the correct ending."),
    feedback: z.string().describe("Feedback for the user, explaining the choice."),
    correctAnswer: z.string().describe("The correct ending option (e.g., '-en')."),
    score: z.number().min(0).max(100).describe("A score from 0 to 100.")
});

// --- Prompt Generation Function (Combined Content) ---
function getMultipleChoiceGenerationPrompt(context: ModalGenerationContext): string {
  const {
    targetLanguage,
    sourceLanguage,
    difficulty,
    modulePrimaryTask = "Translate or understand grammatical concepts",
    submodulePrimaryTask = "Apply specific grammatical rules",
    submoduleContext = {}
  } = context;

  let prompt = `You are an expert ${targetLanguage} linguist creating a multiple-choice question (ending focus) for a ${sourceLanguage} speaker learning ${targetLanguage} at the ${difficulty} level.
The overall goal is: ${modulePrimaryTask}.
This specific task focuses on: ${submodulePrimaryTask}.
Submodule Context: ${typeof submoduleContext === 'string' ? submoduleContext : JSON.stringify(submoduleContext)}

Generate question data adhering EXACTLY to the following JSON schema:
\`\`\`json
${JSON.stringify(MultipleChoiceSchema.shape, null, 2)}
\`\`\`

**Instructions:**
1.  Create a concise question related to the submodule task (e.g., "Which ending is correct?").
2.  Create a ${targetLanguage} sentence where the user needs to determine the correct grammatical ending for a specific target word.
3.  Combine the question and the sentence into the single \`content\` field, separated by exactly one double newline (\\n\\n).
    Example: "What is the correct article ending?\n\nIch sehe ein__ großen Hund."
4.  Identify the target word in the sentence that needs completion (\`targetReplace\`).
5.  Provide the base of the target word plus a separator (\`targetReplaceWith\`), like "groß-" or "ein-".
6.  Provide an array (\`options\`) containing 2-5 plausible grammatical **endings**. One option MUST be the correct ending. Others should be common errors.
7.  Indicate the 0-based index (\`correctOptionIndex\`) of the single correct ending.
8.  Provide the base form (\`targetWordBase\`) if applicable.
9.  Optionally add a concise \`explanation\`.
10. Optionally include \`sentenceStructure\` for the sentence part.

Example output structure:
{
  "content": "What is the correct article ending?\n\nIch sehe ein- großen Hund.",
  "sentenceStructure": [
    { "content": "Ich", "type": "pronoun", "target": false },
    { "content": "sehe", "type": "verb", "target": false },
    { "content": "ein-", "type": "article", "target": true }, // Base form shown here
    { "content": "großen", "type": "adjective", "target": false },
    { "content": "Hund", "type": "noun", "target": false }
  ],
  "targetReplace": "ein-", // The part needing the ending
  "targetReplaceWith": "ein-", // Base + separator
  "options": ["-en", "-e", "-", "-er"],
  "correctOptionIndex": 0,
  "targetWordBase": "ein",
  "explanation": "The correct ending is '-en' because 'Hund' is masculine and in the accusative case, following an indefinite article."
}`;
  return prompt;
}

// --- Marking Prompt Generation Function (Combined Content) ---
function getMultipleChoiceMarkingPrompt(context: ModalMarkingContext): string {
  const { questionData, userAnswer, submoduleContext = {} } = context;
  const userSelectedIndex = userAnswer; // Assuming userAnswer is the index
  const correctIndex = questionData?.correctOptionIndex;
  const options = questionData?.options;
  const userSelectedEnding = options?.[userSelectedIndex] ?? "[Invalid Index]";
  const correctEnding = options?.[correctIndex] ?? "[Correct Index Invalid]";

  // Derive question/sentence from content for context, handle missing separator
  const contentParts = questionData?.content?.split('\n\n') || ['[Missing Content]', ''];
  const questionPart = contentParts[0];
  const sentencePart = contentParts.length > 1 ? contentParts[1] : '[Missing Sentence Part]';

  return `You are an AI marking assistant for a ${questionData?.targetLanguage || 'target language'} learning exercise.
Task: Evaluate the user's answer to a multiple-choice question where they selected a grammatical ending.
Submodule Context: ${typeof submoduleContext === 'string' ? submoduleContext : JSON.stringify(submoduleContext)}

Question: ${questionPart}
Sentence Context: ${sentencePart}
Options (Endings): ${JSON.stringify(options)}
Target Word Base: ${questionData?.targetWordBase || 'N/A'}
Correct Ending: "${correctEnding}" (Index ${correctIndex})

User's Selected Ending (Index ${userSelectedIndex}): "${userSelectedEnding}"

Evaluate the user's selection. Provide feedback explaining *why* their choice is right or wrong, referencing the grammar rule if possible. Determine if the selected ending is correct. Assign a score (100 for correct, 0 for incorrect).

Respond ONLY with a JSON object adhering to this schema:
\`\`\`json
${JSON.stringify(MultipleChoiceMarkingSchema.shape, null, 2)}
\`\`\`
`;
}

// --- Modal Definition ---
export const multipleChoiceModalDefinition: ModalTypeDefinition = {
  id: 'multiple-choice',
  modalFamily: 'multiple-choice',
  interactionType: 'writing',
  uiComponent: 'MultipleChoiceModal',
  title_en: 'Multiple Choice (Ending)',

  generationSchema: MultipleChoiceSchema,
  getGenerationPrompt: getMultipleChoiceGenerationPrompt,

  markingSchema: MultipleChoiceMarkingSchema,
  getMarkingPrompt: getMultipleChoiceMarkingPrompt,
}; 