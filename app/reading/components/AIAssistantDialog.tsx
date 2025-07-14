"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Languages, MessageSquare, Loader2, Copy } from "lucide-react";

interface AIAssistantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  context?: string;
}

export function AIAssistantDialog({ 
  isOpen, 
  onClose, 
  selectedText, 
  context 
}: AIAssistantDialogProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [question, setQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const handleTranslate = async () => {
    setIsTranslating(true);
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
          context
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

  const handleClose = () => {
    setTranslation(null);
    setAiAnswer(null);
    setQuestion('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            AI Assistant
          </DialogTitle>
          <DialogDescription>
            Get translations and ask questions about the selected text
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Text */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Selected Text</Label>
            <div className="p-3 bg-muted rounded-lg border">
              <p className="text-sm">{selectedText}</p>
              {context && (
                <Badge variant="outline" className="mt-2">
                  Context: {context}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Translation Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Languages className="h-4 w-4" />
                Translation (German → English)
              </Label>
              <Button 
                onClick={handleTranslate}
                disabled={isTranslating}
                size="sm"
                variant="outline"
              >
                {isTranslating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Languages className="h-4 w-4" />
                )}
                {isTranslating ? 'Translating...' : 'Translate'}
              </Button>
            </div>
            
            {translation && (
              <div className="relative">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-200">{translation}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={() => copyToClipboard(translation)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* AI Question Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Ask AI a Question
            </Label>
            
            <div className="space-y-2">
              <Textarea
                placeholder="Ask a question about the selected text (e.g., 'What does this word mean?', 'Explain the grammar here', 'What is the main idea?')"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
              />
              <Button 
                onClick={handleAskAI}
                disabled={isAsking || !question.trim()}
                size="sm"
              >
                {isAsking ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <MessageSquare className="h-4 w-4 mr-2" />
                )}
                {isAsking ? 'Asking AI...' : 'Ask AI'}
              </Button>
            </div>
            
            {aiAnswer && (
              <div className="relative">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{aiAnswer}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={() => copyToClipboard(aiAnswer)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 