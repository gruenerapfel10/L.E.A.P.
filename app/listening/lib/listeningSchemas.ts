import { z } from 'zod';

// Voice configuration for ElevenLabs
export const VoiceSchema = z.object({
  voice_id: z.string(),
  name: z.string(),
  language: z.string(),
  accent: z.string().optional(),
  gender: z.enum(['male', 'female']),
  age: z.enum(['young', 'middle_aged', 'old']).optional(),
  description: z.string().optional(),
});

export type Voice = z.infer<typeof VoiceSchema>;

// Audio task types based on Goethe C1 structure
export const AudioTaskTypeSchema = z.enum([
  'lecture',
  'panel_discussion',
  'interview',
  'podcast',
  'conversation',
  'news_report'
]);

export type AudioTaskType = z.infer<typeof AudioTaskTypeSchema>;

// Question types for listening comprehension
export const QuestionTypeSchema = z.enum([
  'multiple_choice',
  'matching',
  'short_answer',
  'true_false',
  'gap_fill',
  'summary'
]);

export type QuestionType = z.infer<typeof QuestionTypeSchema>;

// Individual question schema
export const ListeningQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['multiple_choice', 'matching', 'short_answer', 'true_false', 'gap_fill', 'summary']),
  question: z.string(),
  options: z.array(z.string()).optional(), // For multiple choice and matching
  correct_answer: z.string(),
  explanation: z.string().optional(),
  points: z.number().default(1),
});

export type ListeningQuestion = z.infer<typeof ListeningQuestionSchema>;

// Audio content structure
export const AudioContentSchema = z.object({
  id: z.string(),
  type: AudioTaskTypeSchema,
  title: z.string(),
  description: z.string(),
  topic: z.string(),
  difficulty_level: z.enum(['C1', 'C2']).default('C1'),
  duration_minutes: z.number(),
  transcript_de: z.string(),
  transcript_en: z.string(),
  speakers: z.array(z.object({
    name: z.string(),
    role: z.string(),
    voice_id: z.string(),
  })),
  questions: z.array(ListeningQuestionSchema),
  audio_url: z.string().optional(), // Generated audio URL
});

export type AudioContent = z.infer<typeof AudioContentSchema>;

// Listening test submission
export const ListeningSubmissionSchema = z.object({
  audio_id: z.string(),
  answers: z.record(z.string(), z.string()), // question_id -> answer
  time_taken_seconds: z.number(),
  submitted_at: z.string(),
});

export type ListeningSubmission = z.infer<typeof ListeningSubmissionSchema>;

// Listening evaluation result
export const ListeningEvaluationSchema = z.object({
  audio_id: z.string(),
  total_questions: z.number(),
  correct_answers: z.number(),
  score_percentage: z.number(),
  time_taken_seconds: z.number(),
  detailed_feedback: z.array(z.object({
    question_id: z.string(),
    question: z.string(),
    user_answer: z.string(),
    correct_answer: z.string(),
    is_correct: z.boolean(),
    explanation: z.string().optional(),
  })),
  overall_feedback: z.string(),
  strengths: z.array(z.string()),
  areas_for_improvement: z.array(z.string()),
  evaluated_at: z.string(),
});

export type ListeningEvaluation = z.infer<typeof ListeningEvaluationSchema>;

// Listening history entry
export const ListeningHistoryEntrySchema = z.object({
  id: z.string(),
  audio_content: AudioContentSchema,
  submission: ListeningSubmissionSchema,
  evaluation: ListeningEvaluationSchema,
  created_at: z.string(),
});

export type ListeningHistoryEntry = z.infer<typeof ListeningHistoryEntrySchema>;

// Statistics
export const ListeningStatsSchema = z.object({
  total_tests: z.number(),
  average_score: z.number(),
  best_score: z.number(),
  total_time_minutes: z.number(),
  favorite_task_type: AudioTaskTypeSchema.optional(),
  improvement_trend: z.number(), // Percentage change over last 5 tests
  completion_rate: z.number(), // Percentage of started tests completed
});

export type ListeningStats = z.infer<typeof ListeningStatsSchema>;

// Audio generation prompt
export const AudioGenerationPromptSchema = z.object({
  type: AudioTaskTypeSchema,
  topic: z.string().optional(),
  difficulty: z.enum(['C1', 'C2']).default('C1'),
  duration_minutes: z.number().min(2).max(15).default(5),
  num_speakers: z.number().min(1).max(4).default(2),
  include_questions: z.boolean().default(true),
  question_types: z.array(QuestionTypeSchema).optional(),
  voice_preferences: z.object({
    accents: z.array(z.string()).optional(),
    genders: z.array(z.enum(['male', 'female'])).optional(),
    ages: z.array(z.enum(['young', 'middle_aged', 'old'])).optional(),
  }).optional(),
});

export type AudioGenerationPrompt = z.infer<typeof AudioGenerationPromptSchema>;

// TTS request
export const TTSRequestSchema = z.object({
  text: z.string(),
  voice_id: z.string(),
  model_id: z.string().default('eleven_multilingual_v2'),
  voice_settings: z.object({
    stability: z.number().min(0).max(1).default(0.5),
    similarity_boost: z.number().min(0).max(1).default(0.5),
  }).optional(),
});

export type TTSRequest = z.infer<typeof TTSRequestSchema>;

export default {
  VoiceSchema,
  AudioTaskTypeSchema,
  QuestionTypeSchema,
  ListeningQuestionSchema,
  AudioContentSchema,
  ListeningSubmissionSchema,
  ListeningEvaluationSchema,
  ListeningHistoryEntrySchema,
  ListeningStatsSchema,
  AudioGenerationPromptSchema,
  TTSRequestSchema,
}; 