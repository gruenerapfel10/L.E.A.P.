"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { User, Bot, Send, Copy, Lightbulb, MessageSquare } from 'lucide-react';
import type { WritingExercise, WritingRubric, ChatMessage } from '../lib/writingSchemas';

interface EmbeddedChatProps {
  exercise: WritingExercise;
  evaluation: WritingRubric;
}

export function EmbeddedChat({ exercise, evaluation }: EmbeddedChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        exerciseId: exercise.id,
        role: 'assistant',
        content: `Great work on completing your essay "${exercise.prompt.topic}"! 🎉

I've analyzed your writing and can help you understand:

• **Grammar mistakes** - Let's discuss the ${evaluation.grammarMistakes.length} errors I found
• **Vocabulary improvements** - Ways to enhance your word choices
• **Structure feedback** - How to improve your essay organization
• **Style suggestions** - Making your writing more appropriate for C1 level

What would you like to explore first? Feel free to ask about any specific part of your essay or the feedback!`,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    }
  }, [exercise.id, exercise.prompt.topic, evaluation.grammarMistakes.length]);

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
      "Explain my grammar mistakes",
      "How can I improve my vocabulary?",
      "What's wrong with my essay structure?",
      "Give me specific examples to improve",
      "How do I write better conclusions?",
      "What C1 level phrases should I use?"
    ];
    return suggestions.slice(0, 3);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCurrentMessage(suggestion);
  };

  return (
    <Card className="h-[600px] flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0 pb-3 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">AI Writing Coach</CardTitle>
            <CardDescription>Discuss your essay and get personalized improvement tips</CardDescription>
          </div>
        </div>
      </CardHeader>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
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
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-green-500 text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Message Input Area */}
      <div className="flex-shrink-0 border-t bg-background">
        <div className="p-4 space-y-3">
          {/* Quick Suggestions */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2">
              {generateSuggestions().map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <Lightbulb className="w-3 h-3 mr-1" />
                  {suggestion}
                </Button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about your essay, grammar mistakes, or get writing tips..."
              className="resize-none min-h-[60px] max-h-[120px] flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || isLoading}
              size="sm"
              className="self-end h-[60px] px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </Card>
  );
} 