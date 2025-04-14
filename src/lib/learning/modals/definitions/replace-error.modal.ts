import { z } from 'zod';
import { ModalTypeDefinition, InteractionTypeTag, ModalGenerationContext, ModalMarkingContext } from '../types';

// Type definition for a single word in the sentence breakdown
const ErrorWordSchema = z.object({
  text: z.string().describe("The word or phrase in the sentence."),
  isError: z.boolean().describe("Whether this word/phrase contains the error."),
  index: z.number().describe("The position index of this word in the sentence."),
});

// --- Generation Schema (Separate Fields) ---
const ReplaceErrorSchema = z.object({
  question: z.string().describe("The question prompt instructing the user what to do."),
  sentence: z.string().describe("The sentence containing a grammatical error."),
  words: z.array(z.object({
    text: z.string(),
    isError: z.boolean(),
    index: z.number()
  })).describe("Array of words in the sentence, with error word marked."),
  hasError: z.boolean().describe("Whether the sentence contains an error."),
  correctVersion: z.string().optional().describe("The correct version of the sentence."),
  errorType: z.string().optional().describe("The type of grammatical error."),
  explanation: z.string().describe("Brief explanation of why the error is incorrect."),
  hint: z.string().optional().describe("Optional concise hint about what type of error to look for (max 1 line)."),
  showHint: z.boolean().default(false).describe("Whether to show the hint by default."),
  topic: z.string().optional().describe("Optional topic or theme of the sentence."),
});

// --- Marking Schema ---
const ReplaceErrorMarkingSchema = z.object({
  isCorrect: z.boolean().describe("Whether the user correctly identified if there was an error and replaced it with the proper form, or selected 'no error' correctly."),
  feedback: z.string().describe("Feedback for the user, explaining why their correction is correct or incorrect."),
  correctAnswer: z.string().describe("The correct form that should replace the error, or 'no error' if the sentence was correct."),
  score: z.number().min(0).max(100).describe("A score from 0 to 100.")
});

// --- Prompt Generation Function (Separate Fields) ---
function getReplaceErrorGenerationPrompt(context: ModalGenerationContext): string {
  const {
    targetLanguage,
    sourceLanguage,
    difficulty,
    modulePrimaryTask = "Correct grammatical errors",
    submodulePrimaryTask = "Find and correct grammatical mistakes",
    submoduleContext = {}
  } = context;

  let prompt = `You are an expert ${targetLanguage} linguist creating an error correction exercise for a ${sourceLanguage} speaker learning ${targetLanguage} at the ${difficulty} level.
The overall goal is: ${modulePrimaryTask}.
This specific task focuses on: ${submodulePrimaryTask}.
Submodule Context: ${typeof submoduleContext === 'string' ? submoduleContext : JSON.stringify(submoduleContext)}

Generate question data adhering EXACTLY to the following JSON schema:
\`\`\`json
${JSON.stringify(ReplaceErrorSchema.shape, null, 2)}
\`\`\`

**Instructions:**
1. Generate a ${targetLanguage} sentence related to the submodule context that contains ONE grammatical error.
2. Choose ONE specific word to replace with an incorrect form (typically an article or adjective ending).
3. In the output:
   a. Set \`hasError: true\` (this exercise always has an error).
   b. Store the original correct word as \`targetReplace\` and the incorrect replacement as \`targetReplaceWith\`.
   c. Populate the \`words\` array, marking \`isError: true\` ONLY for the erroneous word.
   d. Provide \`correctVersion\`, \`errorType\`, and an \`explanation\` of the error.
   e. Optionally include \`acceptableAnswers\` for other correct forms.
4. For the \`question\` field, use: "Find the grammatical error and type the correct form of the word."

Example output:
{
  "question": "Find the grammatical error and type the correct form of the word.",
  "sentence": "Der Katze trinkt Milch.",
  "hasError": true,
  "words": [
    { "text": "Der", "isError": true, "index": 0 },
    { "text": "Katze", "isError": false, "index": 1 },
    { "text": "trinkt", "isError": false, "index": 2 },
    { "text": "Milch", "isError": false, "index": 3 }
  ],
  "correctVersion": "Die",
  "errorType": "gender agreement",
  "explanation": "'Katze' (cat) is feminine in German, so the correct article should be 'die' instead of 'der'.",
  "acceptableAnswers": ["Die"],
  "targetReplace": "Die",
  "targetReplaceWith": "Der"
}

Ensure the sentence is appropriate for the difficulty level. ${difficulty === 'beginner' ? 'Keep sentences short and use basic vocabulary.' : difficulty === 'advanced' ? 'Use more complex grammatical structures and advanced vocabulary.' : 'Use moderate complexity in grammar and vocabulary.'} Focus on the grammatical concepts relevant to the submodule.`;
  return prompt;
}

