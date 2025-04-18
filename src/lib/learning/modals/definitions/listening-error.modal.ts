import { z } from 'zod';
import { ModalTypeDefinition, InteractionTypeTag, ModalGenerationContext, ModalMarkingContext } from '../types';

// --- Generation Schema ---
const ListeningErrorSchema = z.object({
  audioText: z.string().describe("The sentence to be synthesized and listened to by the user."),
  errorVersion: z.string().describe("The incorrect version of the sentence with a grammatical error."),
  correctVersion: z.string().describe("The correct version of the sentence without errors."),
  errorPosition: z.number().describe("The position (index) of the error word in the sentence."),
  errorWord: z.string().describe("The word or phrase that contains the error."),
  errorType: z.string().describe("The type of grammatical error (e.g., 'gender agreement', 'adjective ending')."),
  hint: z.string().optional().describe("Optional concise hint about what type of error to listen for (max 1 line)."),
  showHint: z.boolean().default(false).describe("Whether to show the hint by default."),
  topic: z.string().optional().describe("Optional topic or theme of the sentence."),
});

export type ListeningErrorSchema = z.infer<typeof ListeningErrorSchema>;

// --- Marking Schema ---
const ListeningErrorMarkingSchema = z.object({
  isCorrect: z.boolean().describe("Whether the user correctly identified the error."),
  feedback: z.string().describe("Feedback for the user, explaining why their selection was right or wrong."),
  correctAnswer: z.string().describe("The correct answer or explanation of what was wrong."),
  score: z.number().min(0).max(100).describe("A score from 0 to 100 based on error identification accuracy."),
});

// --- Generation Prompt Function ---
function getListeningErrorGenerationPrompt(context: ModalGenerationContext): string {
  const {
    targetLanguage,
    sourceLanguage,
    difficulty,
    modulePrimaryTask = "Improve listening comprehension",
    submodulePrimaryTask = "Identify grammatical errors in spoken sentences",
    submoduleContext = {}
  } = context;

  // Determine the specific grammar focus from the context
  let grammarFocus = "a relevant grammatical error";
  if (submodulePrimaryTask.toLowerCase().includes('adjective declension')) {
    grammarFocus = "an adjective declension error";
  } else if (submodulePrimaryTask.toLowerCase().includes('preposition')) {
    grammarFocus = "a prepositional error (e.g., wrong case after preposition)";
  } else if (submodulePrimaryTask.toLowerCase().includes('verb conjugation')) {
    grammarFocus = "a verb conjugation error";
  } // Add more else-if clauses here for other grammar topics as needed

  let prompt = `You are an expert ${targetLanguage} language instructor creating a listening-based error identification exercise for a ${sourceLanguage} speaker learning ${targetLanguage} at the ${difficulty} level.
The overall goal is: ${modulePrimaryTask}.
This specific task is: ${submodulePrimaryTask}.
Submodule Context: ${typeof submoduleContext === 'string' ? submoduleContext : JSON.stringify(submoduleContext)}

Generate question data adhering EXACTLY to the following JSON schema:
\`\`\`json
${JSON.stringify(ListeningErrorSchema.shape, null, 2)}
\`\`\`

**CRITICAL Instructions:**
1.  First, create a grammatically CORRECT sentence in ${targetLanguage} that is relevant to the submodule's context and primary task.
2.  This sentence will be the \`correctVersion\`.
3.  Then, modify this sentence to introduce ONE specific grammatical error relevant to the submodule's focus (${grammarFocus}). The error should be appropriate for the ${difficulty} level.
4.  The error MUST be related to the specific grammar point defined by the \`submodulePrimaryTask\` and \`submoduleContext\`. For example, if the task is about adjective declension, the error MUST be an incorrect adjective ending. If the task is about prepositions, the error MUST relate to preposition usage (e.g., wrong case).
5.  Clearly identify:
    *   The \`errorWord\` (the incorrect word/phrase)
    *   The \`errorPosition\` (the 0-based index of the first word in the error phrase within the \`errorVersion\` sentence)
    *   The \`errorType\` (be specific, e.g., "adjective ending - accusative masculine", "preposition - wrong case", "verb conjugation - present tense 3rd person singular")
6.  The \`audioText\` field MUST be identical to the \`errorVersion\` sentence – this is what the user will hear.
7.  Optionally add a concise \`hint\` related to the specific type of error, and a relevant \`topic\`.

Example output structure (for an adjective declension task):
{
  "audioText": "Ich sehe den alten Mann.", // Incorrect ending
  "errorVersion": "Ich sehe den alten Mann.",
  "correctVersion": "Ich sehe den alten Mann.", // Correct ending is -en
  "errorPosition": 3, // Index of 'alten'
  "errorWord": "alten",
  "errorType": "adjective ending - accusative masculine",
  "hint": "Check the adjective ending after the definite article in the accusative case.",
  "showHint": false,
  "topic": "People"
}

Ensure the sentence is appropriate for the ${difficulty} level, with suitable complexity and vocabulary. Focus ONLY on creating the type of error specified by the submodule context.`;

  return prompt;
}

