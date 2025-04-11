'use client';

import React, { useState, ReactNode } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from 'lucide-react';

interface WordPopoverProps {
  word: string;
  language: string; // Language of the word (e.g., 'de', 'en')
  displayLanguage: string; // Language to display definition/translation in
  children?: ReactNode; // Optional custom element to wrap, defaults to the word itself
}

interface VocabData {
  word: string;
  definition?: string | null;
  translations?: Record<string, string> | null;
  frequency?: number | null;
  language: string;
}

export const WordPopover: React.FC<WordPopoverProps> = ({
  word,
  language,
  displayLanguage,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [vocabData, setVocabData] = useState<VocabData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false); // State for AI generation
  const [error, setError] = useState<string | null>(null);

  const fetchVocabData = async (isGeneratingAttempt = false) => {
    // Only set loading/generating state if not already generating
    if (!isGenerating) {
        if (isGeneratingAttempt) {
            setIsGenerating(true);
        } else {
             setIsLoading(true);
        }
    }
    setError(null);
    // Keep existing vocab data while generating/loading new
    // setVocabData(null); 

    try {
      const cleanedWord = word.replace(/[.,!?;:]$/, '').toLowerCase();
      if (!cleanedWord) {
          throw new Error("Invalid word provided.");
      }

      const response = await fetch(`/api/vocabulary/lookup?word=${encodeURIComponent(cleanedWord)}&lang=${language}`);
      
      // Handle specific status codes
      if (response.status === 404) {
          // If it was the initial fetch (not generating), trigger generation
          if (!isGeneratingAttempt) {
              console.log(`[WordPopover] ${cleanedWord} not found, triggering generation...`);
              await fetchVocabData(true); // Re-call function to trigger generation
              return; // Exit this attempt, generation call will update state
          } else {
              // If it was the generation attempt that returned 404 (shouldn't happen with current API)
              setError('Failed to generate definition.');
          }
      } else if (response.status === 201) {
          console.log(`[WordPopover] ${cleanedWord} generated successfully.`);
          const data: VocabData = await response.json();
          setVocabData(data); 
          setIsGenerating(false); // Generation finished
      } else if (response.ok) { // Handle 200 OK for existing words
          const data: VocabData = await response.json();
          setVocabData(data);
      } else { // Handle other errors (e.g., 400, 500)
          let errorMsg = `Failed: ${response.statusText}`;
          try { 
             const errData = await response.json();
             errorMsg = errData.error || errorMsg;
          } catch {}
          throw new Error(errorMsg);
      }

    } catch (err) {
      console.error("Error in fetchVocabData:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      // Only set loading/generating false if it was true
      if (!isGeneratingAttempt) setIsLoading(false);
      // isGenerating is set false on 201 success or if error occurs during generation
      if (isGeneratingAttempt && !vocabData) setIsGenerating(false); 
    }
  };

  const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
      // Fetch only if opening and no data/error yet, and not already loading/generating
      if (open && !vocabData && !error && !isLoading && !isGenerating) {
          fetchVocabData();
      }
  };

  const getDisplayText = (): ReactNode => {
      if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />; 
      // Show specific message during AI generation
      if (isGenerating) return <div className="flex items-center text-muted-foreground"><Loader2 className="h-4 w-4 mr-1 animate-spin"/> Generating...</div>;
      if (error) return <div className="flex items-center text-red-600"><AlertTriangle className="h-4 w-4 mr-1"/> {error}</div>;
      // If popover opened before fetch finished but wasn't loading/generating/error state
      if (!vocabData) return 'Click again to load.'; 

      // Prioritize translation in display language, then definition, then word itself
      const translation = vocabData.translations?.[displayLanguage];
      const definition = vocabData.definition;

      return (
          <div>
              <p className="font-semibold text-lg mb-1">{vocabData.word} ({vocabData.language})</p>
              {translation && <p className="mb-1"><strong className="capitalize">{displayLanguage}:</strong> {translation}</p>}
              {definition && !translation && <p className="mb-1"><strong>Definition:</strong> {definition}</p>} {/* Show definition if no translation */} 
              {!translation && !definition && <p className="text-muted-foreground italic">No definition or translation available.</p>}
              {/* <p className="text-xs text-muted-foreground mt-2">Frequency: {vocabData.frequency ?? 'N/A'}</p> */}
          </div>
      );
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {children ? (
           React.isValidElement(children) ? (
              React.cloneElement(children as React.ReactElement<any>, { 
                 onContextMenu: (e: React.MouseEvent) => { 
                   e.preventDefault(); // Prevent default context menu
                   handleOpenChange(!isOpen); 
                 },
                 onClick: (e: React.MouseEvent) => {
                   e.preventDefault(); // Prevent any left-click behavior
                 },
                 className: `${(children as React.ReactElement<any>).props.className || ''} cursor-pointer hover:bg-primary/10 rounded` 
              })
           ) : (
              <span 
                onContextMenu={(e) => { e.preventDefault(); handleOpenChange(!isOpen); }} 
                onClick={(e) => e.preventDefault()}
                className="cursor-pointer hover:bg-primary/10 rounded"
              >
                {children}
              </span>
           )
        ) : (
          <span 
            onContextMenu={(e) => { e.preventDefault(); handleOpenChange(!isOpen); }} 
            onClick={(e) => e.preventDefault()}
            className="cursor-pointer hover:bg-primary/10 rounded"
          >
            {word}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-xs sm:max-w-sm p-4">
        {getDisplayText()}
      </PopoverContent>
    </Popover>
  );
}; 