import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { MultipleChoiceSchema } from '@/lib/learning/modals/definitions/multiple-choice.modal';
import HintButton from './HintButton';

interface InteractionProps {
  data: MultipleChoiceSchema;
  onAnswer: (answer: number) => void;
  isMarked: boolean;
  isCorrect?: boolean;
  feedback?: string;
}

export default function MultipleChoice({ data, onAnswer, isMarked, isCorrect, feedback }: InteractionProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleOptionClick = (index: number) => {
    setSelectedOption(index);
    onAnswer(index);
  };

  const getButtonVariant = (index: number) => {
    if (isMarked) {
      return index === selectedOption ? 'default' : 'outline';
    }
    return 'outline';
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-medium">
        {data.content.split('\n\n')[0]}
      </div>
      
      <div className="text-lg">
        {data.content.split('\n\n')[1]}
      </div>

      <HintButton
        hint={data.hint}
        initialShowHint={data.showHint}
        disabled={isMarked}
      />

      <div className="grid gap-2">
        {data.options.map((option: string, index: number) => (
          <Button
            key={index}
            variant={getButtonVariant(index)}
            className="justify-start"
            onClick={() => handleOptionClick(index)}
            disabled={isMarked}
          >
            {option}
          </Button>
        ))}
      </div>

      {isMarked && feedback && (
        <div className="text-sm text-muted-foreground">
          {feedback}
        </div>
      )}
    </div>
  );
} 