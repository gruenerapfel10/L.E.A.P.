'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, Loader2, VolumeX } from "lucide-react";
import { cn } from '@/lib/utils';
import HintButton from './HintButton';
import { useConversation, Role } from '@11labs/react';
import { z } from 'zod';

// Define the structure for a single question/turn
const ConversationTurnSchema = z.object({
  text: z.string(),
  instruction: z.string().optional(),
  // Add other relevant fields if needed, e.g., expected_answer
});

// Define the schema for the main data prop
const SpeakingConversationDataSchema = z.object({
  instruction: z.string(), // Overall instruction for the conversation
  questions: z.array(ConversationTurnSchema), // Array of turns/questions
  hint: z.string().optional(), // Add optional hint
  showHint: z.boolean().optional(), // Add optional showHint flag
});

type SpeakingConversationData = z.infer<typeof SpeakingConversationDataSchema>;

// Define the structure for the user's answer
type SpeakingAnswer = {
  transcript: string;
  // Add confidence score or other metrics if available
};

// Types for the component props, matching the schema from the modal definition
interface InteractionProps {
  data: SpeakingConversationData;
  onAnswer: (answer: SpeakingAnswer) => void;
  onAnswerChange?: (answer: SpeakingAnswer) => void; // Optional: For real-time updates if needed
  isMarked: boolean;
  isCorrect?: boolean;
  feedback?: string;
  disabled?: boolean;
  targetLanguage?: string; // Add targetLanguage prop
}

// Define component states for the conversation flow
type ComponentState = 
  | 'idle'           // Initial state
  | 'connecting'     // Connecting to ElevenLabs
  | 'aiSpeaking'     // AI is speaking the question
  | 'listening'      // User's microphone is active
  | 'processing'     // Processing user's speech
  | 'error';         // Error state

