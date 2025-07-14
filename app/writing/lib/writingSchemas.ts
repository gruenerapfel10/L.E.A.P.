import { z } from 'zod';

// Writing prompt types based on Goethe C1 exam structure
export const WritingPromptTypeSchema = z.enum([
  'argumentative-essay',
  'opinion-essay', 
  'formal-letter',
  'report',
  'analysis'
]);

// Assessment criteria for writing evaluation
export const AssessmentCriteriaSchema = z.object({
  taskFulfillment: z.number().min(0).max(100),
  coherenceAndCohesion: z.number().min(0).max(100),
  vocabularyAndLanguageRange: z.number().min(0).max(100),
  grammarAndAccuracy: z.number().min(0).max(100),
  appropriatenessOfStyle: z.number().min(0).max(100),
});

// Enhanced granular feedback for detailed analytics
export const GrammarMistakeSchema = z.object({
  type: z.enum([
    'verb-tense',
    'subject-verb-agreement',
    'article-usage',
    'preposition-errors',
    'word-order',
    'case-errors',
    'plural-forms',
    'adjective-declension',
    'modal-verbs',
    'conditional-forms',
    'passive-voice',
    'subjunctive-mood',
    'other'
  ]),
  originalText: z.string(),
  correctedText: z.string(),
  explanation: z.string(),
  position: z.number().optional(),
  severity: z.enum(['minor', 'moderate', 'major']),
});

export const VocabularyUsageSchema = z.object({
  totalWords: z.number(),
  uniqueWords: z.number(),
  advancedWords: z.number(),
  repeatedWords: z.array(z.object({
    word: z.string(),
    count: z.number(),
  })),
  inappropriateWords: z.array(z.object({
    word: z.string(),
    context: z.string(),
    suggestion: z.string(),
    reason: z.string(),
  })),
  missedOpportunities: z.array(z.object({
    context: z.string(),
    suggestion: z.string(),
    improvement: z.string(),
  })),
  levelAppropriate: z.boolean(),
  vocabularyRange: z.enum(['limited', 'adequate', 'good', 'excellent']),
});

export const WritingMetricsSchema = z.object({
  wordsPerMinute: z.number(),
  charactersPerMinute: z.number(),
  pausePatterns: z.array(z.object({
    duration: z.number(),
    position: z.number(),
    context: z.string(),
  })),
  revisionCount: z.number(),
  backspaceCount: z.number(),
  averageSentenceLength: z.number(),
  paragraphCount: z.number(),
  sentenceCount: z.number(),
});

export const StructuralAnalysisSchema = z.object({
  hasIntroduction: z.boolean(),
  hasConclusion: z.boolean(),
  bodyParagraphs: z.number(),
  paragraphTransitions: z.array(z.object({
    from: z.number(),
    to: z.number(),
    quality: z.enum(['poor', 'adequate', 'good', 'excellent']),
    suggestion: z.string().optional(),
  })),
  overallStructure: z.enum(['poor', 'adequate', 'good', 'excellent']),
  logicalFlow: z.enum(['poor', 'adequate', 'good', 'excellent']),
  argumentDevelopment: z.enum(['poor', 'adequate', 'good', 'excellent']),
});

export const StyleAnalysisSchema = z.object({
  formality: z.enum(['too-informal', 'appropriate', 'too-formal']),
  consistency: z.enum(['inconsistent', 'mostly-consistent', 'consistent']),
  register: z.enum(['inappropriate', 'adequate', 'appropriate', 'excellent']),
  tone: z.enum(['inappropriate', 'adequate', 'appropriate', 'excellent']),
  idiomaticExpression: z.enum(['limited', 'adequate', 'good', 'excellent']),
  culturalAppropriate: z.boolean(),
});

// Comprehensive Writing Rubric with detailed feedback
export const WritingRubricSchema = z.object({
  id: z.string(),
  submissionId: z.string(),
  
  // Core Assessment Criteria (original)
  criteria: AssessmentCriteriaSchema,
  overallScore: z.number().min(0).max(100),
  
  // Granular Feedback for Analytics
  grammarMistakes: z.array(GrammarMistakeSchema),
  vocabularyUsage: VocabularyUsageSchema,
  writingMetrics: WritingMetricsSchema,
  structuralAnalysis: StructuralAnalysisSchema,
  styleAnalysis: StyleAnalysisSchema,
  
  // Detailed Feedback
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  keyPhrases: z.array(z.object({
    phrase: z.string(),
    translation: z.string(),
    usage: z.string(),
    difficulty: z.enum(['B2', 'C1', 'C2']),
  })),
  
  // Recommendations
  nextSteps: z.array(z.string()),
  practiceRecommendations: z.array(z.object({
    skill: z.string(),
    description: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
  })),
  
  // Metadata
  evaluatedAt: z.string(),
  timeToEvaluate: z.number(), // in seconds
  aiModel: z.string(),
  evaluatorVersion: z.string(),
});

