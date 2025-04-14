import { z } from 'zod';
import { ModalTypeDefinition, InteractionTypeTag, ModalGenerationContext, ModalMarkingContext } from '../types';

// Type definition for a single word in the sentence breakdown
const ErrorWordSchema = z.object({
  text: z.string().describe("The word or phrase in the sentence."),
  isError: z.boolean().describe("Whether this word/phrase contains the error."),
  index: z.number().describe("The position index of this word in the sentence."),
});

// --- Generation Schema (Separate Fields) ---
const IdentifyErrorSchema = z.object({
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
const IdentifyErrorMarkingSchema = z.object({
  isCorrect: z.boolean().describe("Whether the user correctly identified if there was an error or not."),
  feedback: z.string().describe("Feedback for the user, explaining why their selection was right or wrong."),
  correctAnswer: z.string().describe("If there was an error, the word/phrase that contains it; otherwise 'no error'."),
  score: z.number().min(0).max(100).describe("A score from 0 to 100.")
});

// --- Prompt Generation Function (Separate Fields) ---
function getIdentifyErrorGenerationPrompt(context: ModalGenerationContext): string {
  const {
    targetLanguage,
    sourceLanguage, 
    difficulty,
    modulePrimaryTask = "Identify grammatical errors",
    submodulePrimaryTask = "Find and understand grammatical mistakes",
    submoduleContext = {}
  } = context;

  let prompt = `You are an expert ${targetLanguage} linguist creating an error identification exercise for a ${sourceLanguage} speaker learning ${targetLanguage} at the ${difficulty} level.
The overall goal is: ${modulePrimaryTask}.
This specific task focuses on: ${submodulePrimaryTask}.
Submodule Context: ${typeof submoduleContext === 'string' ? submoduleContext : JSON.stringify(submoduleContext)}

Generate question data adhering EXACTLY to the following JSON schema:
\`\`\`json
${JSON.stringify(IdentifyErrorSchema.shape, null, 2)}
\`\`\`

**Instructions:**
1. First, generate a COMPLETELY CORRECT ${targetLanguage} sentence related to the submodule context.
2. Then, decide whether this exercise will have an error or not. About 70% of exercises should have an error, 30% should be completely correct.
3. If including an error:
   a. Choose ONE specific word to replace with an incorrect form (typically an article or adjective ending).
   b. In the output, set \`hasError: true\`.
   c. Store the original correct word as \`targetReplace\` and the incorrect replacement as \`targetReplaceWith\`.
   d. Populate the \`words\` array, marking \`isError: true\` ONLY for the erroneous word.
   e. Provide \`correctVersion\`, \`errorType\`, and an \`explanation\` of the error.
4. If NO error (correct sentence):
   a. In the output, set \`hasError: false\`.
   b. Populate the \`words\` array with ALL \`isError: false\`.
   c. Provide an \`explanation\` of why the sentence is grammatically correct.
5. For the \`question\` field, use: "Find the grammatical error in this sentence, or select 'No error' if the sentence is correct."

Example output for a sentence WITH an error:
{
  "question": "Find the grammatical error in this sentence, or select 'No error' if the sentence is correct.",
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
  "targetReplace": "Die",
  "targetReplaceWith": "Der"
}

Example output for a CORRECT sentence:
{
  "question": "Find the grammatical error in this sentence, or select 'No error' if the sentence is correct.",
  "sentence": "Die Katze trinkt Milch.",
  "hasError": false,
  "words": [
    { "text": "Die", "isError": false, "index": 0 },
    { "text": "Katze", "isError": false, "index": 1 },
    { "text": "trinkt", "isError": false, "index": 2 },
    { "text": "Milch", "isError": false, "index": 3 }
  ],
  "explanation": "This sentence is grammatically correct. 'Katze' (cat) is feminine in German, so the article 'die' is the correct form. The verb 'trinkt' correctly agrees with the singular subject 'die Katze'."
}

Ensure the sentence is appropriate for the difficulty level. ${difficulty === 'beginner' ? 'Keep sentences short and use basic vocabulary.' : difficulty === 'advanced' ? 'Use more complex grammatical structures and advanced vocabulary.' : 'Use moderate complexity in grammar and vocabulary.'} Focus on the grammatical concepts relevant to the submodule.`;
  return prompt;
}

// --- Marking Prompt Generation Function (Separate Fields) ---
function getIdentifyErrorMarkingPrompt(context: ModalMarkingContext): string {
  const { questionData, userAnswer } = context;
  
  // Use separate fields
  const questionPart = questionData?.question || '[Question Missing]';
  const sentencePart = questionData?.sentence || '[Sentence Missing]';
  const hasError = questionData?.hasError || false;
  
  // For sentences with errors
  const errorWord = hasError ? questionData?.words?.find((w: any) => w.isError)?.text || '[Error not found]' : 'No error';
  
  // Special handling for "No error" selection
  const userSelectedNoError = userAnswer === 'no-error';
  let userSelectedWord = '[Invalid selection]';
  
  if (userSelectedNoError) {
    userSelectedWord = 'No error';
  } else if (userAnswer !== null && questionData?.words) {
    userSelectedWord = questionData.words.find((w: any) => w.index === userAnswer)?.text || '[Invalid selection]';
  }
  
  return `You are an AI marking assistant for a ${questionData?.targetLanguage || 'target language'} learning exercise.
Task: Evaluate the user's answer to an error identification exercise.

Question: ${questionPart}
Sentence: ${sentencePart}
Does the sentence have an error: ${hasError ? 'Yes' : 'No'}
${hasError ? `Actual error word: "${errorWord}"
Correct version: "${questionData?.correctVersion || '[No correction provided]'}"
Error type: ${questionData?.errorType || '[No error type specified]'}` : 'The sentence is grammatically correct.'}
Explanation: ${questionData?.explanation || '[No explanation provided]'}

User selected: "${userSelectedWord}"

Evaluate if the user correctly identified whether there was an error in the sentence. If there was an error, check if they picked the correct word. If there was no error, check if they selected "No error".

Provide constructive feedback explaining:
1. Whether their answer was correct
2. If incorrect, what the correct answer was
3. A brief explanation of the grammatical rule that applies

Assign a score (100 for correct identification, 0 for incorrect).

Respond ONLY with a JSON object adhering to this schema:
\`\`\`json
${JSON.stringify(IdentifyErrorMarkingSchema.shape, null, 2)}
\`\`\`
`;
}

// --- Modal Definition ---
export const identifyErrorModalDefinition: ModalTypeDefinition = {
  id: 'identify-error',
  modalFamily: 'sentence-error',
  interactionType: 'reading',
  uiComponent: 'ReadingIdentifyError',
  title_en: 'Identify the Error',

  generationSchema: IdentifyErrorSchema,
  getGenerationPrompt: getIdentifyErrorGenerationPrompt,

  markingSchema: IdentifyErrorMarkingSchema,
  getMarkingPrompt: getIdentifyErrorMarkingPrompt,
}; 