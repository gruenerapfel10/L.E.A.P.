import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Loader2, AlertCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import HintButton from './HintButton';
import { cn } from '@/lib/utils';

// Props interface matching commonProps in SessionPage plus targetLanguage
interface ListeningTranscribeProps {
  questionData: any; // We'll improve this with a proper type once we have the schema
  userAnswer: string | null;
  isAnswered: boolean;
  markResult: any | null;
  onAnswerChange: (answer: string | null) => void;
  disabled: boolean;
  targetLanguage: string;
}

export const ListeningTranscribeComponent: React.FC<ListeningTranscribeProps> = ({
  questionData,
  userAnswer,
  isAnswered,
  markResult,
  onAnswerChange,
  disabled,
  targetLanguage,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioObject, setAudioObject] = useState<HTMLAudioElement | null>(null);

  // Clean up audio object on unmount or when question changes
  useEffect(() => {
    return () => {
      if (audioObject) {
        audioObject.pause();
        URL.revokeObjectURL(audioObject.src);
        setAudioObject(null);
      }
    };
  }, [audioObject, questionData]);

  // Function to play the audio
  const playAudio = async () => {
    if (isPlaying || !questionData?.audioText) return;

    setIsPlaying(true);
    setAudioError(null);

    try {
      // Call TTS API endpoint
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: questionData.audioText,
          languageCode: targetLanguage,
          ssmlGender: 'FEMALE' // Or make dynamic if needed
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate speech: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const newAudio = new Audio(audioUrl);
      setAudioObject(newAudio);

      newAudio.onended = () => {
        setIsPlaying(false);
        // Don't revoke here, allow replaying
      };

      newAudio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setAudioError('Error playing audio. Please try again.');
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        setAudioObject(null);
      };

      newAudio.play();

    } catch (error) {
      console.error('Error fetching or playing audio:', error);
      setAudioError(error instanceof Error ? error.message : 'Could not fetch audio.');
      setIsPlaying(false);
    }
  };
  
  // Function to replay audio if already loaded
  const replayAudio = () => {
    if (audioObject && !isPlaying) {
      setIsPlaying(true);
      audioObject.currentTime = 0; // Rewind
      audioObject.play();
    } else if (!isPlaying) {
      playAudio(); // Fetch and play if not loaded
    }
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Instructions / Prompt */}
      <div className="text-center">
        <p className="text-lg font-semibold">Listen carefully and transcribe what you hear.</p>
        <p className="text-sm text-muted-foreground">Type the sentence exactly as it was spoken.</p>
      </div>

      {/* Audio Player Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="lg"
          onClick={replayAudio}
          disabled={isPlaying || disabled}
          className="flex items-center gap-2 group"
        >
          {isPlaying ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Volume2 className="h-5 w-5 transition-transform group-hover:scale-110" />
          )}
          <span>{isPlaying ? 'Playing...' : audioObject ? 'Replay Audio' : 'Play Audio'}</span>
        </Button>
      </div>

      {/* Audio Error Display */}
      {audioError && (
        <div className="text-sm text-red-500 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {audioError}
        </div>
      )}

      {/* Transcription Input Area */}
      <div className="flex-grow">
        <Textarea
          placeholder="Write down what you hear..."
          value={userAnswer || ''}
          onChange={(e) => onAnswerChange(e.target.value)}
          disabled={disabled || isAnswered}
          className="h-full text-base resize-none min-h-[150px] bg-background/80 backdrop-blur-sm"
          rows={5}
        />
      </div>

      {/* Hint Button */}
      {questionData?.hint && (
        <div className="flex justify-center">
          <HintButton
            hint={questionData.hint}
            initialShowHint={questionData.showHint || false}
            disabled={disabled}
          />
        </div>
      )}

      {/* Feedback Area (shown after answer is marked) - Handled by SessionPage CardFooter */}
    </div>
  );
};

export default ListeningTranscribeComponent; 