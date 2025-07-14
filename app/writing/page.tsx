"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WritingExercise } from './components/WritingExercise';
import { InlineContextMenu } from './components/InlineContextMenu';
import { WritingHistory as WritingHistoryComponent } from './components/WritingHistory';
import { EmbeddedChat } from './components/EmbeddedChat';
import { useTextSelection } from './hooks/useTextSelection';
import { Loader2, PenTool, BookOpen, BarChart3, MessageSquare, TrendingUp, Target, Award, AlertCircle } from 'lucide-react';
import type { WritingPrompt, WritingSubmission, WritingRubric, WritingExercise as WritingExerciseType, WritingHistory } from './lib/writingSchemas';
import { saveWritingHistory, getWritingHistory, getWritingStatistics, getStrongestSkill, getWeakestSkill } from './lib/writingService';
import { v4 as uuidv4 } from 'uuid';

export default function WritingPage() {
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<WritingPrompt | null>(null);
  const [streamingPrompt, setStreamingPrompt] = useState<Partial<WritingPrompt> | null>(null);
  const [currentSubmission, setCurrentSubmission] = useState<WritingSubmission | null>(null);
  const [evaluation, setEvaluation] = useState<WritingRubric | null>(null);
  const [currentExercise, setCurrentExercise] = useState<WritingExerciseType | null>(null);
  const [history, setHistory] = useState<WritingHistory[]>([]);
  const [activeTab, setActiveTab] = useState('practice');
  const [error, setError] = useState<string | null>(null);

  
  // Text selection and context menu
  const { selection, contextMenu, closeContextMenu, clearSelection } = useTextSelection();
  
  // Prompt generation options
  const [selectedType, setSelectedType] = useState<string>('argumentative-essay');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('C1');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const writingHistory = getWritingHistory();
    setHistory(writingHistory);
  };

  const handleGeneratePrompt = async () => {
    console.log('[WritingPage] Starting prompt generation');
    setIsGeneratingPrompt(true);
    setCurrentPrompt(null);
    setStreamingPrompt(null);
    setError(null);
    setEvaluation(null);
    setCurrentSubmission(null);
    setCurrentExercise(null);

    try {
      console.log('[WritingPage] Calling streaming prompt API');
      const response = await fetch('/api/writing/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedType,
          topic: customTopic,
          difficulty,
        }),
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

      console.log('[WritingPage] Starting to read prompt stream');

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('[WritingPage] Prompt stream completed');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const partialPrompt = JSON.parse(line);
              console.log('[WritingPage] Received partial prompt:', partialPrompt);
              
              if (isCompletePrompt(partialPrompt)) {
                console.log('[WritingPage] Detected complete prompt');
                setCurrentPrompt(partialPrompt);
                setStreamingPrompt(null);
                setIsGeneratingPrompt(false);
                setActiveTab('practice');
                return;
              } else {
                setStreamingPrompt(partialPrompt);
              }
            } catch (parseError) {
              console.warn('[WritingPage] Failed to parse line:', line, parseError);
            }
          }
        }
      }

      if (buffer.trim()) {
        try {
          const finalPrompt = JSON.parse(buffer);
          console.log('[WritingPage] Final prompt:', finalPrompt);
          setCurrentPrompt(finalPrompt);
          setStreamingPrompt(null);
        } catch (parseError) {
          console.warn('[WritingPage] Failed to parse final buffer:', buffer, parseError);
        }
      }

      setActiveTab('practice');
      console.log('[WritingPage] Prompt generation complete');
    } catch (error) {
      console.error('[WritingPage] Prompt generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate writing prompt');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const isCompletePrompt = (obj: any): obj is WritingPrompt => {
    return obj && 
           obj.id && 
           obj.type && 
           obj.topic && 
           obj.topicTranslation && 
           obj.prompt && 
           obj.promptTranslation && 
           obj.requirements && 
           obj.requirementsTranslation && 
           obj.keyPhrases && 
           obj.sampleStructure &&
           obj.timeLimit &&
           obj.wordCountMin &&
           obj.wordCountMax;
  };

  const handleSubmission = async (submission: WritingSubmission) => {
    console.log('[WritingPage] Processing submission');
    setCurrentSubmission(submission);
    setIsEvaluating(true);
    setError(null);

    try {
      console.log('[WritingPage] Calling evaluation API');
      const response = await fetch('/api/writing/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: currentPrompt,
          submission,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const evaluationResult = await response.json();
      console.log('[WritingPage] Received evaluation:', evaluationResult);
      
      setEvaluation(evaluationResult);

      // Save to history
      if (currentPrompt) {
        const exercise: WritingExerciseType = {
          id: uuidv4(),
          prompt: currentPrompt,
          submission,
          evaluation: evaluationResult,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };

        setCurrentExercise(exercise);

        // Enhanced history saving with detailed analytics
        const historyEntry: WritingHistory = {
          id: uuidv4(),
          exercise,
          date: new Date().toISOString(),
          score: evaluationResult.overallScore,
          timeSpent: submission.timeSpent,
          grammarMistakeCount: evaluationResult.grammarMistakes.length,
          vocabularyScore: evaluationResult.vocabularyUsage.advancedWords / evaluationResult.vocabularyUsage.totalWords * 100,
          structuralScore: evaluationResult.structuralAnalysis.overallStructure === 'excellent' ? 100 : 
                         evaluationResult.structuralAnalysis.overallStructure === 'good' ? 80 :
                         evaluationResult.structuralAnalysis.overallStructure === 'adequate' ? 60 : 40,
          styleScore: evaluationResult.styleAnalysis.register === 'excellent' ? 100 :
                     evaluationResult.styleAnalysis.register === 'appropriate' ? 80 :
                     evaluationResult.styleAnalysis.register === 'adequate' ? 60 : 40,
          wordsPerMinute: evaluationResult.writingMetrics.wordsPerMinute,
          accuracyRate: Math.max(0, 100 - (evaluationResult.grammarMistakes.length * 5)), // Rough accuracy calculation
          strongestSkill: getStrongestSkill(evaluationResult.criteria),
          weakestSkill: getWeakestSkill(evaluationResult.criteria),
        };

        saveWritingHistory(historyEntry);
        loadHistory();
      }

      setActiveTab('results');
    } catch (error) {
      console.error('[WritingPage] Evaluation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to evaluate submission');
    } finally {
      setIsEvaluating(false);
    }
  };

  const getStrongestSkill = (criteria: any) => {
    const skills = [
      { name: 'Task Fulfillment', score: criteria.taskFulfillment },
      { name: 'Coherence & Cohesion', score: criteria.coherenceAndCohesion },
      { name: 'Vocabulary & Language', score: criteria.vocabularyAndLanguageRange },
      { name: 'Grammar & Accuracy', score: criteria.grammarAndAccuracy },
      { name: 'Style', score: criteria.appropriatenessOfStyle },
    ];
    return skills.reduce((max, skill) => skill.score > max.score ? skill : max).name;
  };

  const getWeakestSkill = (criteria: any) => {
    const skills = [
      { name: 'Task Fulfillment', score: criteria.taskFulfillment },
      { name: 'Coherence & Cohesion', score: criteria.coherenceAndCohesion },
      { name: 'Vocabulary & Language', score: criteria.vocabularyAndLanguageRange },
      { name: 'Grammar & Accuracy', score: criteria.grammarAndAccuracy },
      { name: 'Style', score: criteria.appropriatenessOfStyle },
    ];
    return skills.reduce((min, skill) => skill.score < min.score ? skill : min).name;
  };

  const handleContextMenu = (selectedText: string, x: number, y: number) => {
    // This will be handled by the useTextSelection hook
    console.log('[WritingPage] Context menu requested for:', selectedText);
  };

  const getContextForAI = () => {
    if (currentPrompt) {
      return currentPrompt.topic;
    }
    return undefined;
  };

  const statistics = getWritingStatistics();

  const renderStreamingPrompt = () => {
    if (!streamingPrompt) return null;

    return (
      <div className="space-y-6 animate-fade-in">
        {streamingPrompt.topic && (
          <div className="border-l-4 border-blue-500 pl-4 bg-card rounded-r-lg p-4">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{streamingPrompt.topic}</h2>
            {streamingPrompt.topicTranslation && (
              <p className="text-lg text-blue-500 dark:text-blue-300 italic">{streamingPrompt.topicTranslation}</p>
            )}
            {streamingPrompt.type && (
              <Badge variant="secondary" className="mt-2 capitalize">
                {streamingPrompt.type.replace('-', ' ')}
              </Badge>
            )}
          </div>
        )}
        
        {streamingPrompt.prompt && (
          <div className="bg-muted/50 p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-3 text-foreground">Writing Prompt</h3>
            <p className="text-foreground mb-2">{streamingPrompt.prompt}</p>
            {streamingPrompt.promptTranslation && (
              <p className="text-muted-foreground italic">{streamingPrompt.promptTranslation}</p>
            )}
          </div>
        )}

        <div className="text-center text-muted-foreground animate-pulse">
          <div className="inline-flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating prompt...</span>
          </div>
        </div>
      </div>
    );
  };

  const renderEvaluationResults = () => {
    if (!evaluation) return null;

    return (
      <div className="space-y-6">
        {/* Overall Score */}
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Award className="w-8 h-8 text-blue-500" />
            <h2 className="text-2xl font-bold text-foreground">Overall Score</h2>
          </div>
          <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {evaluation.overallScore}%
          </div>
          <p className="text-muted-foreground">
            {evaluation.overallScore >= 90 ? 'Excellent work!' :
             evaluation.overallScore >= 80 ? 'Good job!' :
             evaluation.overallScore >= 70 ? 'Well done!' :
             evaluation.overallScore >= 60 ? 'Good effort!' :
             'Keep practicing!'}
          </p>
        </div>

        {/* Detailed Criteria */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Detailed Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(evaluation.criteria).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="font-medium text-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        value >= 80 ? 'bg-green-500' :
                        value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="font-bold text-foreground">{value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grammar Analysis */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Grammar Analysis</h3>
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="font-medium">
              {evaluation.grammarMistakes.length} grammar mistakes found
            </span>
          </div>
          
          {evaluation.grammarMistakes.length > 0 && (
            <div className="space-y-3">
              {evaluation.grammarMistakes.slice(0, 5).map((mistake, index) => (
                <div key={index} className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Badge variant="destructive" className="mb-2 text-xs">
                        {mistake.type.replace('-', ' ')}
                      </Badge>
                      <p className="text-sm">
                        <span className="line-through text-red-600 dark:text-red-400">
                          {mistake.originalText}
                        </span>
                        {' → '}
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {mistake.correctedText}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {mistake.explanation}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {mistake.severity}
                    </Badge>
                  </div>
                </div>
              ))}
              {evaluation.grammarMistakes.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  And {evaluation.grammarMistakes.length - 5} more mistakes...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Vocabulary Analysis */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Vocabulary Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {evaluation.vocabularyUsage.totalWords}
              </div>
              <div className="text-sm text-muted-foreground">Total Words</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {evaluation.vocabularyUsage.uniqueWords}
              </div>
              <div className="text-sm text-muted-foreground">Unique Words</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {evaluation.vocabularyUsage.advancedWords}
              </div>
              <div className="text-sm text-muted-foreground">Advanced Words</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 capitalize">
                {evaluation.vocabularyUsage.vocabularyRange}
              </div>
              <div className="text-sm text-muted-foreground">Range</div>
            </div>
          </div>
        </div>

        {/* Feedback and Chat Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feedback Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-green-600 dark:text-green-400">
                Strengths
              </h3>
              <ul className="space-y-2">
                {evaluation.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span className="text-foreground text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-orange-600 dark:text-orange-400">
                Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {evaluation.areasForImprovement.map((area, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span className="text-foreground text-sm">{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Embedded Chat */}
          {currentExercise && evaluation && (
            <div className="lg:col-span-2">
              <EmbeddedChat exercise={currentExercise} evaluation={evaluation} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex flex-col items-center space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Goethe C1 Writing Practice</h1>
          <p className="text-lg text-gray-600 mt-2">Comprehensive Writing Assessment</p>
        </div>
        
        <div className="w-full max-w-6xl">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="practice">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Practice
                </TabsTrigger>
                <TabsTrigger value="results">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Results
                </TabsTrigger>
                <TabsTrigger value="history">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  History
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-4">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Essay Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="argumentative-essay">Argumentative Essay</SelectItem>
                    <SelectItem value="opinion-essay">Opinion Essay</SelectItem>
                    <SelectItem value="formal-letter">Formal Letter</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Custom topic (optional)"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="w-64"
                />

                <Button 
                  onClick={handleGeneratePrompt} 
                  disabled={isGeneratingPrompt}
                  className="w-48"
                >
                  {isGeneratingPrompt ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Prompt'
                  )}
                </Button>
              </div>
            </div>

            <TabsContent value="practice">
              {currentPrompt ? (
                <div className="cursor-text select-text">
                  <WritingExercise
                    prompt={currentPrompt}
                    onSubmit={handleSubmission}
                    onContextMenu={handleContextMenu}
                  />
                </div>
              ) : error ? (
                <div className="text-center text-red-500 p-8">
                  <p className="text-lg font-medium">Error</p>
                  <p>{error}</p>
                  <Button 
                    onClick={handleGeneratePrompt} 
                    className="mt-4"
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </div>
              ) : isGeneratingPrompt ? (
                renderStreamingPrompt()
              ) : (
                <div className="text-center text-muted-foreground p-8">
                  <PenTool className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg">Ready to practice writing?</p>
                  <p>Choose your essay type and click "Generate Prompt" to start</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="results">
              {isEvaluating ? (
                <div className="text-center p-8">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-500" />
                  <p className="text-lg font-medium">Evaluating your essay...</p>
                  <p className="text-muted-foreground">This may take a moment</p>
                </div>
              ) : evaluation ? (
                renderEvaluationResults()
              ) : (
                <div className="text-center text-muted-foreground p-8">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg">No results yet</p>
                  <p>Complete a writing exercise to see your evaluation</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              <WritingHistoryComponent />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Context Menu */}
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