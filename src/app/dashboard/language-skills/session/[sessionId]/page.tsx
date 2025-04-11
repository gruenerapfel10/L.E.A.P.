'use client';

import { useEffect, useState, use, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, ArrowLeft, BookOpen, RefreshCw, Brain, Check, Percent, Hash, X,
  Puzzle,
  FileQuestion,
  Bot,
} from 'lucide-react';
import { ReadingMultipleChoiceComponent } from '@/components/learning/interactions/ReadingMultipleChoice';
import { WritingFillInGapComponent } from '@/components/learning/interactions/WritingFillInGap';
import { ReadingTrueFalseComponent } from '@/components/learning/interactions/ReadingTrueFalse';
import { DebugMenu } from '@/components/learning/debug-menu';
import { StatCard } from '@/components/learning/stat-card';
import { WritingCorrectIncorrectSentence } from '@/components/learning/interactions/WritingCorrectIncorrectSentence';
import { HelperSidePanel } from '@/components/learning/HelperSidePanel';
import { ModuleDefinition, SubmoduleDefinition } from '@/lib/learning/types';
import { TabSystem, type LayoutNode } from '@/components/learning/TabSystem';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { cn } from '@/lib/utils';
import { Chat } from '@/components/learning/ai/chat';
import { useChat, type Message } from '@ai-sdk/react';

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
}

interface SubmitApiResponse {
  markResult: any;
  nextStep: NextStepInfo | null;
  nextQuestionData: any | null;
  nextQuestionDebugInfo: any | null;
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

export default function SessionPage({ params }: SessionPageProps) {
  const resolvedParams = use(params);
  const initialSessionId = resolvedParams.sessionId;
  const router = useRouter();

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

  // Prepare the context data for the chat
  const chatContextBody = {
    module: state.currentModule ? { id: state.currentModule.id, title: state.currentModule.title_en } : null,
    submodule: state.currentSubmodule ? { id: state.currentSubmodule.id, title: state.currentSubmodule.title_en } : null,
    currentQuestionData: state.currentQuestionData,
    userAnswer: state.userAnswer,
    isAnswered: state.isAnswered,
    markResult: state.markResult,
    sessionStats: {
      correctCount: state.sessionCorrectCount,
      totalAnswered: state.sessionTotalAnswered
    }
  };

  // Lift useChat hook here
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
    body: chatContextBody, // Pass context
    // Keep messages in state across renders
    // initialMessages could be fetched if needed, but useChat handles history if backend provides it
    onError: (err) => {
      console.error("[Session Page Chat Error]", err);
      // Consider adding user-facing error display here if needed
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
        markResult: result.markResult, 
        // Update session stats
        sessionTotalAnswered: prev.sessionTotalAnswered + 1,
        sessionCorrectCount: prev.sessionCorrectCount + (result.markResult?.isCorrect ? 1 : 0),
        // Buffer next step
        bufferedNextStep: result.nextStep, 
        bufferedNextQuestionData: result.nextQuestionData, 
        bufferedNextQuestionDebugInfo: result.nextQuestionDebugInfo,
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
      <CardHeader>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            {state.currentSubmoduleTitle ? (
              <Badge 
                variant="outline" 
                className="modern-text-xs"
              >
                <Brain className="w-3 h-3 mr-1" />
                {state.currentSubmoduleTitle}
              </Badge>
            ) : null}
            {state.currentModalSchemaId && (
              <Badge variant="secondary" className="modern-text-xs">
                <Puzzle className="w-3 h-3 mr-1" /> {state.currentModalSchemaId.replace(/-/g, ' ')}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
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

  const helperTabContent = useCallback(() => (
    <Card className="h-full bg-transparent border-none shadow-none">
      <HelperSidePanel 
        submodule={state.currentSubmodule}
        module={state.currentModule}
        moduleOverviewMode={true} // Assuming this is desired
        onClose={() => {}} // Provide a dummy or actual close handler if needed
      />
    </Card>
  ), [state.currentSubmodule, state.currentModule]); // Dependencies

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
      <div className="flex-1 flex flex-col p-1.5 gap-1.5">
        <div className={cn(
          "relative flex-1 rounded-lg p-3",
          "bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5",
          "border border-primary/10",
          "hover:from-primary/10 hover:via-primary/15 hover:to-primary/10",
          "transition-all duration-300",
          "glass"
        )}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1),transparent_50%)]"></div>
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <div className="display-text text-primary mb-0.5">{accuracy}%</div>
            <div className="modern-text-sm text-muted-foreground">Accuracy</div>
            <div className="modern-text-xs text-muted-foreground">
              {state.sessionCorrectCount}/{state.sessionTotalAnswered} correct
            </div>
          </div>
        </div>

        <div className="flex-1 flex gap-1.5">
          <div className={cn(
            "relative flex-1 rounded-lg p-3",
            "bg-gradient-to-br from-green-500/5 via-green-500/10 to-green-500/5",
            "border border-green-500/10",
            "hover:from-green-500/10 hover:via-green-500/15 hover:to-green-500/10",
            "transition-all duration-300",
            "glass"
          )}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.1),transparent_50%)]"></div>
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
              <div className="modern-text-xl font-bold text-green-500 mb-0.5">{state.sessionCorrectCount}</div>
              <div className="modern-text-xs text-muted-foreground">Correct</div>
            </div>
          </div>

          <div className={cn(
            "relative flex-1 rounded-lg p-3",
            "bg-gradient-to-br from-red-500/5 via-red-500/10 to-red-500/5",
            "border border-red-500/10",
            "hover:from-red-500/10 hover:via-red-500/15 hover:to-red-500/10",
            "transition-all duration-300",
            "glass"
          )}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.1),transparent_50%)]"></div>
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
              <div className="modern-text-xl font-bold text-red-500 mb-0.5">{incorrectCount}</div>
              <div className="modern-text-xs text-muted-foreground">Incorrect</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ), [state.sessionCorrectCount, state.sessionTotalAnswered, accuracy, incorrectCount]); // Dependencies

  // --- Define getContentForTab function --- 
  const getContentForTab = useCallback((tabId: string): React.ReactNode => {
    switch (tabId) {
      case 'question':
        return questionTabContent();
      case 'helper':
        return helperTabContent();
      case 'ai_assistant':
        return aiAssistantTabContent();
      case 'stats':
        return statsTabContent();
      default:
        return null; // Or some default content/error message
    }
  }, [questionTabContent, helperTabContent, aiAssistantTabContent, statsTabContent]); // Add tab content functions as dependencies

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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full w-full relative">
        <GradientBlobs />
        <div className="flex-none z-20">
          <div className="flex items-center justify-between px-4 py-2 mx-2 mt-2 rounded-lg bg-sidebar border border-border backdrop-blur-md">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-all"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-semibold text-foreground">Session</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-all"
              onClick={() => router.push('/dashboard/language-skills')}
            >
              End Session
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden mt-2">
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