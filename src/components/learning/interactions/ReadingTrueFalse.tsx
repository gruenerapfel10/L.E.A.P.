import React from 'react';
import { Button } from "@/components/ui/button";
import { WordPopover } from './WordPopover';

interface InteractionProps {
  questionData: any;
  userAnswer: any;
  isAnswered: boolean;
  markResult: any | null;
  onAnswerChange: (answer: any) => void;
  disabled: boolean;
}

const wrapWords = (text: string | null | undefined, textLang: string, displayLang: string): React.ReactNode => {
    if (!text) return null;
    return text.split(/(\s+)/).map((segment, index) => {
        if (/^\s+$/.test(segment)) {
            return <React.Fragment key={`space-${index}`}>{segment}</React.Fragment>;
        }
        if (segment.length > 0) {
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

export const ReadingTrueFalseComponent: React.FC<InteractionProps> = (
    { questionData, userAnswer, isAnswered, markResult, onAnswerChange, disabled }
) => {
  const selectedValue = typeof userAnswer === 'boolean' ? userAnswer : null;
  const correctAnswer = questionData.isCorrectAnswerTrue;
  const textLanguage = 'de';
  const displayLanguage = 'en';

  const getVariant = (value: boolean) => {
    if (!isAnswered) {
      return selectedValue === value ? 'secondary' : 'outline';
    }
    // Answered state
    if (selectedValue === value) { // This was selected
      return markResult?.isCorrect ? 'default' : 'destructive'; // Correctly or incorrectly chosen
    } else if (correctAnswer === value) { // This was the correct answer, but not chosen
      return 'default'; 
    } else { // This was not chosen and not correct
       return 'outline';
    }
  };

  const getBgColor = (value: boolean) => {
     if (!isAnswered) return selectedValue === value ? 'bg-secondary/80 border-input' : '';
     if (selectedValue === value) { // This was selected
       return markResult?.isCorrect 
         ? 'bg-green-100 border-green-300 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700' 
         : 'bg-red-100 border-red-300 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-200 dark:border-red-700';
     } else if (correctAnswer === value) { // Correct answer, not chosen
       return 'bg-green-100 border-green-300 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700';
     }
     return '';
  };

  return (
    <div className="space-y-4 flex flex-col items-center">
      {questionData.statement ? (
        <p className="text-lg text-center mb-4 leading-relaxed">
            {wrapWords(questionData.statement, textLanguage, displayLanguage)}
        </p>
      ) : (
        <p className="text-red-500">Error: Statement missing.</p>
      )}
      <div className="flex gap-4 w-full max-w-xs">
        <Button
          variant={getVariant(true)}
          className={`flex-1 py-4 text-lg transition-colors duration-150 ${getBgColor(true)}`}
          onClick={() => !isAnswered && onAnswerChange(true)} // Pass boolean true
          disabled={disabled}
          aria-pressed={selectedValue === true}
        >
          True
        </Button>
        <Button
          variant={getVariant(false)}
          className={`flex-1 py-4 text-lg transition-colors duration-150 ${getBgColor(false)}`}
          onClick={() => !isAnswered && onAnswerChange(false)} // Pass boolean false
          disabled={disabled}
          aria-pressed={selectedValue === false}
        >
          False
        </Button>
      </div>
    </div>
  );
}; 