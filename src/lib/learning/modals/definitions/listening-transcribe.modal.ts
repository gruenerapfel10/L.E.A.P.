import { z } from 'zod';
import { ModalTypeDefinition, InteractionTypeTag, ModalGenerationContext, ModalMarkingContext } from '../types';

// --- Generation Schema ---
const ListeningTranscribeSchema = z.object({
  audioText: z.string().describe("The sentence to be synthesized and listened to by the user."),
  hint: z.string().optional().describe("Optional concise hint about vocabulary or grammar points present (max 1 line)."),
  showHint: z.boolean().default(false).describe("Whether to show the hint by default."),
  topic: z.string().optional().describe("Optional topic or theme of the sentence."),
});

export type ListeningTranscribeSchema = z.infer<typeof ListeningTranscribeSchema>;

// --- Marking Schema ---
const ListeningTranscribeMarkingSchema = z.object({
  isCorrect: z.boolean().describe("Whether the user's transcription matches the original audio text closely."),
  feedback: z.string().describe("Feedback for the user, explaining any discrepancies or confirming correctness."),
  correctAnswer: z.string().describe("The correct original sentence text."),
  score: z.number().min(0).max(100).describe("A score from 0 to 100 based on transcription accuracy."),
  // Optional: Add analysis like diff or common error types later
});

// --- Generation Prompt Function ---
function getListeningTranscribeGenerationPrompt(context: ModalGenerationContext): string {
  const {
    targetLanguage,
    sourceLanguage,
    difficulty,
    modulePrimaryTask = "Improve listening comprehension",
    submodulePrimaryTask = "Transcribe spoken sentences",
    submoduleContext = {}
  } = context;

  let prompt = `You are an expert ${targetLanguage} language instructor creating a listening transcription exercise for a ${sourceLanguage} speaker learning ${targetLanguage} at the ${difficulty} level.
The overall goal is: ${modulePrimaryTask}.
This specific task is: ${submodulePrimaryTask}.
Submodule Context: ${typeof submoduleContext === 'string' ? submoduleContext : JSON.stringify(submoduleContext)}

Generate question data adhering EXACTLY to the following JSON schema:
\`\`\`json
${JSON.stringify(ListeningTranscribeSchema.shape, null, 2)}
\`\`\`

**CRITICAL Instructions:**
1.  Create ONE single, grammatically correct sentence in ${targetLanguage}.
2.  The sentence should be clearly pronounceable and relevant to the Submodule Context.
3.  The sentence complexity should match the ${difficulty} level. Beginners need simple sentences, advanced users can handle more complex structures.
4.  Place the exact sentence text in the \`audioText\` field.
5.  Optionally add a relevant \`hint\` or \`topic\`.

Example output structure:
{
  "audioText": "Das Wetter ist heute sehr schön.",
  "hint": "Pay attention to the adjective ending.",
  "showHint": false,
  "topic": "Weather"
}

Ensure the sentence is natural-sounding and provides a good listening challenge for the specified level.`;

  return prompt;
}

// --- Marking Prompt Function ---
function getListeningTranscribeMarkingPrompt(context: ModalMarkingContext): string {
  const { questionData, userAnswer } = context;

  const originalText = questionData?.audioText || '[Original Text Missing]';
  const userTranscription = typeof userAnswer === 'string' ? userAnswer : '[No transcription provided]';

  return `You are an AI language assessment assistant evaluating a user's transcription of a spoken ${questionData?.targetLanguage || 'target language'} sentence.

Task: Compare the user's transcription to the original sentence text.

Original Sentence: "${originalText}"
User's Transcription: "${userTranscription}"

Evaluate the accuracy of the transcription. Consider minor differences in punctuation and capitalization acceptable unless they change the meaning significantly. The core words and their forms must match.

Provide constructive feedback:
- If correct (or very close with acceptable minor differences), confirm correctness.
- If incorrect, point out the specific differences (missing words, wrong words, significantly wrong forms).
- Assign a score (100 for correct/very close, potentially partial score for minor errors, 0 for significantly wrong).

Respond ONLY with a JSON object adhering to this schema:
\`\`\`json
${JSON.stringify(ListeningTranscribeMarkingSchema.shape, null, 2)}
\`\`\`
`;
}

// --- Modal Definition ---
export const listeningTranscribeModalDefinition: ModalTypeDefinition = {
  id: 'listening-transcribe',
  modalFamily: 'listening', // Group under 'listening'
  interactionType: 'listening', // Primary skill is listening
  uiComponent: 'ListeningTranscribe', // Name of the React component
  title_en: 'Listen and Transcribe',

  generationSchema: ListeningTranscribeSchema,
  getGenerationPrompt: getListeningTranscribeGenerationPrompt,

  markingSchema: ListeningTranscribeMarkingSchema,
  getMarkingPrompt: getListeningTranscribeMarkingPrompt,
}; 