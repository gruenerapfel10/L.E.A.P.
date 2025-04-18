import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, Play, AlertCircle } from 'lucide-react';
import HintButton from './HintButton';
import { Card } from '@/components/ui/card';
import { SpeakingConversationSchema } from '@/lib/learning/modals/definitions/speaking-conversation.modal';
import { Progress } from '@/components/ui/progress';

// Define props interface based on what SessionPage will provide
interface SpeakingConversationProps {
  questionData: SpeakingConversationSchema;
  userAnswer: any;
  isAnswered: boolean;
  markResult: any | null;
  onAnswerChange: (answer: any) => void;
  disabled: boolean;
  targetLanguage: string;
}

// Define typing for the current conversation state
interface ConversationState {
  questionIndex: number;
  transcript: string;
  isRecording: boolean;
  isPlaying: boolean;
  hasPermission: boolean | null;
  errorMessage: string | null;
  finishedQuestions: boolean[];
  isProcessing: boolean;
}

const SpeakingConversation: React.FC<SpeakingConversationProps> = ({
  questionData,
  userAnswer,
  isAnswered,
  markResult,
  onAnswerChange,
  disabled,
  targetLanguage
}) => {
  // Initialize state for conversation
  const [state, setState] = useState<ConversationState>({
    questionIndex: 0,
    transcript: '',
    isRecording: false,
    isPlaying: false,
    hasPermission: null,
    errorMessage: null,
    finishedQuestions: Array(questionData.questions.length).fill(false),
    isProcessing: false
  });

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize on component mount
  useEffect(() => {
    // Initialize user answer if not already set
    if (!userAnswer && questionData?.questions?.length > 0) {
      setTimeout(() => {
        onAnswerChange({
          questionIndex: 0,
          transcript: '',
          responses: Array(questionData.questions.length).fill('')
        });
      }, 0);
    }

    // Check microphone permission on mount
    checkMicrophonePermission();

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Effect to update parent state when transcript changes
  // This prevents the "setState during render" error
  useEffect(() => {
    if (state.transcript && !state.isProcessing) {
      const updatedResponses = userAnswer?.responses 
        ? [...userAnswer.responses] 
        : Array(questionData.questions.length).fill('');
      
      updatedResponses[state.questionIndex] = state.transcript;
      
      onAnswerChange({
        questionIndex: state.questionIndex,
        transcript: state.transcript,
        responses: updatedResponses
      });
    }
  }, [state.transcript, state.isProcessing]);

  // Function to check microphone permission
  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setState(prev => ({ ...prev, hasPermission: true, errorMessage: null }));
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission error:', error);
      setState(prev => ({
        ...prev,
        hasPermission: false,
        errorMessage: 'Microphone access denied. Please allow microphone access in browser settings.'
      }));
      return false;
    }
  };

  // Function to play the current question using TTS
  const playQuestion = async () => {
    if (state.isPlaying || state.isRecording || state.isProcessing) return;

    setState(prev => ({ ...prev, isPlaying: true, errorMessage: null }));

    try {
      const currentQuestion = questionData.questions[state.questionIndex];
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentQuestion.content,
          languageCode: targetLanguage,
          ssmlGender: 'FEMALE'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `TTS API Error: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setState(prev => ({ ...prev, isPlaying: false }));
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        setState(prev => ({ ...prev, isPlaying: false, errorMessage: 'Error playing question audio.' }));
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play();
    } catch (error) {
      console.error('Error playing question:', error);
      setState(prev => ({ ...prev, isPlaying: false, errorMessage: error instanceof Error ? error.message : 'Failed to play question.' }));
    }
  };

  // Function to start recording
  const startRecording = async () => {
    if (state.isRecording || state.isPlaying || state.isProcessing || disabled) return;

    try {
      // Request high-quality audio with specific constraints 
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        } 
      });
      streamRef.current = stream;
      
      // Use a higher bitrate for better quality
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000, // Higher bitrate for better quality
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Set processing state
        setState(prev => ({ ...prev, isProcessing: true, errorMessage: null }));

        try {
          // Create blob and convert to base64
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
          
          // Debug: Log the audio size
          console.log(`Audio recording size: ${audioBlob.size} bytes`);
          
          // Add audio playback for debugging
          if (audioBlob.size > 0) {
            const audioUrl = URL.createObjectURL(audioBlob);
            console.log("Debug: Created audio URL for debugging", audioUrl);
            // Uncomment to hear what was recorded:
            // const audio = new Audio(audioUrl);
            // audio.play();
          } else {
            console.error("No audio data recorded (blob size is 0)");
            throw new Error('No audio data was recorded');
          }
          
          const base64Audio = await blobToBase64(audioBlob);
          
          if (!base64Audio) {
            throw new Error('Failed to convert audio to base64');
          }

          // Log part of the base64 to verify it's not empty
          console.log(`Base64 audio data length: ${base64Audio.length}, 
                      first 50 chars: ${base64Audio.substring(0, 50)}...`);

          // Send to API with very clear debug message
          console.log(`Sending speech recognition request for language: ${targetLanguage}`);
          const response = await fetch('/api/speech-to-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio: base64Audio,
              languageCode: targetLanguage
            }),
          });

          // Check for error responses and parse the error message
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `Server error: ${response.status}`;
            console.error('Speech recognition API error:', errorMessage);
            throw new Error(errorMessage);
          }

          // Get transcript
          const data = await response.json();
          
          // Debug the response
          console.log('Speech recognition response:', data);
          
          // Check if we have a transcript
          if (!data.transcript || data.transcript === '') {
            console.warn('Empty transcript received from API');
          }
          
          const transcript = data.transcript || 'No speech detected';

          // Update state with transcript
          setState(prev => {
            const updatedFinished = [...prev.finishedQuestions];
            updatedFinished[prev.questionIndex] = true;

            return {
              ...prev,
              transcript,
              finishedQuestions: updatedFinished,
              isProcessing: false
            };
          });
        } catch (error) {
          console.error('Speech recognition error:', error);
          setState(prev => ({ 
            ...prev, 
            errorMessage: error instanceof Error ? error.message : 'Failed to process speech.',
            isProcessing: false
          }));
        }
      };

      // Start recording with a 1-second timeslice to gather data more frequently
      mediaRecorder.start(1000);
      setState(prev => ({ ...prev, isRecording: true, errorMessage: null }));
    } catch (error) {
      console.error('Recording error:', error);
      setState(prev => ({ ...prev, errorMessage: 'Failed to start recording.' }));
    }
  };

  // Helper function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64 = reader.result?.toString().split(',')[1] || null;
        resolve(base64);
      };
      reader.onerror = () => resolve(null);
    });
  };

  // Function to stop recording
  const stopRecording = () => {
    if (!mediaRecorderRef.current || !state.isRecording) return;

    mediaRecorderRef.current.stop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setState(prev => ({ ...prev, isRecording: false }));
  };

  // Determine current display elements based on state
  const currentQuestion = questionData.questions[state.questionIndex];
  const isLastQuestion = state.questionIndex === questionData.questions.length - 1;
  const allQuestionsAnswered = state.finishedQuestions.every(q => q === true);
  const progress = Math.round(
    (state.finishedQuestions.filter(Boolean).length / questionData.questions.length) * 100
  );

  // Render permission error if microphone access denied
  if (state.hasPermission === false) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Microphone Access Required</h3>
        <p className="mb-4">{state.errorMessage || "Please allow microphone access."}</p>
        <Button onClick={checkMicrophonePermission}>Check Permission Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {state.questionIndex + 1} of {questionData.questions.length}</span>
          <span>{progress}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Conversation Theme */}
      <div className="text-center mb-4">
        <span className="text-sm font-medium bg-secondary/50 px-3 py-1 rounded-full">
          {questionData.conversationTheme}
        </span>
      </div>

      {/* Instructions */}
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground mb-1">{questionData.sourceLanguageInstructions}</p>
        <p className="text-sm italic">{questionData.targetLanguageInstructions}</p>
      </div>

      {/* Question Card */}
      <Card className="p-4 relative overflow-hidden">
        {state.isPlaying && (
          <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
            <Volume2 className="w-8 h-8 text-primary animate-pulse" />
          </div>
        )}
        <div className="flex items-start gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={playQuestion}
            disabled={state.isPlaying || state.isRecording || disabled}
          >
            <Play className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-xl font-medium">{currentQuestion?.content || "No question available"}</p>
            {state.isRecording && (
              <p className="text-xs text-muted-foreground animate-pulse mt-1">
                Recording...
              </p>
            )}
            {state.isProcessing && (
              <p className="text-xs text-muted-foreground animate-pulse mt-1">
                Processing...
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Transcript Display */}
      {state.transcript && (
        <Card className="p-4 bg-muted/50 min-h-[60px]">
          <p className="font-medium mb-1">Your response:</p>
          <p className="text-muted-foreground italic">
            {state.transcript}
          </p>
        </Card>
      )}

      {/* Hint Button */}
      <HintButton
        hint={questionData.hint}
        initialShowHint={questionData.showHint}
        disabled={disabled}
      />

      {/* Error Message */}
      {state.errorMessage && (
        <div className="text-sm text-red-500 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          {state.errorMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        {/* Record/Stop Button */}
        <Button 
          variant={state.isRecording ? "destructive" : "outline"}
          onClick={state.isRecording ? stopRecording : startRecording}
          disabled={
            state.hasPermission !== true ||
            state.isPlaying ||
            state.isProcessing ||
            disabled
          }
          className={`flex-1 transition-colors duration-200 ${state.isRecording ? 'animate-pulse' : ''}`}
          style={{ minWidth: '160px' }}
        >
          {state.isRecording ? (
            <>
              <MicOff className="mr-2 h-4 w-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Record Answer
            </>
          )}
        </Button>
        
        {/* Next Question Button */}
        {!isLastQuestion && state.finishedQuestions[state.questionIndex] && !state.isRecording && !state.isProcessing && (
          <Button 
            variant="secondary"
            onClick={() => {
              setState(prev => ({ ...prev, questionIndex: prev.questionIndex + 1, transcript: '' }));
            }}
            disabled={disabled || state.isRecording || state.isProcessing}
            className="flex-1"
          >
            Next Question &rarr;
          </Button>
        )}
        
        {/* Submit Button */}
        {(allQuestionsAnswered || (isLastQuestion && state.finishedQuestions[state.questionIndex])) && !state.isRecording && !state.isProcessing && (
          <Button 
            variant="default"
            onClick={() => {
              onAnswerChange({
                ...userAnswer,
                isCompleted: true
              });
            }}
            disabled={disabled || state.isRecording || state.isProcessing}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            Submit Conversation
          </Button>
        )}
      </div>

      {/* Feedback when submitted */}
      {isAnswered && markResult && (
        <Card className="p-4 mt-4 bg-muted/30 border-primary">
          <h3 className="font-medium mb-2">Feedback</h3>
          <p>{markResult.feedback}</p>
          {markResult.pronunciation && ( <div className="mt-2"><p className="font-medium">Pronunciation: {markResult.pronunciation.score}/100</p><p className="text-sm">{markResult.pronunciation.feedback}</p></div> )}
          {markResult.grammar && ( <div className="mt-2"><p className="font-medium">Grammar: {markResult.grammar.score}/100</p><p className="text-sm">{markResult.grammar.feedback}</p></div> )}
          {markResult.fluency && ( <div className="mt-2"><p className="font-medium">Fluency: {markResult.fluency.score}/100</p><p className="text-sm">{markResult.fluency.feedback}</p></div> )}
        </Card>
      )}
    </div>
  );
};

export default SpeakingConversation; 