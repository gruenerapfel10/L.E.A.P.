'use client';

import { useEffect, useState, use, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertCircle, ArrowLeft, BookOpen, RefreshCw, Brain, Check, Percent, Hash, X,
  Puzzle,
  FileQuestion,
  Bot,
  Settings,
  ChevronRight,
  Library,
} from 'lucide-react';
import { ReadingMultipleChoiceComponent } from '@/components/learning/interactions/ReadingMultipleChoice';
import { WritingFillInGapComponent } from '@/components/learning/interactions/WritingFillInGap';
import { ReadingTrueFalseComponent } from '@/components/learning/interactions/ReadingTrueFalse';
import { DebugMenu } from '@/components/learning/debug-menu';
import { WritingCorrectIncorrectSentence } from '@/components/learning/interactions/WritingCorrectIncorrectSentence';
import { ModuleDefinition, SubmoduleDefinition, HelperResource } from '@/lib/learning/types';
import { TabSystem, type LayoutNode } from '@/components/learning/TabSystem';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { cn } from '@/lib/utils';
import { Chat } from '@/components/learning/ai/chat';
import { useChat, type Message } from '@ai-sdk/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { loadHelperSheets } from '@/lib/learning/helper-sheets/loader';
import { helperSheetRegistry } from '@/lib/learning/helper-sheets/helper-sheet-registry';
import type { HelperSheet } from '@/lib/learning/types';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

// Language code to name mapping
const languageNames: Record<string, string> = {
  en: 'English',
  de: 'German', // Using German instead of Deutsch for consistency in English UI
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  ja: 'Japanese',
  pt: 'Portuguese'
};

// Add flag mapping
const languageFlags: Record<string, string> = {
  en: '🇬🇧',
  de: '🇩🇪',
  es: '🇪🇸',
  fr: '🇫🇷',
  it: '🇮🇹',
  ja: '🇯🇵',
  pt: '🇵🇹'
};

// Define more specific types for API responses based on refactored API
interface StartSessionApiResponse { // Assumed structure from /start endpoint
  sessionId: string;
  moduleId: string;
  submoduleId: string;
  submoduleTitle: string;
  modalSchemaId: string;
  uiComponent: string;
  questionData: any;
  targetLanguage: string;
  sourceLanguage: string;
}

interface NextStepInfo {
  submoduleId: string;
  modalSchemaId: string;
  submoduleTitle: string;
  uiComponent: string;
  questionData: any;
  questionDebugInfo?: any;
}

interface SubmitApiResponse {
  markingResult: any;
  nextStep: NextStepInfo | null;
}

// State to hold the current session details
interface SessionState {
  sessionId: string | null;
  moduleId: string | null;
  currentSubmoduleId: string | null;
  currentSubmoduleTitle: string | null;
  currentModalSchemaId: string | null;
  currentUiComponent: string | null;
  currentQuestionData: any | null;
  currentQuestionDebugInfo: any | null;
  isLoading: boolean;
  isSubmitting: boolean;
  isEnding: boolean;
  error: string | null;
  userAnswer: any | null;
  isAnswered: boolean;
  markResult: any | null;
  targetLanguage: string; 
  sourceLanguage: string; 
  bufferedNextStep: NextStepInfo | null;
  bufferedNextQuestionData: any | null;
  bufferedNextQuestionDebugInfo: any | null;

  // Fields for current session stats
  sessionCorrectCount: number;
  sessionTotalAnswered: number;

  currentModule: ModuleDefinition | null;
  currentSubmodule: SubmoduleDefinition | null;
}

// Props for the page component
interface SessionPageProps {
  params: Promise<{ sessionId: string }>; 
}