const SpeakingConversation: React.FC<InteractionProps> = ({
  data,
  onAnswer,
  onAnswerChange,
  isMarked,
  isCorrect,
  feedback = '',
  disabled = false,
  targetLanguage,
}) => {
  // Add defensive checks at the start
  if (!data) {
    console.error('SpeakingConversation: data prop is undefined');
    return (
      <div className="p-4 text-red-500">
        Error: Conversation data is missing
      </div>
    );
  }

  // Validate data against schema (optional but recommended)
  const parseResult = SpeakingConversationDataSchema.safeParse(data);
  if (!parseResult.success) {
    console.error('SpeakingConversation: data prop validation failed', parseResult.error);
    return (
        <div className="p-4 text-red-500">
            Error: Invalid conversation data structure.
        </div>
    );
  }
  const validatedData = parseResult.data; // Use validated data

  if (!Array.isArray(validatedData.questions) || validatedData.questions.length === 0) {
    console.error('SpeakingConversation: questions array is missing or empty', validatedData);
    return (
      <div className="p-4 text-red-500">
        Error: No conversation questions available
      </div>
    );
  }

  // Application state
  const [componentState, setComponentState] = useState<ComponentState>('idle');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const hasStartedRef = useRef(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false); // Local connection state

  // Initialize ElevenLabs conversation
  const conversation = useConversation({
    onConnect: () => {
      console.log('ElevenLabs Connected');
      setIsConnected(true); // Update local state
      // Now that connection is confirmed, speak the first question
      speakFirstQuestion(); 
    },
    onDisconnect: () => {
        console.log('ElevenLabs Disconnected');
        setIsConnected(false); // Update local state
    },
    onMessage: (props: { message: string; source: Role }) => { 
      console.log('ElevenLabs Message:', props.message, 'Source:', props.source);
      // Assumption: The hook handles transcript updates internally, 
      // reflected in a state variable or the hook's return value.
      // We don't need to parse the message here for transcript/error based on this type.
    },
    onError: (err: unknown) => { // Type err as unknown for safer checking
      // Handle connection errors or other fatal errors
      console.error('ElevenLabs Hook Error:', err);
      // Attempt to provide a more specific error message if possible
      let errorMessage = 'Failed to connect to speech service.';
      // Check if it looks like a CloseEvent by checking properties
      if (typeof err === 'object' && err !== null && 'code' in err && 'reason' in err) {
          const closeEvent = err as CloseEvent; // Safe to cast now
          errorMessage = `Connection closed unexpectedly: ${closeEvent.reason || 'Unknown reason'} (Code: ${closeEvent.code})`;
      } else if (err instanceof Error) {
          errorMessage = err.message;
      } else if (typeof err === 'string') {
          errorMessage = err;
      }
      setError(errorMessage);
      setIsConnected(false); // Assume disconnected on error
      setComponentState('error');
    },
  });

  const speakFirstQuestion = useCallback(() => {
    if (!validatedData.questions || validatedData.questions.length === 0 || !validatedData.questions[0].text) {
      console.error('No initial question text available to speak.');
      setError('Missing initial question text.');
      setComponentState('error');
      return;
    }

    // Cancel any ongoing speech
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }

    const firstQuestionText = validatedData.questions[0].text;
    console.log(`Attempting to speak first question: "${firstQuestionText}"`);
    const utterance = new SpeechSynthesisUtterance(firstQuestionText);
    utteranceRef.current = utterance; // Store reference

    // Attempt to set the language for the utterance
    if (targetLanguage) {
      const availableVoices = window.speechSynthesis.getVoices();
      // Simple language code match (e.g., 'en-US', 'de-DE')
      const voiceForLang = availableVoices.find(voice => voice.lang.startsWith(targetLanguage)); 
      if (voiceForLang) {
        utterance.voice = voiceForLang;
        utterance.lang = voiceForLang.lang;
        console.log(`Using voice: ${voiceForLang.name} (${voiceForLang.lang})`);
      } else {
        utterance.lang = targetLanguage; // Set lang even if specific voice not found
        console.warn(`No specific browser voice found for language ${targetLanguage}. Using default.`);
      }
    } else {
        console.warn('targetLanguage prop not provided, using default voice/language.');
    }

    utterance.onstart = () => {
      console.log('Browser speech started.');
      setComponentState('aiSpeaking'); // Use 'aiSpeaking' state while browser talks
    };

    utterance.onend = () => {
      console.log('Browser speech finished.');
      utteranceRef.current = null;
      // Now transition to listening for user input via ElevenLabs
      // Use the local isConnected state
      if (isConnected) { 
          setComponentState('listening');
          console.log('State changed to listening');
          // Optional: Could start ElevenLabs listening explicitly if needed, 
          // but usually it listens automatically after connection.
      } else {
          console.warn('Speech ended but ElevenLabs not connected, returning to idle.');
          setError('Speech service connection failed after initial prompt.');
          setComponentState('error');
      }
    };

    utterance.onerror = (event) => {
      console.error('Browser speech synthesis error:', event.error);
      setError(`Failed to speak initial question: ${event.error}`);
      utteranceRef.current = null;
      setComponentState('error');
    };

    window.speechSynthesis.speak(utterance);

  }, [validatedData.questions, targetLanguage, conversation, isConnected]); // Add dependencies

  const startConversation = useCallback(async () => {
    setError(null); // Clear previous errors
    setTranscript(''); // Clear previous transcript
    setComponentState('connecting');
    console.log('Starting conversation flow...');

    if (!validatedData.questions || validatedData.questions.length === 0) {
      console.error('No questions available');
      setError('No questions available for this exercise.');
      setComponentState('error');
      return;
    }

    // Check for agent ID configuration
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
    if (!agentId) {
      console.error('ElevenLabs Agent ID not configured');
      setError('Speech service not properly configured. Please check environment variables.');
      setComponentState('error'); 
      return;
    }

    // Request microphone permission
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (micError) {
      console.error('Microphone permission denied:', micError);
      setError('Please allow microphone access to use this feature.');
      setComponentState('error');
      return;
    }

    // Start the ElevenLabs session (connection happens in the background)
    // The onConnect callback will trigger speakFirstQuestion
    try {
        console.log(`Attempting to start ElevenLabs session with agent: ${agentId}`);
        // Ensure not already connected or connecting
        if (!isConnected && componentState !== 'connecting') {
            await conversation.startSession({ agentId });
            console.log('conversation.startSession called successfully.');
        } else {
             console.log('Session already connected or connecting, skipping startSession call.');
             // If already connected, maybe trigger speakFirstQuestion directly?
             if (isConnected) speakFirstQuestion();
        }
        // State will change to 'aiSpeaking' and then 'listening' via the onConnect -> speakFirstQuestion flow
    } catch (sessionError) {
        console.error('Failed to start ElevenLabs session:', sessionError);
        setError('Unable to connect to speech service. Please try again later.');
        setComponentState('error');
        setIsConnected(false);
        // No need to return here, error state is set
    }
}, [conversation, validatedData.questions, isConnected, componentState, speakFirstQuestion]); // Add dependencies

  const stopRecordingAndSubmit = useCallback(() => {
    console.log('Stopping recording and submitting...');
    setComponentState('processing'); // Indicate processing
    
    // End the ElevenLabs session if active
    if (isConnected) {
        console.log('Ending ElevenLabs session manually.');
        conversation.endSession(); // This should trigger onDisconnect
        setIsConnected(false); // Assume disconnect starts immediately
    }

    // Cancel browser speech if it was somehow still active
    if (utteranceRef.current) {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
    }

    // Use the final transcript
    console.log('Final Transcript:', transcript);
    const finalAnswer: SpeakingAnswer = { transcript };

    // Call the onAnswer prop with the final transcript
    onAnswer(finalAnswer);

    // Reset component state after submission (or rely on parent component state change)
    // setComponentState('idle'); // Can be set here or managed by parent via props

  }, [conversation, onAnswer, transcript, isConnected]);

  // --- Effects ---
  // Effect to load voices for SpeechSynthesis
  useEffect(() => {
    const loadVoices = () => {
        window.speechSynthesis.getVoices(); 
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []); // Run only once on mount

  // Effect to auto-start conversation on mount if not disabled
  useEffect(() => {
    console.log('Initialization effect:', {
      hasStarted: hasStartedRef.current,
      disabled,
      questionCount: validatedData.questions?.length || 0
    });

    // Auto-start only if idle and not disabled
    if (!hasStartedRef.current && !disabled && componentState === 'idle') {
      console.log('Auto-starting conversation...');
      hasStartedRef.current = true;
      startConversation();
    } else {
      console.log('Not auto-starting because:', {
        hasStarted: hasStartedRef.current,
        disabled,
        state: componentState,
        questionCount: validatedData.questions?.length || 0
      });
    }
    // Intentionally excluding startConversation from dependencies to only run on mount/disabled change
  }, [disabled, validatedData.questions, componentState]); 

  // Effect to handle external state changes (e.g., moving to next question via isMarked)
  useEffect(() => {
    if (isMarked) {
      // If the interaction is marked externally, reset the state
      console.log('Resetting component state due to isMarked=true');
      setComponentState('idle');
      setTranscript(''); // Clear transcript for the next round
      setError(null);
      hasStartedRef.current = false; // Allow auto-start for the next question
      // Cancel any ongoing speech synthesis if marking happens mid-speech
       if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
       }
       if (utteranceRef.current) {
          utteranceRef.current = null;
       }
       // Ensure ElevenLabs session is ended if it was connected
       if (isConnected) {
           console.log('Ending session due to isMarked=true');
           conversation.endSession();
           setIsConnected(false);
       }
    }
  }, [isMarked, conversation, isConnected]); // Add conversation and isConnected

  // Cleanup on unmount: End session and cancel speech
  useEffect(() => {
    // Return a cleanup function
    return () => {
        console.log('SpeakingConversation unmounting...');
        if (isConnected) { // Check local state
          console.log('Ending ElevenLabs session on unmount.');
          conversation.endSession();
          // No need to setIsConnected(false) here as component is unmounting
        }
        if (window.speechSynthesis.speaking) {
            console.log('Cancelling browser speech on unmount.');
            window.speechSynthesis.cancel();
        }
        if (utteranceRef.current) {
           utteranceRef.current = null; // Clear ref
        }
    };
  }, [conversation, isConnected]); // Add isConnected

  // Render different UI based on component state
  const renderUI = () => {
    switch (componentState) {
      case 'connecting':
        return (
          <div className="flex flex-col items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
            <p className="text-sm text-gray-500">Connecting to speech service...</p>
          </div>
        );
      case 'aiSpeaking':
      case 'listening':
      case 'processing':
        const isListening = componentState === 'listening';
        const isProcessing = componentState === 'processing';
        return (
          <div className="flex flex-col items-center space-y-4 p-4">
            <p className="text-center text-gray-600 dark:text-gray-300">
              {componentState === 'aiSpeaking' ? 'Listen to the question...' : 'Speak your answer...'}
            </p>
            <Button
              variant="outline"
              size="icon"
              onClick={stopRecordingAndSubmit}
              disabled={isProcessing || isMarked || disabled}
              className={`rounded-full w-16 h-16 ${isListening ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-200'}`}
            >
              {isProcessing ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Mic className={`h-6 w-6 ${isListening ? '' : 'text-gray-500'}`} />
              )}
            </Button>
            <p className="text-sm text-gray-500 min-h-[20px]">
              {transcript || (isListening ? 'Listening...' : (isProcessing ? 'Processing...' : ''))}
            </p>
            {/* Optional Mute Button - Consider if needed for agent audio 
            <Button variant="ghost" size="sm" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button> 
            */}
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center p-4 text-red-600">
            <p className="mb-2">Error: {error || 'An unknown error occurred.'}</p>
            <Button onClick={startConversation} variant="secondary" size="sm">
              Try Again
            </Button>
          </div>
        );
      case 'idle':
      default:
        // Initial state or after being marked
        return (
          <div className="flex flex-col items-center justify-center p-4">
            <Button 
              onClick={startConversation} 
              disabled={isMarked || disabled}
              size="lg"
            >
              <Mic className="mr-2 h-5 w-5" /> Start Speaking Exercise
            </Button>
          </div>
        );
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Exercise progress indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {validatedData.questions.length}
        </div>
        <div className="flex space-x-1">
          {validatedData.questions.map((_, index) => (
            <div 
              key={index} 
              className={cn(
                "h-2 w-8 rounded",
                currentQuestionIndex === index 
                  ? "bg-primary" 
                  : index < currentQuestionIndex 
                    ? "bg-primary/50" 
                    : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
      
      {/* Hint button - Show if hint exists and state is active */}
      {validatedData.hint && !['idle', 'connecting', 'error'].includes(componentState) && (
        <HintButton
          hint={validatedData.hint}
          initialShowHint={validatedData.showHint ?? false} // Provide default for initialShowHint
          disabled={disabled}
        />
      )}
      
      {/* Main UI based on state */}
      {renderUI()}

      {/* Feedback Section (Only shown after marking) */}
      {isMarked && (
        <div 
          className={`mt-4 p-3 rounded-md text-sm ${isCorrect ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}`}
        >
          <p className="font-medium">
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </p>
          {feedback && <p>{feedback}</p>}
        </div>
      )}
    </div>
  );
};

export default SpeakingConversation; 