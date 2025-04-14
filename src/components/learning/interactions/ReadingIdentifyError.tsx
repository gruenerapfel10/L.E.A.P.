import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import HintButton from './HintButton';

interface WordData {
  text: string;
  isError: boolean;
  index: number;
}

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
    targetReplace?: string;
    targetReplaceWith?: string;
  };
  userAnswer: number | string | null; // Index of the word selected by the user or 'no-error' string
  isAnswered: boolean;
  markResult: any | null;
  onAnswerChange: (answer: number | string | null) => void;
  disabled: boolean;
}

export const ReadingIdentifyErrorComponent: React.FC<InteractionProps> = (
  { questionData, userAnswer, isAnswered, markResult, onAnswerChange, disabled }
) => {

  // --- Safety Check & Use Separate Fields --- 
  if (!questionData || typeof questionData.question !== 'string' || typeof questionData.sentence !== 'string' || !Array.isArray(questionData.words)) {
    console.error("[ReadingIdentifyError] Error: Invalid questionData or missing question/sentence/words.", questionData);
    return <div className="text-red-500 p-4">Error: Could not load question content properly.</div>;
  }
  const questionText = questionData.question; // Use direct field
  const sentenceText = questionData.sentence; // Use direct field
  const hasError = questionData.hasError; // Get the hasError flag
  // --- End Check ---

  const words = questionData.words || [];
  const selectedIndex = typeof userAnswer === 'number' ? userAnswer : null;
  const selectedNoError = userAnswer === 'no-error';

  // Function to determine if a word selection is correct
  const isWordSelectionCorrect = (wordIndex: number) => {
    if (!hasError) return false; // If no error, selecting any word is wrong
    return words[wordIndex]?.isError === true;
  };

  return (
    <div className="space-y-6">
      <p className="text-xl font-semibold mb-2 leading-relaxed">{questionText}</p>
      
      <div className="text-lg pt-1 mb-4 leading-relaxed flex flex-wrap gap-x-1.5 gap-y-1 items-center">
        {words.map((word) => {
          const isSelected = selectedIndex === word.index;
          let wordClasses = 'cursor-pointer px-1.5 py-0.5 rounded-md transition-all duration-150';

          if (isAnswered) {
            const isActuallyError = hasError && word.isError;
            const isCorrectUserChoice = isSelected && isActuallyError;
            const isIncorrectUserChoice = isSelected && !isActuallyError;
            const isMissedError = !isSelected && isActuallyError;
            
            if (isCorrectUserChoice) {
              wordClasses += ' bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100 ring-2 ring-green-500';
            } else if (isIncorrectUserChoice) {
              wordClasses += ' bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100 ring-2 ring-red-500';
            } else if (isMissedError) {
              wordClasses += ' bg-yellow-100 dark:bg-yellow-800/50 text-yellow-900 dark:text-yellow-100 ring-1 ring-yellow-500'; // Highlight missed error
            } else {
              wordClasses += ' text-muted-foreground'; // Normal word
            }
          } else {
            // Not answered yet
            if (isSelected) {
              wordClasses += ' bg-primary/20 text-primary-foreground ring-2 ring-primary';
            } else {
              wordClasses += ' text-foreground hover:bg-muted/50'; // Hover effect for clickable words
            }
          }

          return (
            <span
              key={word.index}
              className={cn(wordClasses)}
              onClick={() => !disabled && onAnswerChange(word.index)}
              role="button"
              aria-pressed={isSelected}
            >
              {word.text}
            </span>
          );
        })}
        {words.length === 0 && <span className="text-red-500">Error: Sentence words missing.</span>}
      </div>
      
      {/* Add Hint Button */}
      {!isAnswered && (
        <HintButton
          hint={questionData.hint}
          initialShowHint={questionData.showHint}
          disabled={disabled}
        />
      )}
      
      {/* "No Error" Button */}
      <div className="mt-4">
        <Button
          variant={selectedNoError 
            ? (isAnswered 
                ? (!hasError ? "default" : "destructive") 
                : "default") 
            : "outline"}
          className={cn(
            "w-full",
            selectedNoError && !isAnswered && "bg-primary/20 text-primary-foreground ring-2 ring-primary",
            // Add a custom success style if the selection is correct
            selectedNoError && isAnswered && !hasError && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100 border-green-500"
          )}
          onClick={() => !disabled && onAnswerChange('no-error')}
          disabled={disabled}
        >
          No error in this sentence
        </Button>
      </div>
      
      {/* Display Correct Version When Answered */}
      {isAnswered && (
        <div className="mt-4 text-sm border rounded-md p-3 bg-muted/30">
          {hasError && !markResult?.isCorrect && questionData.correctVersion && (
            <div className="text-green-700 dark:text-green-300 font-medium">
              Correct Version: {questionData.correctVersion} ({questionData.errorType || 'error'})
            </div>
          )}
          {!hasError && !markResult?.isCorrect && (
            <div className="text-green-700 dark:text-green-300 font-medium">
              The sentence is grammatically correct.
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

export default ReadingIdentifyErrorComponent; 