// Define initial layout structure function/variable
// Note: Content will now be fetched via getContentForTab
const generateInitialLayout = (): LayoutNode => ({
  id: 'root_split', 
  type: 'split' as const, 
  direction: 'horizontal' as const,
  sizes: [70, 30], // Adjust split size (70% left, 30% right)
  children: [
    // Left Pane: Question
    {
      id: 'window_left', 
      type: 'window' as const,
      tabs: [
        { id: 'question', title: 'Question', iconType: 'fileQuestion' as const },
      ],
      activeTabId: 'question',
      isCollapsed: false,
    },
    // Right Pane: Multiple tabs
    {
      id: 'window_right',
      type: 'window' as const,
      tabs: [
        { id: 'helper', title: 'Helper Sheet', iconType: 'bookOpen' as const },
        { id: 'ai_assistant', title: 'AI Assistant', iconType: 'bot' as const },
        { id: 'stats', title: 'Stats', iconType: 'percent' as const },
      ],
      activeTabId: 'helper', // Default to Helper Sheet tab
      isCollapsed: false,
    }
  ],
});

// Add this new component at the top of the file, after the imports
const GradientBlobs = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB3aWR0aD0iMTUiIGhlaWdodD0iMTUiPjxyZWN0IHdpZHRoPSIxNSIgaGVpZ2h0PSIxNSIgZmlsbD0icmdiYSgwLDAsMCwwLjA1KSIvPjxjaXJjbGUgY3g9IjcuNSIgY3k9IjcuNSIgcj0iMiIgZmlsbD0icmdiYSgwLDAsMCwwLjE1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIvPjwvc3ZnPg==')] opacity-100 dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB3aWR0aD0iMTUiIGhlaWdodD0iMTUiPjxyZWN0IHdpZHRoPSIxNSIgaGVpZ2h0PSIxNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjxjaXJjbGUgY3g9IjcuNSIgY3k9IjcuNSIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjE1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIvPjwvc3ZnPg==')]" />
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl animate-blob mix-blend-overlay" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-2000 mix-blend-overlay" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-pink-500/10 rounded-full blur-3xl animate-blob animation-delay-4000 mix-blend-overlay" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-3xl animate-blob animation-delay-6000 mix-blend-overlay" />
    </div>
  );
};

// Add this new component before the main SessionPage component
const SessionSettings = () => {
  return (
    <div className="p-4 space-y-4">
      <h3 className="font-medium">Session Settings</h3>
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">
          Settings will be implemented in a future update.
        </div>
      </div>
    </div>
  );
};