// --- Marking Prompt Function ---
function getListeningErrorMarkingPrompt(context: ModalMarkingContext): string {
  const { questionData, userAnswer } = context;

  const audioText = questionData?.audioText || '[Audio Text Missing]';
  const correctVersion = questionData?.correctVersion || '[Correct Version Missing]';
  const errorWord = questionData?.errorWord || '[Error Word Missing]';
  const errorType = questionData?.errorType || '[Error Type Missing]';
  const userIdentifiedError = typeof userAnswer === 'string' ? userAnswer : '[No error identified]';

  return `You are an AI language assessment assistant evaluating a user's ability to identify a specific grammatical error in a spoken ${questionData?.targetLanguage || 'target language'} sentence, based on the provided error details.

Task: Evaluate if the user correctly identified the grammatical error described as \"${errorType}\" after listening to the audio.

Audio Sentence (with error): "${audioText}"
Correct Version: "${correctVersion}"
Actual Error Word/Phrase: "${errorWord}"
Specific Error Type Provided: "${errorType}"
User's Answer: "${userIdentifiedError}"

Evaluate whether the user's answer correctly identifies the specific grammatical error indicated by the \`errorType\` and \`errorWord\`. Consider:
- Did they identify the correct word or phrase (\`errorWord\`) that contains the error?
- Did they demonstrate understanding of the specific grammatical issue described by \`errorType\`?
- Even if their phrasing isn't exact, does their answer reflect an understanding of what was grammatically incorrect based on the \`errorType\`?

Provide constructive feedback tailored to the specific \`errorType\`:
- If correct, confirm their understanding and briefly explain why the \`errorWord\` was incorrect according to the \`errorType\` and what the \`correctVersion\` is.
- If partially correct, acknowledge what they identified correctly but clarify the aspect related to the \`errorType\` they missed.
- If incorrect, clearly explain the grammatical error defined by \`errorType\`, point out the \`errorWord\`, and provide the \`correctVersion\`.

Focus your feedback specifically on the grammatical point identified by the \`errorType\`.

Assign a score (100 for completely correct identification matching the error type, 50-75 for partially correct identification with minor misunderstandings related to the error type, 0 for completely incorrect).

Respond ONLY with a JSON object adhering to this schema:
\`\`\`json
${JSON.stringify(ListeningErrorMarkingSchema.shape, null, 2)}
\`\`\`
`;
}

// --- Modal Definition ---
export const listeningErrorModalDefinition: ModalTypeDefinition = {
  id: 'listening-error',
  modalFamily: 'listening', // Same family as listening-transcribe
  interactionType: 'listening', // Primary skill is listening
  uiComponent: 'ListeningError', // Name of the React component we'll create
  title_en: 'Listen and Find the Error',

  generationSchema: ListeningErrorSchema,
  getGenerationPrompt: getListeningErrorGenerationPrompt,

  markingSchema: ListeningErrorMarkingSchema,
  getMarkingPrompt: getListeningErrorMarkingPrompt,
}; 