// Writing prompt structure
export const WritingPromptSchema = z.object({
  id: z.string(),
  type: WritingPromptTypeSchema,
  topic: z.string(),
  topicTranslation: z.string(),
  prompt: z.string(),
  promptTranslation: z.string(),
  context: z.string().optional(),
  contextTranslation: z.string().optional(),
  requirements: z.array(z.string()),
  requirementsTranslation: z.array(z.string()),
  timeLimit: z.number(), // in minutes
  wordCountMin: z.number(),
  wordCountMax: z.number(),
  keyPhrases: z.array(z.object({
    phrase: z.string(),
    translation: z.string(),
    usage: z.string(),
  })),
  sampleStructure: z.object({
    introduction: z.string(),
    bodyParagraphs: z.array(z.string()),
    conclusion: z.string(),
  }),
  difficulty: z.enum(['B2', 'C1', 'C2']),
});

// Enhanced user's writing submission
export const WritingSubmissionSchema = z.object({
  id: z.string(),
  promptId: z.string(),
  content: z.string(),
  wordCount: z.number(),
  timeSpent: z.number(), // in minutes
  submittedAt: z.string(),
  
  // Enhanced tracking data
  keystrokeData: z.array(z.object({
    timestamp: z.number(),
    key: z.string(),
    action: z.enum(['insert', 'delete', 'backspace']),
    position: z.number(),
    content: z.string(),
  })).optional(),
  
  writingPauses: z.array(z.object({
    startTime: z.number(),
    endTime: z.number(),
    position: z.number(),
    context: z.string(),
  })).optional(),
  
  revisionHistory: z.array(z.object({
    timestamp: z.number(),
    oldText: z.string(),
    newText: z.string(),
    changeType: z.enum(['addition', 'deletion', 'replacement']),
    position: z.number(),
  })).optional(),
});

// Complete writing exercise with evaluation
export const WritingExerciseSchema = z.object({
  id: z.string(),
  prompt: WritingPromptSchema,
  submission: WritingSubmissionSchema.optional(),
  evaluation: WritingRubricSchema.optional(),
  createdAt: z.string(),
  completedAt: z.string().optional(),
});

// Enhanced writing history for comprehensive tracking
export const WritingHistorySchema = z.object({
  id: z.string(),
  exercise: WritingExerciseSchema,
  date: z.string(),
  score: z.number(),
  timeSpent: z.number(),
  
  // Enhanced analytics data
  grammarMistakeCount: z.number(),
  vocabularyScore: z.number(),
  structuralScore: z.number(),
  styleScore: z.number(),
  wordsPerMinute: z.number(),
  accuracyRate: z.number(),
  
  // Improvement tracking
  previousScore: z.number().optional(),
  improvementRate: z.number().optional(),
  strongestSkill: z.string().optional(),
  weakestSkill: z.string().optional(),
  
  // Goals and progress
  personalGoals: z.array(z.string()).optional(),
  goalsAchieved: z.array(z.string()).optional(),
  nextMilestone: z.string().optional(),
});

// Chat message schema for follow-up discussions
export const ChatMessageSchema = z.object({
  id: z.string(),
  exerciseId: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.string(),
  context: z.object({
    selectedText: z.string().optional(),
    questionType: z.enum(['grammar', 'vocabulary', 'meaning', 'improvement', 'general']).optional(),
    relatedMistakes: z.array(z.string()).optional(),
  }).optional(),
});

export const ChatSessionSchema = z.object({
  id: z.string(),
  exerciseId: z.string(),
  messages: z.array(ChatMessageSchema),
  startedAt: z.string(),
  lastMessageAt: z.string(),
  isActive: z.boolean(),
});

// Export types
export type WritingPromptType = z.infer<typeof WritingPromptTypeSchema>;
export type AssessmentCriteria = z.infer<typeof AssessmentCriteriaSchema>;
export type GrammarMistake = z.infer<typeof GrammarMistakeSchema>;
export type VocabularyUsage = z.infer<typeof VocabularyUsageSchema>;
export type WritingMetrics = z.infer<typeof WritingMetricsSchema>;
export type StructuralAnalysis = z.infer<typeof StructuralAnalysisSchema>;
export type StyleAnalysis = z.infer<typeof StyleAnalysisSchema>;
export type WritingRubric = z.infer<typeof WritingRubricSchema>;
export type WritingPrompt = z.infer<typeof WritingPromptSchema>;
export type WritingSubmission = z.infer<typeof WritingSubmissionSchema>;
export type WritingExercise = z.infer<typeof WritingExerciseSchema>;
export type WritingHistory = z.infer<typeof WritingHistorySchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatSession = z.infer<typeof ChatSessionSchema>; 