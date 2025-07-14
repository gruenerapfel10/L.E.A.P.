import { z } from 'zod';

// Base question schema that all question types extend
const BaseQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  textTranslation: z.string().describe('English translation of the text'),
  type: z.enum(['multiple-choice', 'matching', 'true-false', 'gap-fill']),
  explanation: z.string(),
});

// Multiple choice question schema
const MultipleChoiceSchema = BaseQuestionSchema.extend({
  type: z.literal('multiple-choice'),
  options: z.array(z.string()).min(3).max(5),
  optionsTranslations: z.array(z.string()).min(3).max(5),
  correctAnswer: z.string(),
});

// True/False question schema
const TrueFalseSchema = BaseQuestionSchema.extend({
  type: z.literal('true-false'),
  correctAnswer: z.enum(['Richtig', 'Falsch', 'Nicht im Text']),
});

// Matching question schema
const MatchingSchema = BaseQuestionSchema.extend({
  type: z.literal('matching'),
  pairs: z.array(z.object({
    statement: z.string(),
    statementTranslation: z.string(),
    match: z.string(),
    matchTranslation: z.string(),
  })).min(3).max(6),
  correctAnswer: z.array(z.string()),
});

// Gap fill question schema
const GapFillSchema = BaseQuestionSchema.extend({
  type: z.literal('gap-fill'),
  gaps: z.array(z.object({
    position: z.number(),
    options: z.array(z.string()).min(3).max(5),
    optionsTranslations: z.array(z.string()).min(3).max(5),
    correctAnswer: z.string(),
  })),
  correctAnswer: z.array(z.string()),
});

// Question union type
export const QuestionSchema = z.discriminatedUnion('type', [
  MultipleChoiceSchema,
  TrueFalseSchema,
  MatchingSchema,
  GapFillSchema,
]);

// Reading text schema
export const ReadingTextSchema = z.object({
  id: z.string(),
  title: z.string(),
  titleTranslation: z.string(),
  content: z.string(),
  contentTranslation: z.string(),
  type: z.enum(['informative', 'narrative', 'functional', 'opinion']),
  difficulty: z.literal('C1'),
  questions: z.array(QuestionSchema),
});

// Test history schema
export const TestHistorySchema = z.object({
  id: z.string(),
  date: z.string(), // ISO date string
  score: z.number(),
  readingText: ReadingTextSchema,
  userAnswers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
});

// Export types
export type Question = z.infer<typeof QuestionSchema>;
export type ReadingText = z.infer<typeof ReadingTextSchema>;
export type TestHistory = z.infer<typeof TestHistorySchema>; 