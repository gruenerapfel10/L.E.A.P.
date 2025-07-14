"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Loader2, Bot, User, Copy, RefreshCw } from "lucide-react";
import type { WritingExercise, WritingRubric, ChatMessage } from '../lib/writingSchemas';

interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: WritingExercise;
  evaluation: WritingRubric;
}

export function ChatDialog({ 
  isOpen, 
  onClose, 
  exercise,
  evaluation
}: ChatDialogProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        exerciseId: exercise.id,
        role: 'assistant',
        content: `Hello! I'm here to help you improve your writing. I've analyzed your essay "${exercise.prompt.topic}" and can discuss:

• Grammar mistakes and corrections
• Vocabulary improvements
• Structure and organization
• Style and tone
• Specific feedback on any part of your essay

What would you like to discuss about your writing?`,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, exercise.id, exercise.prompt.topic]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      exerciseId: exercise.id,
      role: 'user',
      content: currentMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/writing/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage.trim(),
          exercise,
          evaluation,
          chatHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        exerciseId: exercise.id,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        exerciseId: exercise.id,
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const generateSuggestions = () => {
    const suggestions = [
      "How can I improve my grammar?",
      "What vocabulary mistakes did I make?",
      "How can I better structure my essay?",
      "What's the best way to conclude this type of essay?",
      "Can you explain the grammar rules I struggled with?",
      "How can I make my writing more sophisticated?",
      "What German phrases would improve my writing?",
      "How can I better express my arguments?",
    ];
    
    return suggestions.slice(0, 4); // Show 4 suggestions
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCurrentMessage(suggestion);
  };

  const handleClose = () => {
    setMessages([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Writing Assistant Chat
          </DialogTitle>
          <DialogDescription>
            Discuss your essay "{exercise.prompt.topic}" and get personalized feedback
          </DialogDescription>
        </DialogHeader>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 pr-4" style={{ height: 'calc(100vh - 300px)' }}>
          <div className="space-y-4 p-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-green-500 text-white'
                  }`}>
                    {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  
                  <div className={`relative group ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-muted'
                  } p-3 rounded-lg`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                    
                    {message.role === 'assistant' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(message.content)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Suggestions */}
        {messages.length <= 2 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Quick suggestions:</h4>
            <div className="flex flex-wrap gap-2">
              {generateSuggestions().map((suggestion, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="h-auto py-1 px-2 text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="border-t pt-4">
          <div className="flex gap-2">
            <Textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your writing... (Press Enter to send, Shift+Enter for new line)"
              className="flex-1 resize-none"
              rows={2}
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || isLoading}
              size="sm"
              className="self-end"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Essay Info */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{exercise.prompt.type}</Badge>
            <span>•</span>
            <span>Score: {evaluation.overallScore}%</span>
            <span>•</span>
            <span>Words: {exercise.submission?.wordCount || 0}</span>
            <span>•</span>
            <span>Time: {exercise.submission?.timeSpent || 0} min</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 