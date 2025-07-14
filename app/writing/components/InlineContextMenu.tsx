"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Languages, MessageSquare, Loader2, Copy, ChevronDown, ChevronRight, Edit3, BookOpen } from "lucide-react";

interface InlineContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  x: number;
  y: number;
  context?: string;
}

export function InlineContextMenu({ 
  isOpen, 
  onClose, 
  selectedText, 
  x, 
  y, 
  context 
}: InlineContextMenuProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  
  const [isAsking, setIsAsking] = useState(false);
  const [question, setQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [showAI, setShowAI] = useState(false);



  const handleTranslate = async () => {
    if (translation && showTranslation) {
      setShowTranslation(!showTranslation);
      return;
    }

    setIsTranslating(true);
    setShowTranslation(true);
    setTranslation(null);
    
    try {
      const response = await fetch('/api/reading/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: selectedText,
          sourceLanguage: 'German',
          targetLanguage: 'English'
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      setTranslation(data.translation);
    } catch (error) {
      console.error('Translation error:', error);
      setTranslation('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAskAI = async () => {
    if (!question.trim()) return;
    
    setIsAsking(true);
    setAiAnswer(null);
    
    try {
      const response = await fetch('/api/reading/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: selectedText,
          question: question.trim(),
          context: `Writing exercise: ${context || 'German essay writing'}`
        }),
      });

      if (!response.ok) {
        throw new Error('AI question failed');
      }

      const data = await response.json();
      setAiAnswer(data.answer);
    } catch (error) {
      console.error('AI question error:', error);
      setAiAnswer('AI question failed. Please try again.');
    } finally {
      setIsAsking(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const toggleAI = () => {
    setShowAI(!showAI);
    if (!showAI) {
      setQuestion('');
      setAiAnswer(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      data-context-menu="true"
      className="fixed z-50 w-80 max-h-96 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95"
      style={{
        left: Math.min(x, window.innerWidth - 320),
        top: Math.min(y, window.innerHeight - 400),
      }}
    >
      {/* Header */}
      <div className="p-3 border-b bg-muted/50">
        <div className="text-xs font-medium text-muted-foreground mb-1">Selected Text</div>
        <div className="text-sm font-medium text-foreground max-h-12 overflow-y-auto">
          "{selectedText}"
        </div>
      </div>

      {/* Translation Section */}
      <div className="p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleTranslate}
          className="w-full justify-start h-8 text-sm"
          disabled={isTranslating}
        >
          {isTranslating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <>
              <Languages className="h-4 w-4 mr-2" />
              {showTranslation ? <ChevronDown className="h-3 w-3 ml-auto" /> : <ChevronRight className="h-3 w-3 ml-auto" />}
            </>
          )}
          {isTranslating ? 'Translating...' : 'Translate to English'}
        </Button>
        
        {showTranslation && (
          <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  🇩🇪 DE
                </span>
                <span>→</span>
                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  🇺🇸 EN
                </span>
              </div>
            </div>
            {translation ? (
              <div className="relative">
                <div className="text-sm text-green-800 dark:text-green-200 pr-6">
                  {translation}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-0 right-0 h-5 w-5 p-0"
                  onClick={() => copyToClipboard(translation)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading translation...
              </div>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* AI Assistant Section */}
      <div className="p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAI}
          className="w-full justify-start h-8 text-sm"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Ask AI
          {showAI ? <ChevronDown className="h-3 w-3 ml-auto" /> : <ChevronRight className="h-3 w-3 ml-auto" />}
        </Button>
        
        {showAI && (
          <div className="mt-2 space-y-2">
            <Textarea
              placeholder="Ask about this text..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="text-xs h-16 resize-none"
            />
            <Button
              size="sm"
              onClick={handleAskAI}
              disabled={isAsking || !question.trim()}
              className="w-full h-7 text-xs"
            >
              {isAsking ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <MessageSquare className="h-3 w-3 mr-1" />
              )}
              {isAsking ? 'Asking...' : 'Ask'}
            </Button>
            
            {aiAnswer && (
              <div className="relative p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <div className="text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap pr-6">
                  {aiAnswer}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-1 right-1 h-5 w-5 p-0"
                  onClick={() => copyToClipboard(aiAnswer)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-t bg-muted/30">
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowAI(true);
              setQuestion("How can I improve this part of my essay?");
            }}
            className="flex-1 h-6 text-xs"
          >
            <Edit3 className="h-3 w-3 mr-1" />
            Improve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowAI(true);
              setQuestion("Is this grammatically correct?");
            }}
            className="flex-1 h-6 text-xs"
          >
            Grammar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowAI(true);
              setQuestion("Suggest better vocabulary for this");
            }}
            className="flex-1 h-6 text-xs"
          >
            <BookOpen className="h-3 w-3 mr-1" />
            Vocab
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            className="h-6 text-xs px-2"
          >
            ✕
          </Button>
        </div>
      </div>
    </div>
  );
} 