export default function SessionPage({ params }: SessionPageProps) {
  const resolvedParams = use(params);
  const initialSessionId = resolvedParams.sessionId;
  const router = useRouter();
  const { i18n } = useTranslation();
  const [selectedHelperSheetId, setSelectedHelperSheetId] = useState<string | null>(null);

  // State for the main session logic
  const [state, setState] = useState<SessionState>(() => ({
    sessionId: initialSessionId,
    moduleId: null,
    currentModule: null,
    currentSubmodule: null,
    currentSubmoduleId: null,
    currentSubmoduleTitle: null,
    currentModalSchemaId: null,
    currentUiComponent: null,
    currentQuestionData: null,
    currentQuestionDebugInfo: null,
    isLoading: true, 
    isSubmitting: false, // Initialize isSubmitting
    isEnding: false,     // Initialize isEnding
    error: null,         // Initialize error
    userAnswer: null, 
    isAnswered: false,
    markResult: null,
    bufferedNextStep: null, 
    bufferedNextQuestionData: null, 
    bufferedNextQuestionDebugInfo: null,
    targetLanguage: 'de', 
    sourceLanguage: 'en',
    // Initialize session stats
    sessionCorrectCount: 0,
    sessionTotalAnswered: 0,
  }));

  // --- Add state for the TabSystem layout --- 
  const [layout, setLayout] = useState<LayoutNode | null>(null); // Initialize as null

  // --- Effects --- 
  // Initialize layout state once session data is loaded
  useEffect(() => {
    if (!state.isLoading && state.currentQuestionData && !layout) {
      // Only set initial layout if it hasn't been set yet
      setLayout(generateInitialLayout());
    }
    // Removed `layout` from dependency array to prevent potential loops
  }, [state.isLoading, state.currentQuestionData]); 

  // Use the minimal body in the useChat hook
  const { 
    messages: chatMessages, 
    input: chatInput, 
    handleInputChange: handleChatInputChange, 
    handleSubmit: handleChatSubmit, 
    isLoading: isChatLoading, 
    error: chatError, 
    reload: reloadChat, 
    stop: stopChat
  } = useChat({
    api: '/api/chat',
    // Add initial message containing the sessionId (ensure state.sessionId is available)
    initialMessages: state.sessionId ? [
      { id: 'init-session', role: 'system', content: `SESSION_ID::${state.sessionId}` }
    ] : [],
    onError: (err) => {
      console.error("[Session Page Chat Error]", err);
    },
  });

  // useEffect to fetch the initial session state and set up tab activation listener
  useEffect(() => {
    let isMounted = true;
    
    // Fetch initial session data
    async function fetchInitialData() {
      if (!state.sessionId) {
        if (isMounted) setState(prev => ({ ...prev, isLoading: false, error: "No Session ID provided." }));
        return;
      }

      // Ensure loading state is true before fetch
      if (isMounted && !state.isLoading) {
          setState(prev => ({ ...prev, isLoading: true, error: null }));
      }

      try {
        // Fetch initial session state from the new GET endpoint
        const response = await fetch(`/api/learning/session/state?sessionId=${state.sessionId}`);
        
        if (!response.ok) {
           let errorMsg = `Failed to fetch session state: ${response.statusText}`;
           try { 
              const errorData = await response.json();
              errorMsg = errorData.error || errorMsg;
           } catch {}
           throw new Error(errorMsg);
        }
        
        const initialData = await response.json();
        console.log("Fetched initial session state:", initialData); // Added log

        if (isMounted) {
          // Populate state with fetched data, including module/submodule objects
          setState(prev => ({
            ...prev,
            moduleId: initialData.moduleId,
            currentModule: initialData.moduleDefinition,
            currentSubmodule: initialData.submoduleDefinition,
            currentSubmoduleId: initialData.submoduleId,
            currentSubmoduleTitle: initialData.submoduleTitle,
            currentModalSchemaId: initialData.modalSchemaId,
            currentUiComponent: initialData.uiComponent,
            currentQuestionData: initialData.questionData,
            targetLanguage: initialData.targetLanguage,
            sourceLanguage: initialData.sourceLanguage,
            isLoading: false, 
            error: null,
          }));
        }
      } catch (error) {
        console.error('Error fetching initial session data:', error);
        if (isMounted) {
          setState(prev => ({ 
            ...prev, 
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load session data' 
          }));
        }
      }
    }

    fetchInitialData();

    // Clean up function
    return () => { 
      isMounted = false;
    };

  }, [state.sessionId]); // Keep dependency

  // Handle updating state with a question generated from the debug menu
  const handleDebugQuestionGenerated = (data: {
    newQuestionData: any;
    newSubmoduleId: string;
    newModalSchemaId: string;
    newSubmoduleTitle: string;
    newUiComponent: string;
    questionDebugInfo?: any;
  }) => {
    console.log("[Debug] Applying generated question:", data);
    setState(prev => ({
      ...prev,
      currentQuestionData: data.newQuestionData,
      currentSubmoduleId: data.newSubmoduleId,
      currentModalSchemaId: data.newModalSchemaId,
      currentSubmoduleTitle: data.newSubmoduleTitle,
      currentUiComponent: data.newUiComponent,
      currentQuestionDebugInfo: data.questionDebugInfo || null,
      // Reset answer/marking state for the new question
      userAnswer: null,
      isAnswered: false,
      markResult: null,
      error: null, 
      bufferedNextStep: null, 
      bufferedNextQuestionData: null, 
      bufferedNextQuestionDebugInfo: null,
      // Find the new submodule definition from the existing module state
      // Note: This assumes the module definition doesn't change mid-session
      currentSubmodule: prev.currentModule?.submodules.find(s => s.id === data.newSubmoduleId) ?? null,
      // Note: Session stats are NOT updated here, as this is a debug action
    }));
  };

  // Handle submitting an answer
  const handleSubmitAnswer = async () => {
    // Check using correct state properties
    if (!state.sessionId || !state.moduleId || !state.currentSubmoduleId || !state.currentModalSchemaId || !state.currentQuestionData) {
      console.error("Missing required state for submission");
      return;
    }
    setState(prev => ({ ...prev, isSubmitting: true, error: null }));
    try {
      const response = await fetch('/api/learning/session/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: state.sessionId,
          moduleId: state.moduleId,
          submoduleId: state.currentSubmoduleId,
          modalSchemaId: state.currentModalSchemaId,
          questionData: state.currentQuestionData,
          userAnswer: state.userAnswer, 
          targetLanguage: state.targetLanguage, 
          sourceLanguage: state.sourceLanguage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result: SubmitApiResponse = await response.json(); 

      // Update state with marking result and next step data
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        isAnswered: true, 
        markResult: result.markingResult,
        // Update session stats
        sessionTotalAnswered: prev.sessionTotalAnswered + 1,
        sessionCorrectCount: prev.sessionCorrectCount + (result.markingResult?.isCorrect ? 1 : 0),
        // Buffer next step info AND extract nested data
        bufferedNextStep: result.nextStep, 
        bufferedNextQuestionData: result.nextStep?.questionData || null,
        bufferedNextQuestionDebugInfo: result.nextStep?.questionDebugInfo || null,
      }));

    } catch (error) {
      console.error('Error submitting answer:', error);
      setState(prev => ({ 
        ...prev, 
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Failed to submit answer' 
      }));
    }
  };

  // Handle proceeding to the next question state
  const handleNextQuestion = () => {
     // Check buffer has next step info AND next question data
     if (state.bufferedNextStep && state.bufferedNextQuestionData) { 
         // Find the next submodule definition from the current module
         const nextSubmoduleDef = state.currentModule?.submodules.find(s => s.id === state.bufferedNextStep!.submoduleId) ?? null;
         console.log("Next Submodule Def:", nextSubmoduleDef); // Added log
         setState(prev => ({
           ...prev,
           // Apply next step info
           currentSubmoduleId: state.bufferedNextStep!.submoduleId, 
           currentSubmoduleTitle: state.bufferedNextStep!.submoduleTitle,
           currentSubmodule: nextSubmoduleDef, // Set the found definition
           currentModalSchemaId: state.bufferedNextStep!.modalSchemaId,
           currentUiComponent: state.bufferedNextStep!.uiComponent,
           // Apply the actual question data and debug info
           currentQuestionData: state.bufferedNextQuestionData,
           currentQuestionDebugInfo: state.bufferedNextQuestionDebugInfo || null, // Apply debug info
           // Reset state for new question
           userAnswer: null, 
           isAnswered: false,
           markResult: null,
           error: null, 
           // Clear buffer
           bufferedNextStep: null, 
           bufferedNextQuestionData: null, 
           bufferedNextQuestionDebugInfo: null, 
         }));
     } else if (!state.bufferedNextStep && state.isAnswered) {
         // Session ends if answered but no next step was buffered
         handleEndSession();
     } else {
         // Fallback
         console.warn("handleNextQuestion called unexpectedly, ending session.");
         handleEndSession();
     }
  };
  
  // Handle ending the session
  const handleEndSession = async () => {
     if (!state.sessionId) return;
     setState(prev => ({ ...prev, isEnding: true }));
     try {
       console.log(`Ending session: ${state.sessionId}`);
       // Add API call to end session on backend if needed
       router.replace('/dashboard/language-skills');
     } catch (error) {
       console.error('Error ending session:', error);
       setState(prev => ({ ...prev, isEnding: false, error: error instanceof Error ? error.message : 'Failed to end session' }));
     }
  };

  // Calculate stats for display
  const accuracy = state.sessionTotalAnswered > 0 
      ? Math.round((state.sessionCorrectCount / state.sessionTotalAnswered) * 100) 
      : 0;
  const incorrectCount = state.sessionTotalAnswered - state.sessionCorrectCount;

  // --- Interaction UI Renderer --- 
  const renderInteractionUI = () => {
     if (!state.currentQuestionData || !state.currentUiComponent) {
         return <div className="text-center text-muted-foreground">Loading interaction...</div>;
     }
     
     const commonProps = {
       questionData: state.currentQuestionData,
       userAnswer: state.userAnswer,
       isAnswered: state.isAnswered,
       markResult: state.markResult,
       onAnswerChange: (answer: any) => setState(prev => ({ ...prev, userAnswer: answer })),
       disabled: state.isAnswered || state.isSubmitting,
     };
 
     switch (state.currentUiComponent) {
       case 'ReadingMultipleChoice':
         return <ReadingMultipleChoiceComponent {...commonProps} />;
       case 'WritingFillInGap':
         return <WritingFillInGapComponent {...commonProps} />;
       case 'ReadingTrueFalse':
         return <ReadingTrueFalseComponent {...commonProps} />;
       case 'WritingCorrectIncorrectSentence':
         return <WritingCorrectIncorrectSentence {...commonProps} />;
       default:
         console.warn(`Rendering fallback: UI component not found for ID: ${state.currentUiComponent}`);
         return <div className="text-red-500">Error: Unknown interaction type ({state.currentUiComponent}).</div>;
     }
  };

  // --- Define Tab Content dynamically using useCallback --- 
  const questionTabContent = useCallback(() => state.currentQuestionData ? (
    <Card className="h-full bg-transparent border-none shadow-none flex flex-col">
      <CardContent className="space-y-4 flex-grow">
        {renderInteractionUI()} 
      </CardContent>
      <CardFooter className="mt-auto pt-4 border-t flex items-center justify-between">
        {state.isAnswered && state.markResult && (
           <div className={cn(
            "animate-fade-in-up",
            state.markResult.isCorrect 
              ? "text-green-700 dark:text-green-300" 
              : "text-red-700 dark:text-red-300"
          )}>
            <p className="modern-text-base font-bold mb-1">
              <strong>{state.markResult.isCorrect ? 'Correct' : 'Incorrect'}</strong>
            </p>
            <p className="modern-text-sm">{state.markResult.feedback}</p>
          </div>
        )}
        <Button 
          className={cn(
            "hover-lift active-scale transition-all ml-auto",
            state.isAnswered
              ? state.markResult?.isCorrect
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
              : "bg-gradient-to-br from-primary/80 to-primary text-primary-foreground"
          )}
          disabled={
            !state.isAnswered
              ? state.userAnswer === null || state.isSubmitting
              : state.bufferedNextStep 
                ? state.isSubmitting 
                : state.isEnding 
          }
          onClick={() => {
            if (!state.isAnswered) {
              handleSubmitAnswer();
            } else if (state.bufferedNextStep) {
              handleNextQuestion();
            } else {
              handleEndSession();
            }
          }}
        >
          {!state.isAnswered 
            ? state.isSubmitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null
            : null
          }
          <span className="modern-text-sm font-medium">
            {!state.isAnswered
              ? state.isSubmitting ? 'Checking...' : 'Check Answer'
              : state.bufferedNextStep
                ? 'Next Question' 
                : 'End Session' 
            }
          </span>
        </Button>
      </CardFooter>
    </Card>
  ) : (
    <div className="text-center text-muted-foreground modern-text-base">Waiting for session data...</div>
  ), [state, renderInteractionUI]); // Added renderInteractionUI dependency


  const aiAssistantTabContent = useCallback(() => (
    <Chat
      messages={chatMessages}
      input={chatInput}
      handleInputChange={handleChatInputChange}
      handleSubmit={handleChatSubmit}
      isLoading={isChatLoading}
      error={chatError}
      reload={reloadChat}
      stop={stopChat}
    />
  ), [chatMessages, chatInput, handleChatInputChange, handleChatSubmit, isChatLoading, chatError, reloadChat, stopChat]); // Dependencies

  const statsTabContent = useCallback(() => (
    <div className="h-full w-full flex flex-col">
       <div className="h-9 flex items-center px-3">
        <h3 className="modern-text-base font-bold">Session Stats</h3>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6 min-h-0">
        <div className="relative w-full h-full max-w-[400px] max-h-[400px] min-w-[300px] min-h-[300px]">
          {/* Ambient glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent animate-pulse-slow" />
          
          {/* Outer ring glow */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/10 animate-pulse" />
          
          {/* Full pie chart with enhanced gradient */}
          <div 
            className="absolute inset-0 rounded-full transform transition-all duration-1000 ease-out"
            style={{
              background: `conic-gradient(
                from 0deg,
                #10B981 0% ${accuracy}%,
                #EF4444 ${accuracy}% 100%
              )`,
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.15)'
            }}
          />
          
          {/* Center circle with enhanced effects */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[60%] h-[60%] rounded-full bg-gradient-to-br from-background/95 via-background/90 to-background/80 backdrop-blur-lg flex flex-col items-center justify-center shadow-2xl transform transition-all duration-300 hover:scale-105">
              {/* Inner glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-transparent" />
              
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent animate-fade-in">
                  {accuracy}%
                </div>
                <div className="text-sm text-muted-foreground mt-1 font-medium">Accuracy</div>
              </div>
            </div>
          </div>

          {/* Animated border */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-spin-slow" />
        </div>

        {/* Stats below the chart with enhanced styling */}
        <div className="flex flex-col items-center gap-4 mt-4">
          <div className="flex gap-8">
            <div className="flex items-center gap-2 group">
              <div className="relative w-3 h-3">
                <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping-slow" />
                <div className="absolute inset-0 rounded-full bg-green-500 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-green-500 transition-colors">
                {state.sessionCorrectCount} Correct
              </span>
            </div>
            <div className="flex items-center gap-2 group">
              <div className="relative w-3 h-3">
                <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping-slow" />
                <div className="absolute inset-0 rounded-full bg-red-500 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-red-500 transition-colors">
                {incorrectCount} Incorrect
              </span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground bg-background/50 px-4 py-2 rounded-full backdrop-blur-sm border border-border/10 shadow-sm">
            Total Questions: {state.sessionTotalAnswered}
          </div>
        </div>
      </div>
    </div>
  ), [state.sessionCorrectCount, state.sessionTotalAnswered, accuracy, incorrectCount]);

  // Reset selected sheet when module changes
  useEffect(() => {
    setSelectedHelperSheetId(null);
  }, [state.moduleId]);

  // Helper function to get localized title/content
  const getLocalizedSheetData = (sheet: HelperSheet | undefined) => {
    if (!sheet) return { title: 'Error', content: 'Sheet not found' };
    const lang = i18n.language;
    const localized = sheet.localization[lang];
    return {
      title: localized?.title || sheet.title_en,
      content: localized?.content || sheet.content
    };
  };

  // --- Define getContentForTab function --- 
  const getContentForTab = useCallback((tabId: string): React.ReactNode => {
    switch (tabId) {
      case 'question':
        return questionTabContent();
      case 'helper':
        if (!state.moduleId || !state.targetLanguage) return null; 

        // --- Fetch ALL sheets for the module ---
        const allModuleSheets = helperSheetRegistry.getHelperSheetsForModule(state.moduleId);

        // --- Filter sheets relevant to the TARGET language ---
        const relevantLanguageSheets = allModuleSheets.filter(sheet => 
          sheet.localization[state.targetLanguage] // Check if localization exists for the target language
        );

        // Handle case where no relevant sheets are found for the language
        if (relevantLanguageSheets.length === 0) {
          return (
            <div className="p-4 flex flex-col items-center justify-center h-full gap-4">
              <p className="text-muted-foreground text-sm italic">
                No helper sheets found for {languageNames[state.targetLanguage] || state.targetLanguage.toUpperCase()} for this module.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/library">
                  <Library className="h-4 w-4 mr-2" />
                  View Full Library
                </Link>
              </Button>
            </div>
          );
        }

        // --- Determine the primary sheet FROM THE RELEVANT SHEETS ---
        // Prefer sheet with prerequisites, otherwise take the first relevant one
        const primaryModuleSheet = relevantLanguageSheets.find(sheet => sheet.prerequisites && sheet.prerequisites.length > 0) 
                                  || relevantLanguageSheets[0]; 

        // Determine the sheet to display content for (selected prerequisite or primary)
        const sheetToDisplayContent = selectedHelperSheetId
          ? allModuleSheets.find(s => s.id === selectedHelperSheetId) // Find prereq from ALL sheets
          : primaryModuleSheet; // Default to the language-relevant primary

        if (!sheetToDisplayContent) return null; 

        const { title: displayTitle, content: displayContent } = getLocalizedSheetData(sheetToDisplayContent);

        // --- Get prerequisite sheets (based on the LANGUAGE-RELEVANT primary sheet) ---
        const prerequisiteSheets = (primaryModuleSheet.prerequisites || [])
              .map((id: string) => helperSheetRegistry.getHelperSheet(id))
              .filter((sheet): sheet is HelperSheet => sheet !== undefined);

        const isViewingPrerequisite = selectedHelperSheetId !== null && selectedHelperSheetId !== primaryModuleSheet.id;

        return (
          <div className="flex flex-col gap-8 p-6">
            {/* Back button if viewing prerequisite */}
            {isViewingPrerequisite && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-fit text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedHelperSheetId(null)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Main Sheet
              </Button>
            )}

            {/* Prerequisites Section (only show if viewing primary module sheet) */}
            {!isViewingPrerequisite && prerequisiteSheets.length > 0 && (
              <div className="space-y-3"> 
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  Prerequisites
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted">Required</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {prerequisiteSheets.map((sheet: HelperSheet) => {
                    const { title: prereqTitle } = getLocalizedSheetData(sheet);
                    return (
                      <Button 
                        key={sheet.id} 
                        variant="outline"
                        className="group relative p-4 border rounded-xl bg-card hover:bg-card/80 h-auto text-left flex flex-col items-start gap-2.5 shadow-sm transition-all hover:shadow-md hover:scale-[1.02]"
                        onClick={() => setSelectedHelperSheetId(sheet.id)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                        <h4 className="font-medium text-base">{prereqTitle}</h4>
                        {sheet.metadata?.tags && (
                          <div className="flex flex-wrap gap-1.5">
                            {sheet.metadata.tags.map((tag: string) => (
                              <span key={tag} className="text-[10px] font-medium bg-muted/50 px-2 py-0.5 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-auto text-[10px] font-medium text-muted-foreground pt-1.5 flex items-center gap-1.5">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-primary/30" />
                            CEFR {sheet.metadata?.cefrLevel || 'N/A'}
                          </span>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Main Content Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight">{displayTitle}</h2>
                  {sheetToDisplayContent.metadata?.tags && (
                    <div className="flex flex-wrap gap-1.5">
                      {sheetToDisplayContent.metadata.tags.map((tag: string) => (
                        <span key={tag} className="text-[10px] font-medium bg-muted/50 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {sheetToDisplayContent.metadata?.cefrLevel && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                      CEFR {sheetToDisplayContent.metadata.cefrLevel}
                    </span>
                  )}
                  <Button asChild variant="outline" size="sm" className="h-8">
                    <Link href="/dashboard/library">
                      <Library className="h-4 w-4 mr-2" />
                      View Full Library
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Enhanced Markdown Content */}
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-strong:font-medium prose-li:text-muted-foreground">
                <div className="[&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_table]:mt-6">
                  <div className="[&_th]:text-muted-foreground [&_th]:font-medium [&_th]:p-3 [&_th]:bg-muted/50 [&_th]:first:rounded-tl-lg [&_th]:last:rounded-tr-lg">
                    <div className="[&_td]:p-3 [&_td]:border-b [&_td]:border-muted [&_tr:last-child_td]:border-0">
                      <div className="[&_tr:hover]:bg-muted/30 [&_tr]:transition-colors">
                        <MarkdownRenderer content={displayContent} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'ai_assistant':
        return aiAssistantTabContent();
      case 'stats':
        return statsTabContent();
      default:
        return null;
    }
  }, [state.moduleId, questionTabContent, aiAssistantTabContent, statsTabContent, i18n.language, selectedHelperSheetId]);

  // --- Render Logic --- 
  if (state.isLoading) { 
      return ( <div className="flex justify-center items-center h-64"><RefreshCw className="h-8 w-8 animate-spin text-primary" /> Loading Session...</div> ); 
  }
  
  if (state.error) { // Consolidated error display
       return ( <div className="text-center text-red-500 p-8">Error: {state.error} <Button onClick={() => router.push('/dashboard/language-skills')} variant="outline">Back to Modules</Button></div> );
  }

  if (!state.sessionId) { 
      return ( <div className="text-center text-red-500 p-8">Error: No Session ID found. <Button onClick={() => router.push('/dashboard/language-skills')} variant="outline">Back</Button></div> ); 
  }
  
  // Session Ended state (check after loading and errors)
  if (!state.bufferedNextStep && state.isAnswered && !state.isSubmitting && !state.currentQuestionData) {
      // This condition might need refinement based on exact flow
      return ( <div className="text-center p-8"><p className="text-xl font-semibold mb-4">Session Complete!</p> <Button onClick={() => router.push('/dashboard/language-skills')}>Back to Modules</Button></div> );
  }

  // Fallback if question data is somehow missing after loading without error
  if (!state.currentQuestionData && !state.isLoading) {
       console.warn("No currentQuestionData found after loading without error."); // Added log
       return ( <div className="text-center text-muted-foreground p-8">Could not load question data. <Button onClick={() => router.push('/dashboard/language-skills')} variant="outline">Back</Button></div> );
  }

  // Load helper sheets
  loadHelperSheets();

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full w-full relative">
        <GradientBlobs />
        <div className="flex-none z-20">
          <div className="flex items-center justify-between px-4 py-2 mx-2 mt-2 rounded-lg bg-sidebar border border-ring/30 backdrop-blur-md">
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-foreground">
                {languageNames[state.targetLanguage] || state.targetLanguage.toUpperCase()} Session
              </h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary">
                  <BookOpen className="h-3 w-3" />
                  {state.currentModule?.title_en || 'Loading...'}
                </span>
                <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/10 text-secondary-foreground">
                  <Brain className="h-3 w-3" />
                  {state.currentSubmoduleTitle || 'Loading...'}
                </span>
                <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-accent-foreground">
                  <Puzzle className="h-3 w-3" />
                  {state.currentModalSchemaId?.replace(/-/g, ' ') || 'Loading...'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm border border-border/10">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{languageFlags[state.targetLanguage] || '🏳️'}</span>
                    <span className="font-medium">{state.targetLanguage.toUpperCase()}</span>
                  </div>
                  <ArrowLeft className="h-3 w-3 rotate-180" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{languageFlags[state.sourceLanguage] || '🏳️'}</span>
                    <span className="font-medium">{state.sourceLanguage.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-muted-foreground hover:text-primary hover:bg-primary/10 border-border/50 cursor-pointer transition-all"
                onClick={() => router.push('/dashboard/language-skills')}
              >
                End Session
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-all"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <SessionSettings />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {/* Pass layout state and handlers to TabSystem */}
          {/* Also fixes the linter error by providing correct props */}
          <TabSystem 
            layout={layout} // Pass the layout state
            onLayoutChange={setLayout} // Pass the setState function directly
            getContentForTab={getContentForTab} // Pass the content getter
          />
        </div>

        {process.env.NODE_ENV === 'development' && 
          <DebugMenu 
            sessionState={state} 
            onQuestionGenerated={handleDebugQuestionGenerated}
          />
        }
      </div>
    </DndProvider>
  );
} 