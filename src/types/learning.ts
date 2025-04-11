import { Database } from './supabase';

// Session types
export type UserLearningSession = Database['public']['Tables']['user_learning_sessions']['Row'];
export type UserLearningSessionInsert = Database['public']['Tables']['user_learning_sessions']['Insert'];
export type UserLearningSessionUpdate = Database['public']['Tables']['user_learning_sessions']['Update'];

// Event types
export type UserSessionEvent = Database['public']['Tables']['user_session_events']['Row'];
export type UserSessionEventInsert = Database['public']['Tables']['user_session_events']['Insert'];
export type UserSessionEventUpdate = Database['public']['Tables']['user_session_events']['Update'];

// Helper interfaces for the API
export interface StartSessionRequest {
  moduleId: string;
  targetLanguage: string;
  sourceLanguage: string;
}

export interface StartSessionResponse {
  sessionId: string;
  moduleId: string;
  submoduleId: string;
  submoduleTitle?: string;
  modalId: string;
  flavourId: string;
  questionData: any;
}

export interface SubmitAnswerRequest {
  sessionId: string;
  moduleId: string;
  submoduleId: string;
  modalId: string;
  flavourId?: string;
  questionData: any;
  userAnswer: any;
  targetLanguage?: string;
  sourceLanguage?: string;
}

export interface SubmitAnswerResponse {
  markResult: {
    isCorrect: boolean;
    score: number;
    feedback: string;
    correctAnswer?: any;
  };
  nextQuestion?: {
    submoduleId: string;
    modalId: string;
    flavourId: string;
    questionData: any;
  };
}

// Type for the actual API response structure of /submit
export interface SubmitApiResponse {
  markResult: SubmitAnswerResponse['markResult'];
  nextStep?: {
    submoduleId: string;
    modalId: string;
    flavourId: string;
    submoduleTitle?: string;
  };
  nextQuestionData?: any;
}

export interface EndSessionRequest {
  sessionId: string;
}

export interface EndSessionResponse {
  sessionId: string;
  summary: {
    totalQuestions: number;
    correctAnswers: number;
    score: number;
    timeSpent: number; // in seconds
  };
}

// Type for the buffered next question in frontend state
export interface NextQuestionInfo {
  submoduleId: string;
  submoduleTitle?: string;
  modalId: string;
  flavourId: string;
  questionData: any;
}

// Combined session state for frontend
export interface SessionState {
  data: StartSessionResponse | null; // Holds CURRENT question/module info
  isLoading: boolean;
  isSubmitting: boolean;
  isEnding: boolean;
  error: string | null;
  userAnswer: string | number;
  isAnswered: boolean;
  markResult: SubmitAnswerResponse['markResult'] | null;
  targetLanguage?: string;
  sourceLanguage?: string;
  bufferedNextQuestion: NextQuestionInfo | null; // Holds the NEXT question data temporarily
} 