import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';
import HintButton from './HintButton';

interface WordData {
  text: string;
  isError: boolean;
  index: number;
}

// Type for the userAnswer state (index + correction text)
type ReplaceAnswer = {
  index: number;
  correction: string;
};

interface InteractionProps {
  questionData: {
    question: string;
    sentence: string;
    words: WordData[];
    hasError: boolean;
    correctVersion?: string;
    errorType?: string;
    explanation?: string;
    hint?: string;
    showHint?: boolean;
    acceptableAnswers?: string[];
    targetReplace?: string;
    targetReplaceWith?: string;
  };
  userAnswer: ReplaceAnswer | null;
  isAnswered: boolean;
  markResult: any | null;
  onAnswerChange: (answer: ReplaceAnswer | null) => void;
  disabled: boolean;
}

export const WritingReplaceErrorComponent: React.FC<InteractionProps> = (
  { questionData, userAnswer, isAnswered, markResult, onAnswerChange, disabled }
) => {
  // Local state for the UI
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    userAnswer ? userAnswer.index : null
  );
  const [correctionText, setCorrectionText] = useState<string>(
    userAnswer ? userAnswer.correction : ''
  );

  // Update local state if userAnswer prop changes
  useEffect(() => {
    if (userAnswer) {
      setSelectedIndex(userAnswer.index);
      setCorrectionText(userAnswer.correction);
    } else {
      setSelectedIndex(null);
      setCorrectionText('');
    }
  }, [userAnswer]);

  // --- Safety Check & Use Separate Fields --- 
  if (!questionData || typeof questionData.question !== 'string' || typeof questionData.sentence !== 'string' || !Array.isArray(questionData.words)) {
    console.error("[WritingReplaceError] Error: Invalid questionData or missing question/sentence/words.", questionData);
    return <div className="text-red-500 p-4">Error: Could not load question content properly.</div>;
  }
  const questionText = questionData.question;
  const sentenceText = questionData.sentence;
  const words = questionData.words;
  // --- End Check ---

  const handleWordClick = (index: number, isActuallyError: boolean) => {
    if (disabled || !isActuallyError) return; // Only allow clicking the actual error word
    setSelectedIndex(index);
    // When a new word is clicked, update the overall answer state if there's correction text
    if (correctionText.trim()) {
      onAnswerChange({ index, correction: correctionText });
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const newCorrection = event.target.value;
    setCorrectionText(newCorrection);
    
    // If there's text in the input, update the answer state
    // Use the selected word if one is selected, otherwise use the error word
    if (newCorrection.trim()) {
      const errorWordIndex = words.findIndex(w => w.isError);
      const indexToUse = selectedIndex !== null ? selectedIndex : errorWordIndex;
      if (indexToUse !== -1) {
        onAnswerChange({ index: indexToUse, correction: newCorrection });
      }
    } else {
      // If input is empty, clear the answer
      onAnswerChange(null);
    }
  };

  // Determine input border color based on marking
  const inputBorderColor = isAnswered
    ? markResult?.isCorrect ? 'border-green-500 focus-visible:ring-green-500' : 'border-red-500 focus-visible:ring-red-500'
    : 'border-input';

  // Find the error word index
  const errorWordIndex = words.findIndex(w => w.isError);
  const errorWord = errorWordIndex !== -1 ? words[errorWordIndex] : null;

  return (
    <div className="space-y-6">
      <p className="text-xl font-semibold mb-2 leading-relaxed">{questionText}</p>
      
      {/* Sentence with clickable words */}
      <div className="text-lg pt-1 mb-4 leading-relaxed flex flex-wrap gap-x-1.5 gap-y-1 items-center">
        {words.map((word) => {
          const isSelected = selectedIndex === word.index;
          const isActuallyError = word.isError;
          let wordClasses = 'px-1.5 py-0.5 rounded-md transition-all duration-150';

          if (!isAnswered && isActuallyError) {
            wordClasses += ' cursor-pointer text-red-600 dark:text-red-400 font-medium underline decoration-wavy hover:bg-red-100/50'; // Highlight potential error before answer
          } else {
            wordClasses += ' text-muted-foreground'; // Default non-clickable style
          }

          if (isSelected && !isAnswered) {
            wordClasses += ' bg-primary/20 text-primary-foreground ring-2 ring-primary'; // Selected state before answer
          }
          
          // Override if answered
          if (isAnswered && isActuallyError) {
              wordClasses = 'px-1.5 py-0.5 rounded-md text-red-600 dark:text-red-400 font-medium underline decoration-wavy'; // Show actual error after answer
          }

          return (
            <span
              key={word.index}
              className={cn(wordClasses)}
              onClick={() => handleWordClick(word.index, isActuallyError)}
              role={isActuallyError ? "button" : undefined} // Only make it a button if it's the error word
              aria-pressed={isSelected}
            >
              {word.text}
            </span>
          );
        })}
        {words.length === 0 && <span className="text-red-500">Error: Sentence words missing.</span>}
      </div>

      {/* Add Hint button - show only when not answered */}
      {!isAnswered && (
        <HintButton
          hint={questionData.hint}
          initialShowHint={questionData.showHint}
          disabled={disabled}
        />
      )}

      {/* Input field for correction - Always show */}
      <div className="mt-4 space-y-2">
        <label htmlFor="correctionInput" className="text-sm font-medium text-muted-foreground">
          {selectedIndex !== null 
            ? `Correction for "${words.find(w => w.index === selectedIndex)?.text || ''}":`
            : errorWord 
              ? `Correction for "${errorWord.text}":`
              : "Type the correct form of the word with the error:"}
        </label>
        <Input
          id="correctionInput"
          type="text"
          value={correctionText}
          onChange={handleInputChange}
          disabled={disabled}
          className={cn(
            "h-10 px-3 border-2 rounded-md focus-visible:ring-offset-0",
            inputBorderColor
          )}
          placeholder="Type the correct form..."
          aria-label="Type correction here"
          autoCapitalize="none"
          autoCorrect="off"
        />
      </div>
      
      {/* Display Feedback When Answered */}
      {isAnswered && (
        <div className="mt-4 text-sm border rounded-md p-3 bg-muted/30">
          {!markResult?.isCorrect && questionData.correctVersion && (
            <div className="text-green-700 dark:text-green-300 font-medium">
              Correct Answer: {questionData.correctVersion} ({questionData.errorType || 'error'})
            </div>
          )}
          {markResult?.feedback && (
            <div className="mt-2">
              {markResult.feedback}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WritingReplaceErrorComponent; 