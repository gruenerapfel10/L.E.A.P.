"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, Target, BookOpen, MessageSquare, Check, AlertCircle } from 'lucide-react';
import type { WritingPrompt, WritingSubmission, WritingExercise as WritingExerciseType } from '../lib/writingSchemas';
import { calculateWordCount } from '../lib/writingService';

interface WritingExerciseProps {
  prompt: WritingPrompt;
  onSubmit: (submission: WritingSubmission) => void;
  onSave?: (content: string) => void;
  onContextMenu?: (selectedText: string, x: number, y: number) => void;
}

export function WritingExercise({ prompt, onSubmit, onSave, onContextMenu }: WritingExerciseProps) {
  const [content, setContent] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = calculateWordCount(content);
  const isWithinRange = wordCount >= prompt.wordCountMin && wordCount <= prompt.wordCountMax;
  const timeRemaining = Math.max(0, prompt.timeLimit - timeElapsed);
  const isTimeUp = timeElapsed >= prompt.timeLimit;

  useEffect(() => {
    if (isActive && !isTimeUp) {
      intervalRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 60000); // Update every minute
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isTimeUp]);

  const handleStart = () => {
    setIsActive(true);
    startTimeRef.current = Date.now();
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    if (!isActive && value.length > 0) {
      handleStart();
    }
    onSave?.(value);
  };

  const handleSubmit = () => {
    const submission: WritingSubmission = {
      id: `submission-${Date.now()}`,
      promptId: prompt.id,
      content,
      wordCount,
      timeSpent: timeElapsed,
      submittedAt: new Date().toISOString(),
    };
    
    setIsActive(false);
    onSubmit(submission);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getWordCountColor = () => {
    if (wordCount < prompt.wordCountMin) return 'text-amber-600 dark:text-amber-400';
    if (wordCount > prompt.wordCountMax) return 'text-red-600 dark:text-red-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getWordCountStatus = () => {
    if (wordCount < prompt.wordCountMin) {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        message: `${prompt.wordCountMin - wordCount} words below minimum`,
        color: 'text-amber-600 dark:text-amber-400'
      };
    }
    if (wordCount > prompt.wordCountMax) {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        message: `${wordCount - prompt.wordCountMax} words over maximum`,
        color: 'text-red-600 dark:text-red-400'
      };
    }
    return {
      icon: <Check className="w-4 h-4" />,
      message: 'Word count within range',
      color: 'text-green-600 dark:text-green-400'
    };
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const textarea = e.currentTarget;
    const selection = window.getSelection();
    
    if (selection && selection.toString().trim() && onContextMenu) {
      onContextMenu(selection.toString().trim(), e.clientX, e.clientY);
    }
  };

  const wordCountStatus = getWordCountStatus();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header with Stats */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {prompt.type.replace('-', ' ')}
            </Badge>
            <Badge variant="outline">
              {prompt.difficulty}
            </Badge>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className={timeRemaining <= 10 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-foreground'}>
                {formatTime(timeRemaining)} remaining
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="text-muted-foreground">
                {formatTime(timeElapsed)} elapsed
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (timeElapsed / prompt.timeLimit) * 100)}%` }}
          />
        </div>
      </div>

      {/* Enhanced Word Counter */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-foreground">Word Count:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${getWordCountColor()}`}>
                {wordCount}
              </span>
              <span className="text-muted-foreground">
                / {prompt.wordCountMin}-{prompt.wordCountMax}
              </span>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 ${wordCountStatus.color}`}>
            {wordCountStatus.icon}
            <span className="text-sm font-medium">{wordCountStatus.message}</span>
          </div>
        </div>
        
        <div className="mt-3 w-full bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              wordCount < prompt.wordCountMin ? 'bg-amber-500' :
              wordCount > prompt.wordCountMax ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ 
              width: `${Math.min(100, (wordCount / prompt.wordCountMax) * 100)}%` 
            }}
          />
        </div>
      </div>

      {/* Writing Prompt */}
      <div className="border-l-4 border-blue-500 pl-4 bg-card rounded-r-lg p-6">
        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
          {prompt.topic}
        </h2>
        <p className="text-lg text-blue-500 dark:text-blue-300 italic mb-4">
          {prompt.topicTranslation}
        </p>

        <div className="bg-muted/50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold text-foreground mb-2">Aufgabenstellung / Task:</h3>
          <p className="text-foreground mb-2">{prompt.prompt}</p>
          <p className="text-muted-foreground italic">{prompt.promptTranslation}</p>
        </div>

        {prompt.context && (
          <div className="bg-muted/30 p-4 rounded-lg mb-4">
            <h4 className="font-medium text-foreground mb-2">Kontext / Context:</h4>
            <p className="text-foreground mb-1">{prompt.context}</p>
            <p className="text-muted-foreground italic text-sm">{prompt.contextTranslation}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-medium text-foreground mb-2">Anforderungen / Requirements:</h4>
            <ul className="space-y-1">
              {prompt.requirements.map((req, idx) => (
                <li key={idx} className="text-sm">
                  <span className="text-foreground">• {req}</span>
                  <span className="block text-muted-foreground italic text-xs ml-2">
                    {prompt.requirementsTranslation[idx]}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHelp(!showHelp)}
              className="w-full"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              {showHelp ? 'Hide' : 'Show'} Key Phrases & Structure
            </Button>
          </div>
        </div>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Key Phrases / Wichtige Wendungen:</h3>
              <div className="space-y-2">
                {prompt.keyPhrases.map((phrase, idx) => (
                  <div key={idx} className="bg-muted/50 p-3 rounded border">
                    <div className="font-medium text-foreground">{phrase.phrase}</div>
                    <div className="text-muted-foreground text-sm italic">{phrase.translation}</div>
                    <div className="text-xs text-muted-foreground mt-1">{phrase.usage}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Suggested Structure / Empfohlene Struktur:</h3>
              <div className="space-y-3">
                <div className="bg-muted/50 p-3 rounded border">
                  <div className="font-medium text-foreground">Einleitung / Introduction:</div>
                  <div className="text-sm text-muted-foreground">{prompt.sampleStructure.introduction}</div>
                </div>
                
                {prompt.sampleStructure.bodyParagraphs.map((paragraph, idx) => (
                  <div key={idx} className="bg-muted/50 p-3 rounded border">
                    <div className="font-medium text-foreground">Hauptteil {idx + 1} / Body Paragraph {idx + 1}:</div>
                    <div className="text-sm text-muted-foreground">{paragraph}</div>
                  </div>
                ))}
                
                <div className="bg-muted/50 p-3 rounded border">
                  <div className="font-medium text-foreground">Schluss / Conclusion:</div>
                  <div className="text-sm text-muted-foreground">{prompt.sampleStructure.conclusion}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Writing Area */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Your Essay / Ihr Aufsatz</h3>
          <div className="flex items-center gap-4">
            {!isActive && content.length === 0 && (
              <p className="text-muted-foreground text-sm">Start typing to begin the timer</p>
            )}
            <div className="text-sm text-muted-foreground">
              Right-click words for help
            </div>
          </div>
        </div>
        
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onContextMenu={handleContextMenu}
          placeholder="Begin writing your essay here... / Beginnen Sie hier mit Ihrem Aufsatz..."
          className="min-h-[400px] text-base leading-relaxed resize-none cursor-text select-text"
          disabled={isTimeUp}
        />
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Characters: {content.length}</span>
            <span>Paragraphs: {content.split('\n\n').filter(p => p.trim()).length}</span>
            <span>Sentences: {content.split(/[.!?]+/).filter(s => s.trim().length > 0).length}</span>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!content.trim()}
            size="lg"
            className="min-w-[120px]"
          >
            Submit Essay
          </Button>
        </div>
      </div>

      {/* Warnings */}
      {isTimeUp && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200 font-medium">
            ⏰ Time is up! You can still submit your essay.
          </p>
        </div>
      )}
      
      {wordCount > 0 && !isWithinRange && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-amber-800 dark:text-amber-200 font-medium">
            {wordCount < prompt.wordCountMin 
              ? `📝 Consider adding ${prompt.wordCountMin - wordCount} more words to reach the recommended minimum.`
              : `✂️ Consider reducing your essay by ${wordCount - prompt.wordCountMax} words to stay within the recommended range.`
            }
          </p>
        </div>
      )}
    </div>
  );
} 