import React from 'react';
import { Button } from '@/components/ui/button';
import { WordPopover } from './WordPopover';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface InteractionProps {
  questionData: any;
  userAnswer: any;
  isAnswered: boolean;
  markResult: any | null;
  onAnswerChange: (answer: any) => void;
  disabled: boolean;
}

// Helper to wrap words, BUT skip the target word for blank insertion
const wrapWordsWithBlank = (
  text: string | null | undefined, 
  targetWordBase: string | null | undefined,
  textLang: string, 
  displayLang: string
): React.ReactNode[] => {
  if (!text || !targetWordBase) return text ? [text] : [];

  const nodes: React.ReactNode[] = [];
  let currentWordIndex = 0;

  text.split(/(\s+)/).forEach((segment) => {
    if (/^\s+$/.test(segment)) {
      nodes.push(<React.Fragment key={`space-${currentWordIndex}`}>{segment}</React.Fragment>);
    } else if (segment.length > 0) {
      // Check if this segment STARTS with the targetWordBase
      // Simple check; might need refinement for complex cases (punctuation, case variations)
      if (segment.toLowerCase().startsWith(targetWordBase.toLowerCase())) {
        // It's the target word - add base + blank
        nodes.push(
          <React.Fragment key={`target-${currentWordIndex}`}>
            {targetWordBase}<span className="font-bold text-primary">____</span>
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

export const ReadingMultipleChoiceComponent: React.FC<InteractionProps> = (
  { questionData, userAnswer, isAnswered, markResult, onAnswerChange, disabled }
) => {
  const selectedIndex = typeof userAnswer === 'number' ? userAnswer : -1;
  const textLanguage = 'de'; // Assuming question text/options are in German
  const displayLanguage = 'en'; // Assuming user wants English definitions

  const question = questionData.question;
  const sentence = questionData.sentence; // COMPLETE sentence from AI
  const targetWordBase = questionData.targetWordBase; // Base word, e.g., "schön"
  const options = questionData.options; // Endings, e.g., ["e", "en", "es", "er"]

  const wrappedQuestion = wrapWords(question, textLanguage, displayLanguage);
  // NEW: Generate sentence with blank programmatically
  const sentenceWithBlankNodes = wrapWordsWithBlank(sentence, targetWordBase, textLanguage, displayLanguage);

  return (
    <>
      {/* Render question in the header/title area */} 
      {wrappedQuestion && 
          <p className="text-xl font-semibold mb-2 leading-relaxed">{wrappedQuestion}</p>
      }
      
      {/* Render sentence with the blank */}
      {sentenceWithBlankNodes.length > 0 && 
          <p className="text-muted-foreground pt-1 mb-4 leading-relaxed text-lg">
            {sentenceWithBlankNodes.map((node, i) => <React.Fragment key={i}>{node}</React.Fragment>)}
          </p>
      }

      {/* Render options (endings) */}
      <RadioGroup 
        onValueChange={(value: string) => {
          console.log('[ReadingMultipleChoice] onValueChange triggered. New value:', value);
          if (!isAnswered) {
             console.log('[ReadingMultipleChoice] Calling onAnswerChange with parsed value:', parseInt(value, 10));
             onAnswerChange(parseInt(value, 10));
          } else {
             console.log('[ReadingMultipleChoice] Not calling onAnswerChange because isAnswered is true.');
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
              <span className="font-normal">{/* We only show the ending now */}
                {option}
              </span>
            </Label>
          );
        })}
        {!options && <p className="text-red-500">Error: No options found.</p>}
      </RadioGroup>
    </>
  );
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