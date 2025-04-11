'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WordPopover } from './WordPopover';
import { cn } from "@/lib/utils";

// Assuming SentenceStructure types are available (adjust import path if needed)
// import { SentenceStructure } from '@/lib/learning/grammar/sentence-structure.schema';

interface CorrectIncorrectQuestionData {
  presentedSentence: string;
  correctSentence: string; 
  taskType: 'identify' | 'replace' | 'confirm'; // Confirm for cases where no error could be added
  incorrectSegments?: string[]; // Array of incorrect word strings (for replace/identify)
  // The full structures are available but not directly used by this basic UI yet
  sentenceStructure?: any; // Modified structure
  originalStructure?: any; // Original correct structure
  errorsIntroduced?: any[]; // Details of errors made by the service
  isCorrect?: boolean; // Added for the 'confirm' taskType where no errors were made
}

interface InteractionProps {
  questionData: CorrectIncorrectQuestionData;
  userAnswer: any | null; // string (identify/replace) or boolean (confirm)
  isAnswered: boolean;
  markResult: any | null;
  onAnswerChange: (answer: any) => void;
  disabled: boolean;
}

// Shared helper (minor update to handle array of highlighted words)
const wrapWords = (text: string | null | undefined, textLang: string, displayLang: string, onClickWord?: (word: string) => void, highlightedWords?: string[] | null): React.ReactNode => {
    if (!text) return null;
    const highlightSet = new Set(highlightedWords?.map(w => w.toLowerCase()) || []);

    return text.split(/(\s+)/).map((segment, index) => {
      if (/^\s+$/.test(segment)) {
        return <React.Fragment key={`space-${index}`}>{segment}</React.Fragment>;
      }
      if (segment.length > 0) {
        const cleanedWord = segment.replace(/[.,!?;:]$/, '');
        const isClickable = !!onClickWord;
        const isHighlighted = highlightSet.has(cleanedWord.toLowerCase());
        
        const wordElement = (
            <span 
                className={cn(
                    isClickable && "cursor-pointer hover:bg-primary/10 rounded",
                    isHighlighted && "bg-yellow-200 dark:bg-yellow-800 rounded px-1" // Highlight color changed
                )}
                onClick={() => isClickable && onClickWord(cleanedWord)} 
            >
                {segment}
            </span>
        );

        return (
          <WordPopover 
            key={`${segment}-${index}`} 
            word={segment} 
            language={textLang} 
            displayLanguage={displayLang}
          >
            {wordElement}
          </WordPopover>
        );
      }
      return null;
    });
};

export const WritingCorrectIncorrectSentence: React.FC<InteractionProps> = (
  { questionData, userAnswer, isAnswered, markResult, onAnswerChange, disabled }
) => {
  // Destructure new expected fields
  const { 
      presentedSentence, 
      taskType, 
      incorrectSegments = [], // Default to empty array
      isCorrect // For confirm task
    } = questionData;
  const textLanguage = 'de'; // Assume German for now
  const displayLanguage = 'en';

  const [typedValue, setTypedValue] = useState('');

  useEffect(() => {
      setTypedValue(''); 
      // Reset answer when question changes, EXCEPT for confirm task which requires explicit button press
      if(taskType !== 'confirm') {
         onAnswerChange(null); 
      }
  }, [questionData, taskType]); // Rerun if questionData or taskType changes

  const handleWordClick = (word: string) => {
      if (!isAnswered && taskType === 'identify') {
          onAnswerChange(word);
      }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // Allow typing only for replace task (Rewrite fallback removed for now)
      if (!isAnswered && taskType === 'replace') {
          setTypedValue(e.target.value);
          onAnswerChange(e.target.value); 
      }
      // If we needed rewrite:
      // if (!isAnswered && (taskType === 'replace' || taskType === 'rewrite')) { ... }
  };

  const renderTaskUI = () => {
    switch (taskType) {
      case 'identify':
        return (
          <p className="text-lg text-center mb-4 p-4 border rounded-md bg-background leading-relaxed">
             {/* Pass the clicked word (userAnswer) for highlighting */}
            {wrapWords(presentedSentence, textLanguage, displayLanguage, handleWordClick, userAnswer ? [userAnswer] : [])} 
            <span className="block mt-3 text-sm text-muted-foreground italic">Click the incorrect word or phrase.</span>
          </p>
        );

      case 'replace':
        // Highlight the first incorrect segment found (simplification)
        const segmentToHighlight = incorrectSegments[0]; 
        const placeholderText = segmentToHighlight ? `Replace "${segmentToHighlight}"...` : "Type the correction...";

          return (
            <div className='text-center'>
              <p className="text-lg mb-4 p-4 border rounded-md bg-background leading-relaxed">
              {wrapWords(presentedSentence, textLanguage, displayLanguage, undefined, segmentToHighlight ? [segmentToHighlight] : [])}
              </p>
              <Input 
                type="text"
                value={typedValue}
                onChange={handleInputChange}
                disabled={disabled}
              placeholder={placeholderText}
                className="max-w-xs mx-auto"
              aria-label={`Replace ${segmentToHighlight || 'error'}`}
              />
              <p className="mt-2 text-sm text-muted-foreground italic">Type the correct word/phrase to replace the highlighted part.</p>
            </div>
          );

      case 'confirm': // Handle case where no error was introduced
        return (
          <div className='text-center'>
             <p className="text-lg mb-4 p-4 border rounded-md bg-background leading-relaxed">
               {wrapWords(presentedSentence, textLanguage, displayLanguage)} 
             </p>
             <p className="mb-4 text-sm text-muted-foreground italic">Is this sentence grammatically correct?</p>
             <div className="flex justify-center gap-4">
                 <Button 
                    variant={userAnswer === true ? 'secondary' : 'outline'}
                    onClick={() => !isAnswered && onAnswerChange(true)}
                    disabled={disabled}
                    // Highlight based on actual correctness if answered
                    className={cn(isAnswered && isCorrect === true && 'border-2 border-green-500')}
                 >
                    Yes
                 </Button>
                 <Button 
                    variant={userAnswer === false ? 'secondary' : 'outline'}
                    onClick={() => !isAnswered && onAnswerChange(false)}
                    disabled={disabled}
                    // Highlight based on actual correctness if answered
                     className={cn(isAnswered && isCorrect === false && 'border-2 border-red-500')}
                 >
                    No
                 </Button>
             </div>
          </div>
        );
      default:
        console.error(`[UI Error] Unsupported taskType received: '${taskType}'.`);
        return <div className="text-red-500 text-center">Error: Cannot display this question type ({taskType}).</div>;
    }
  };

  return (
    <div className="space-y-4">
      {renderTaskUI()}
    </div>
  );
}; 