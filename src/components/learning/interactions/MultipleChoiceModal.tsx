import React from 'react';
import { Button } from '@/components/ui/button';
import { WordPopover } from './WordPopover';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import HintButton from './HintButton';

interface InteractionProps {
  questionData: {
    content: string;
    options: string[];
    correctOptionIndex: number;
    targetReplace?: string;
    targetReplaceWith?: string;
    targetWordBase?: string;
    explanation?: string;
    hint?: string;
    showHint?: boolean;
  };
  userAnswer: any;
  isAnswered: boolean;
  markResult: any | null;
  onAnswerChange: (answer: any) => void;
  disabled: boolean;
}

// Helper to wrap words, BUT skip the target word for blank insertion
const wrapWordsWithBlank = (
  text: string | null | undefined, 
  targetReplace: string | null | undefined,
  targetReplaceWith: string | null | undefined,
  textLang: string, 
  displayLang: string
): React.ReactNode[] => {
  if (!text || !targetReplace || !targetReplaceWith) return text ? [text] : [];

  const nodes: React.ReactNode[] = [];
  let currentWordIndex = 0;

  text.split(/(\s+)/).forEach((segment) => {
    if (/^\s+$/.test(segment)) {
      nodes.push(<React.Fragment key={`space-${currentWordIndex}`}>{segment}</React.Fragment>);
    } else if (segment.length > 0) {
      // Check if this segment matches the targetReplace exactly
      if (segment === targetReplace) {
        // It's the target word - add the replacement with blank
        nodes.push(
          <React.Fragment key={`target-${currentWordIndex}`}>
            {targetReplaceWith}<span className="font-bold text-primary">____</span>
          </React.Fragment>
        );
      } else {
        // Not the target word - wrap normally
        nodes.push(
          <WordPopover 
            key={`word-${currentWordIndex}`}
            word={segment} 
            language={textLang} 
            displayLanguage={displayLang}
          >
            {segment}
          </WordPopover>
        );
      }
      currentWordIndex++;
    }
  });
  return nodes;
};

// Keep original wrapWords for the question part
const wrapWords = (text: string | null | undefined, textLang: string, displayLang: string): React.ReactNode => {
  if (!text) return null;
  // Simple split by space, preserves punctuation attached to words
  // More robust parsing (e.g., handling hyphens, different punctuation) might be needed
  return text.split(/(\s+)/).map((segment, index) => {
      // If it's whitespace, return it directly
      if (/^\s+$/.test(segment)) {
          return <React.Fragment key={`space-${index}`}>{segment}</React.Fragment>;
      }
      // If it's a word, wrap it
      if (segment.length > 0) {
         return (
           <WordPopover 
             key={`${segment}-${index}`} 
             word={segment} 
             language={textLang} 
             displayLanguage={displayLang}
           >
             {/* Pass the word itself as children to be rendered inside PopoverTrigger */}
             {segment}
           </WordPopover>
         );
      }
      return null;
  });
};

export const MultipleChoiceModal: React.FC<InteractionProps> = (
  { questionData, userAnswer, isAnswered, markResult, onAnswerChange, disabled }
) => {
  const selectedIndex = typeof userAnswer === 'number' ? userAnswer : -1;
  const textLanguage = 'de'; // Assuming German
  const displayLanguage = 'en'; // Assuming English definitions

  // --- Safety Check --- 
  if (!questionData || typeof questionData.content !== 'string') {
    console.error("[MultipleChoiceModal] Error: Invalid questionData or missing content string.", questionData);
    return <div className="text-red-500 p-4">Error: Could not load question content properly.</div>;
  }
  // --- End Safety Check ---

  // Split content into question and sentence parts
  const contentParts = questionData.content.split('\n\n');
  const questionText = contentParts[0] || '[Question Missing]';
  const sentenceText = contentParts.length > 1 ? contentParts[1] : '[Sentence Missing]';

  const targetReplace = questionData.targetReplace;
  const targetReplaceWith = questionData.targetReplaceWith;
  const options = questionData.options; // Endings or full words
  const targetWordBase = questionData.targetWordBase; // For popover on non-target words

  // Use the split parts for wrapping
  const wrappedQuestion = wrapWords(questionText, textLanguage, displayLanguage);
  const sentenceWithBlankNodes = wrapWordsWithBlank(sentenceText, targetReplace, targetReplaceWith, textLanguage, displayLanguage);

  return (
    <div className="space-y-4">
      {/* Render question part */}
      {wrappedQuestion && 
          <p className="text-xl font-semibold mb-2 leading-relaxed">{wrappedQuestion}</p>
      }
      
      {/* Render sentence part with the blank */}
      {sentenceWithBlankNodes.length > 0 && 
          <p className="text-muted-foreground pt-1 mb-4 leading-relaxed text-lg">
            {sentenceWithBlankNodes.map((node, i) => <React.Fragment key={i}>{node}</React.Fragment>)}
          </p>
      }

      {/* Add Hint button */}
      {!isAnswered && (
        <HintButton
          hint={questionData.hint}
          initialShowHint={questionData.showHint}
          disabled={disabled}
        />
      )}

      {/* Render options (unchanged logic, handles both endings and full words) */}
      <RadioGroup 
        onValueChange={(value: string) => {
          console.log('[MultipleChoiceModal] onValueChange triggered. New value:', value);
          if (!isAnswered) {
             console.log('[MultipleChoiceModal] Calling onAnswerChange with parsed value:', parseInt(value, 10));
             onAnswerChange(parseInt(value, 10));
          } else {
             console.log('[MultipleChoiceModal] Not calling onAnswerChange because isAnswered is true.');
          }
        }} 
        value={selectedIndex.toString()} 
        className="space-y-3 pt-4"
      >
        {options?.map((option: string, index: number) => {
          // Determine background color based on answer state
          let bgColorClass = 'bg-background'; // Default
          if (isAnswered) {
            if (markResult?.correctAnswer?.toLowerCase() === option.toLowerCase() && markResult?.isCorrect && selectedIndex === index) {
              bgColorClass = 'bg-green-100 dark:bg-green-900/50'; // Correctly chosen
            } else if (markResult?.correctAnswer?.toLowerCase() === option.toLowerCase() && !markResult?.isCorrect) {
               bgColorClass = 'bg-green-100 dark:bg-green-900/50'; // Actual correct answer (user was wrong)
            } else if (selectedIndex === index && !markResult?.isCorrect) {
              bgColorClass = 'bg-red-100 dark:bg-red-900/50'; // Incorrectly chosen
            }
          } else if (selectedIndex === index) {
             bgColorClass = 'bg-secondary/80'; // Selected but not answered
          }
          
          return (
            <Label 
              key={index} 
              htmlFor={`option-${index}`}
              className={`flex items-center space-x-3 rounded-md border border-input p-4 cursor-pointer transition-colors duration-150 ${bgColorClass} hover:bg-secondary/50`}
            >
              <RadioGroupItem value={index.toString()} id={`option-${index}`} disabled={disabled} />
              <span className="font-normal">
                {option}
              </span>
            </Label>
          );
        })}
        {!options && <p className="text-red-500">Error: No options found.</p>}
      </RadioGroup>
    </div>
  );
};

export default MultipleChoiceModal; 