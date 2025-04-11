import React from 'react';
import { Input } from "@/components/ui/input";
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
  { questionData, userAnswer, isAnswered, onAnswerChange, disabled }
) => {
  const inputValue = typeof userAnswer === 'string' ? userAnswer : '';
  const textLanguage = 'de'; 
  const displayLanguage = 'en'; 

  return (
    <div className="space-y-4">
       {questionData.sentenceTemplate ? (
         <p className="text-lg text-center mb-4 leading-relaxed">
           {wrapWords(questionData.sentenceTemplate.split('___')[0], textLanguage, displayLanguage)}
           <Input 
             type="text"
             value={inputValue}
             onChange={(e) => !isAnswered && onAnswerChange(e.target.value)}
             disabled={disabled}
             className={`inline-block w-auto mx-2 px-2 py-1 h-auto border-b-2 ${isAnswered ? 'border-muted-foreground' : 'border-primary'} focus:outline-none focus:ring-0 focus:border-primary text-center text-lg bg-transparent align-baseline`}
             aria-label="Fill in the blank"
             autoFocus
           />
           {wrapWords(questionData.sentenceTemplate.split('___')[1], textLanguage, displayLanguage)}
         </p>
       ) : (
         <p className="text-red-500">Error: Sentence template missing.</p>
       )}
    </div>
  );
}; 