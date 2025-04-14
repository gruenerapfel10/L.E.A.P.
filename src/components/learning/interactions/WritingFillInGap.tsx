import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';
import { WordPopover } from './WordPopover';
import HintButton from './HintButton';

interface InteractionProps {
  questionData: {
    question: string;
    sentence: string;
    baseWord: string;
    correctAnswer?: string;
    acceptableAnswers?: string[];
    hint?: string;
    showHint?: boolean;
    caseSensitive?: boolean;
    explanation?: string;
    category?: string;
  };
  userAnswer: string | null;
  isAnswered: boolean;
  markResult: any | null;
  onAnswerChange: (answer: string | null) => void;
  disabled: boolean;
}

const wrapWords = (text: string | null | undefined, textLang: string, displayLang: string): React.ReactNode => {
    if (!text) return null;
    return text.split(/(\s+)/).map((segment, index) => {
        if (/^\s+$/.test(segment)) {
            return <React.Fragment key={`space-${index}`}>{segment}</React.Fragment>;
        }
        if (segment.length > 0) {
            if (segment === '___') {
                return <React.Fragment key={`placeholder-${index}`}>{segment}</React.Fragment>; 
            }
            return (
            <WordPopover 
                key={`${segment}-${index}`} 
                word={segment} 
                language={textLang} 
                displayLanguage={displayLang}
            >
                {segment}
            </WordPopover>
            );
        }
        return null;
    });
};

export const WritingFillInGapComponent: React.FC<InteractionProps> = (
  { questionData, userAnswer, isAnswered, markResult, onAnswerChange, disabled }
) => {
  const [inputValue, setInputValue] = useState(userAnswer || '');

  // Update local state if userAnswer prop changes (e.g., on reset/next question)
  useEffect(() => {
    setInputValue(userAnswer || '');
  }, [userAnswer]);

  // --- Safety Check & Use Separate Fields --- 
  if (!questionData || typeof questionData.question !== 'string' || typeof questionData.sentence !== 'string') {
    console.error("[WritingFillInGap] Error: Invalid questionData or missing question/sentence strings.", questionData);
    return <div className="text-red-500 p-4">Error: Could not load question content properly.</div>;
  }
  const questionText = questionData.question;
  const sentencePart = questionData.sentence;
  // --- End Check ---

  // Find the position of the blank ____ to render the input
  const blankIndex = sentencePart.indexOf('____');
  const partBeforeBlank = blankIndex !== -1 ? sentencePart.substring(0, blankIndex) : sentencePart;
  const partAfterBlank = blankIndex !== -1 ? sentencePart.substring(blankIndex + 4) : '';

  // Determine input border color based on marking
  const inputBorderColor = isAnswered
    ? markResult?.isCorrect ? 'border-green-500 focus-visible:ring-green-500' : 'border-red-500 focus-visible:ring-red-500'
    : 'border-input';

  return (
    <div className="space-y-6">
      <p className="text-xl font-semibold mb-2 leading-relaxed">{questionText}</p>
      
      {/* Display the base word */}
      {questionData.baseWord && (
        <div className="text-lg font-medium text-primary mb-2">
          Base word: {questionData.baseWord}
        </div>
      )}
      
      <div className="text-muted-foreground pt-1 mb-4 leading-relaxed text-lg flex flex-wrap items-center gap-x-1">
        {partBeforeBlank && <span>{partBeforeBlank}</span>}
        {blankIndex !== -1 && (
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => {
              if (!disabled) {
                setInputValue(e.target.value);
                onAnswerChange(e.target.value || null); // Send null if empty
              }
            }}
            disabled={disabled}
            className={cn(
              "h-8 px-2 text-lg border-2 rounded-md inline-block w-auto min-w-[100px] focus-visible:ring-offset-0",
              inputBorderColor
            )}
            placeholder="..."
            aria-label="Fill in the blank"
            autoCapitalize="none" // Prevent mobile auto-capitalization if needed
            autoCorrect="off"
          />
        )}
        {partAfterBlank && <span>{partAfterBlank}</span>}
      </div>
      
      {/* Hint Button using the shared component */}
      {!isAnswered && (
        <HintButton
          hint={questionData.hint}
          initialShowHint={questionData.showHint}
          disabled={disabled}
        />
      )}
      
      {/* Display Correct Answer When Incorrect */}
      {isAnswered && !markResult?.isCorrect && questionData.correctAnswer && (
        <div className="text-sm text-green-700 dark:text-green-300 font-medium">
          Correct Answer: {questionData.correctAnswer}
        </div>
      )}
    </div>
  );
};

export default WritingFillInGapComponent; 