import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import HintButton from './HintButton';

interface InteractionProps {
  questionData: {
    question: string;
    statement: string;
    isTrue?: boolean;
    explanation?: string;
    hint?: string;
    showHint?: boolean;
    topic?: string;
  };
  userAnswer: boolean | null; // User selects true or false
  isAnswered: boolean;
  markResult: any | null;
  onAnswerChange: (answer: boolean | null) => void;
  disabled: boolean;
}

export const ReadingTrueFalseComponent: React.FC<InteractionProps> = (
  { questionData, userAnswer, isAnswered, markResult, onAnswerChange, disabled }
) => {

  // --- Safety Check & Use Separate Fields --- 
  if (!questionData || typeof questionData.question !== 'string' || typeof questionData.statement !== 'string') {
    console.error("[ReadingTrueFalse] Error: Invalid questionData or missing question/statement strings.", questionData);
    return <div className="text-red-500 p-4">Error: Could not load question content properly.</div>;
  }
  const questionText = questionData.question;
  const statementText = questionData.statement;
  // --- End Check ---

  return (
    <div className="space-y-6">
      <p className="text-xl font-semibold mb-2 leading-relaxed">{questionText}</p>
      <p className="text-muted-foreground pt-1 mb-4 leading-relaxed text-lg border p-4 rounded-md bg-secondary/30">
        {statementText}
      </p>
      
      {/* Add Hint button */}
      {!isAnswered && (
        <HintButton
          hint={questionData.hint}
          initialShowHint={questionData.showHint}
          disabled={disabled}
        />
      )}
      
      <div className="flex justify-center space-x-4 pt-4">
        <Button
          variant={userAnswer === true ? 'default' : 'outline'}
          size="lg"
          onClick={() => !disabled && onAnswerChange(true)}
          disabled={disabled}
          className={cn(
            "w-32 transition-all",
            isAnswered && questionData?.isTrue === true && "bg-green-600 hover:bg-green-700 text-white border-green-600",
            isAnswered && userAnswer === true && questionData?.isTrue === false && "bg-red-600 hover:bg-red-700 text-white border-red-600"
          )}
        >
          True
        </Button>
        <Button
          variant={userAnswer === false ? 'default' : 'outline'}
          size="lg"
          onClick={() => !disabled && onAnswerChange(false)}
          disabled={disabled}
          className={cn(
            "w-32 transition-all",
            isAnswered && questionData?.isTrue === false && "bg-green-600 hover:bg-green-700 text-white border-green-600",
            isAnswered && userAnswer === false && questionData?.isTrue === true && "bg-red-600 hover:bg-red-700 text-white border-red-600"
          )}
        >
          False
        </Button>
      </div>
    </div>
  );
};

export default ReadingTrueFalseComponent; 