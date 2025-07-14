"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ReadingTest } from '../components/ReadingTest';
import { TestHistory } from '../components/TestHistory';
import { InlineContextMenu } from '../components/InlineContextMenu';
import { saveTestHistory, getTestHistory } from '../lib/testHistoryService';
import { useTextSelection } from '../hooks/useTextSelection';
import type { ReadingText, TestHistory as TestHistoryType } from '../lib/questionSchemas';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function StreamingReadingPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentText, setCurrentText] = useState<ReadingText | null>(null);
  const [streamingText, setStreamingText] = useState<Partial<ReadingText> | null>(null);
  const [history, setHistory] = useState<TestHistoryType[]>([]);
  const [activeTab, setActiveTab] = useState('practice');
  const [error, setError] = useState<string | null>(null);
  const { selection, contextMenu, closeContextMenu, clearSelection } = useTextSelection();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const testHistory = getTestHistory();
    setHistory(testHistory);
  };

  const handleGenerate = async () => {
    console.log('[StreamingReadingPage] Starting streaming generation');
    setIsGenerating(true);
    setCurrentText(null);
    setStreamingText(null);
    setError(null);

    try {
      console.log('[StreamingReadingPage] Calling streaming API');
      const response = await fetch('/api/reading/generate-streaming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let lastValidObject: Partial<ReadingText> | null = null;

      console.log('[StreamingReadingPage] Starting to read stream');

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('[StreamingReadingPage] Stream completed');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const partialObject = JSON.parse(line);
              console.log('[StreamingReadingPage] Received partial object:', partialObject);
              
              // Check if this looks like a complete object
              if (isCompleteReadingText(partialObject)) {
                console.log('[StreamingReadingPage] Detected complete object');
                setCurrentText(partialObject);
                setStreamingText(null);
                setIsGenerating(false);
                return;
              } else {
                setStreamingText(partialObject);
                lastValidObject = partialObject;
              }
            } catch (parseError) {
              console.warn('[StreamingReadingPage] Failed to parse line:', line, parseError);
            }
          }
        }
      }

      // Process final buffer if any
      if (buffer.trim()) {
        try {
          const finalObject = JSON.parse(buffer);
          console.log('[StreamingReadingPage] Final object:', finalObject);
          setCurrentText(finalObject);
          setStreamingText(null);
        } catch (parseError) {
          console.warn('[StreamingReadingPage] Failed to parse final buffer:', buffer, parseError);
          // Use last valid object if final parse fails
          if (lastValidObject && isCompleteReadingText(lastValidObject)) {
            setCurrentText(lastValidObject as ReadingText);
            setStreamingText(null);
          }
        }
      } else if (lastValidObject && isCompleteReadingText(lastValidObject)) {
        // Use last valid object if no final buffer
        setCurrentText(lastValidObject as ReadingText);
        setStreamingText(null);
      }

      setActiveTab('practice');
      console.log('[StreamingReadingPage] Generation complete');
    } catch (error) {
      console.error('[StreamingReadingPage] Generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate reading exercise');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to check if object is complete
  const isCompleteReadingText = (obj: any): obj is ReadingText => {
    const hasId = obj && obj.id;
    const hasTitle = obj && obj.title;
    const hasTitleTranslation = obj && obj.titleTranslation;
    const hasContent = obj && obj.content;
    const hasContentTranslation = obj && obj.contentTranslation;
    const hasType = obj && obj.type;
    const hasDifficulty = obj && obj.difficulty;
    const hasQuestions = obj && obj.questions && Array.isArray(obj.questions);
    const hasValidQuestions = hasQuestions && obj.questions.length > 0 && 
                             obj.questions.every((q: any) => q.id && q.text && q.type);

    console.log('[isCompleteReadingText] Checking completeness:', {
      hasId,
      hasTitle,
      hasTitleTranslation,
      hasContent,
      hasContentTranslation,
      hasType,
      hasDifficulty,
      hasQuestions,
      hasValidQuestions,
      questionsLength: hasQuestions ? obj.questions.length : 0
    });

    return hasId && hasTitle && hasTitleTranslation && hasContent && 
           hasContentTranslation && hasType && hasDifficulty && hasValidQuestions;
  };

  const handleComplete = (score: number, answers: Record<string, any>) => {
    console.log('[StreamingReadingPage] Test completed with score:', score);
    if (currentText) {
      saveTestHistory(currentText, score, answers);
      loadHistory();
      setActiveTab('history');
    }
  };

  const getContextForAI = () => {
    if (currentText) {
      return currentText.title;
    }
    if (streamingText && streamingText.title) {
      return streamingText.title;
    }
    return undefined;
  };

  const renderStreamingContent = () => {
    if (!streamingText) return null;

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Title Section */}
        {streamingText.title && (
          <div className="border-l-4 border-blue-500 pl-4 bg-card rounded-r-lg p-4">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{streamingText.title}</h2>
            {streamingText.titleTranslation && (
              <p className="text-lg text-blue-500 dark:text-blue-300 italic">{streamingText.titleTranslation}</p>
            )}
            {streamingText.type && (
              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                {streamingText.type}
              </span>
            )}
          </div>
        )}
        
        {/* Content Section */}
        {streamingText.content && (
          <div className="bg-muted/50 p-6 rounded-lg border cursor-text select-text">
            <h3 className="text-lg font-semibold mb-3 text-foreground">Reading Passage</h3>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              {streamingText.content.split('\n').filter(p => p.trim()).map((paragraph, i) => (
                <p key={i} className="mb-3 text-foreground">{paragraph}</p>
              ))}
            </div>
            
            {streamingText.contentTranslation && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-md font-medium mb-2 text-muted-foreground">Translation</h4>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  {streamingText.contentTranslation.split('\n').filter(p => p.trim()).map((paragraph, i) => (
                    <p key={i} className="mb-2 text-muted-foreground italic">{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Questions Section */}
        {streamingText.questions && streamingText.questions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Questions ({streamingText.questions.length})
            </h3>
            {streamingText.questions.map((question, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs font-medium mb-2">
                      {question.type}
                    </span>
                    <p className="font-medium text-foreground">{question.text}</p>
                    {question.textTranslation && (
                      <p className="text-muted-foreground italic mt-1">{question.textTranslation}</p>
                    )}
                    
                    {/* Show options for multiple choice */}
                    {question.type === 'multiple-choice' && question.options && (
                      <ul className="mt-3 space-y-1">
                        {question.options.map((option, optIndex) => (
                          <li key={optIndex} className="text-sm text-foreground flex items-center">
                            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium mr-2">
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            {option}
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    {/* Show pairs for matching */}
                    {question.type === 'matching' && question.pairs && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {question.pairs.map((pair, pairIndex) => (
                          <div key={pairIndex} className="bg-muted/50 p-2 rounded border">
                            <div className="font-medium text-foreground">{pair.statement}</div>
                            <div className="text-muted-foreground">→ {pair.match}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show gaps for gap-fill */}
                    {question.type === 'gap-fill' && question.gaps && (
                      <div className="mt-3 space-y-2">
                        {question.gaps.map((gap, gapIndex) => (
                          <div key={gapIndex} className="bg-muted/50 p-2 rounded border">
                            <div className="font-medium text-foreground mb-1">Gap {gapIndex + 1}:</div>
                            <div className="flex flex-wrap gap-1">
                              {gap.options.map((option, optIndex) => (
                                <span key={optIndex} className="px-2 py-1 bg-background border border-border rounded text-xs">
                                  {option}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Generation Status */}
        <div className="text-center text-muted-foreground animate-pulse">
          <div className="inline-flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
            <span>Generating content...</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex flex-col items-center space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Goethe C1 Reading Practice</h1>
          <p className="text-lg text-gray-600 mt-2">Live Streaming Generation</p>
        </div>
        
        <div className="w-full max-w-4xl">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="practice">Practice</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="w-48"
              >
                {isGenerating ? 'Generating...' : 'Generate Question'}
              </Button>
            </div>

            <TabsContent value="practice">
              {currentText ? (
                <div className="space-y-6">
                  <div className="text-center text-green-600 font-medium">
                    ✅ Generation Complete! Ready to start the test.
                  </div>
                  <div className="cursor-text select-text">
                    <ReadingTest 
                      texts={[currentText]}
                      onComplete={handleComplete}
                    />
                  </div>
                </div>
              ) : streamingText ? (
                renderStreamingContent()
              ) : error ? (
                <div className="text-center text-red-500 p-8">
                  <p className="text-lg font-medium">Error</p>
                  <p>{error}</p>
                  <Button 
                    onClick={handleGenerate} 
                    className="mt-4"
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </div>
              ) : isGenerating ? (
                <div className="text-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-lg font-medium">Starting generation...</p>
                  <p className="text-muted-foreground">Preparing your reading exercise</p>
                </div>
              ) : (
                <div className="text-center text-muted-foreground p-8">
                  <p className="text-lg">Ready for live generation?</p>
                  <p>Watch as your reading exercise is created in real-time!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              <TestHistory 
                history={history}
                onHistoryChange={loadHistory}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Inline Context Menu */}
      <InlineContextMenu
        isOpen={!!contextMenu}
        onClose={closeContextMenu}
        selectedText={contextMenu?.selectedText || ''}
        x={contextMenu?.x || 0}
        y={contextMenu?.y || 0}
        context={getContextForAI()}
      />
    </div>
  );
} 