// --- Marking Prompt Generation Function (Separate Fields) ---
function getReplaceErrorMarkingPrompt(context: ModalMarkingContext): string {
  const { questionData, userAnswer } = context;
  
  // Use separate fields
  const questionPart = questionData?.question || '[Question Missing]'; 
  const sentencePart = questionData?.sentence || '[Sentence Missing]';
  const hasError = questionData?.hasError || false;
  
  // Special handling for "No error" selection
  const userSelectedNoError = userAnswer === 'no-error';
  
  // For sentences with errors
  const errorWord = hasError ? questionData?.words?.find((w: any) => w.isError)?.text || '[Error not found]' : 'No error';
  const correctVersion = hasError ? questionData?.correctVersion || '[No correction provided]' : 'N/A';
  const acceptableAnswers = questionData?.acceptableAnswers || [];
  
  let userSelectedWord = '[Invalid selection]';
  let userCorrection = '[No user correction]';
  
  if (userSelectedNoError) {
    userSelectedWord = 'No error';
    userCorrection = 'No error';
  } else if (typeof userAnswer === 'object' && userAnswer !== null) {
    const userSelectedIndex = userAnswer?.index;
    userSelectedWord = questionData?.words?.find((w: any) => w.index === userSelectedIndex)?.text || '[Invalid selection]';
    userCorrection = userAnswer?.correction || '[No user correction]';
  }
  
  return `You are an AI marking assistant for a ${questionData?.targetLanguage || 'target language'} learning exercise.
Task: Evaluate the user's correction of a grammatical error.

Question: ${questionPart}
Sentence: ${sentencePart}
Does the sentence have an error: ${hasError ? 'Yes' : 'No'}
${hasError ? `Actual error word: "${errorWord}"
Correct version: "${correctVersion}"
Acceptable alternatives: ${JSON.stringify(acceptableAnswers)}
Error type: ${questionData?.errorType || '[No error type specified]'}` : 'The sentence is grammatically correct.'}
Explanation: ${questionData?.explanation || '[No explanation provided]'}

User selected: ${userSelectedNoError ? '"No error"' : `word "${userSelectedWord}" with correction "${userCorrection}"`}

Evaluate if:
${hasError ? 
`1. The user identified the correct error word (${errorWord})
2. The user's replacement is correct or close to the expected correction` 
: 
`The user correctly identified that the sentence has no errors`}

Provide constructive feedback explaining:
1. Whether their answer was correct
2. If incorrect, what the correct answer was
3. A brief explanation of the grammatical rule that applies

${hasError ? `Consider the following when evaluating the correction:
- Is it exactly the correct version? (100 score)
- Is it one of the acceptable alternatives? (100 score)
- Is it close to correct but has minor issues? (partial score)
- Is it completely incorrect? (0 score)` : ''}

Respond ONLY with a JSON object adhering to this schema:
\`\`\`json
${JSON.stringify(ReplaceErrorMarkingSchema.shape, null, 2)}
\`\`\`
`;
}

// --- Modal Definition ---
export const replaceErrorModalDefinition: ModalTypeDefinition = {
  id: 'replace-error',
  modalFamily: 'sentence-error',
  interactionType: 'writing',
  uiComponent: 'WritingReplaceError',
  title_en: 'Replace the Error',

  generationSchema: ReplaceErrorSchema,
  getGenerationPrompt: getReplaceErrorGenerationPrompt,

  markingSchema: ReplaceErrorMarkingSchema,
  getMarkingPrompt: getReplaceErrorMarkingPrompt,
}; 