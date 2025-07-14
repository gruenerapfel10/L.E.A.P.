"use client";

import React from 'react';
import { format } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import type { TestHistory as TestHistoryType, Question } from '../lib/questionSchemas';
import { deleteTestHistory } from '../lib/testHistoryService';

interface TestHistoryProps {
  history: TestHistoryType[];
  onHistoryChange: () => void;
}

export function TestHistory({ history, onHistoryChange }: TestHistoryProps) {
  const handleDelete = (id: string) => {
    deleteTestHistory(id);
    onHistoryChange();
  };

  const renderQuestionAnswer = (question: Question, userAnswer: string | string[] | undefined) => {
    if (!userAnswer) {
      return (
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <span className="text-sm font-medium text-muted-foreground">No answer provided</span>
        </div>
      );
    }

    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-muted/30 rounded-lg">
              <span className="text-sm font-medium text-foreground">Your answer: </span>
              <span className="text-sm text-foreground">{userAnswer as string}</span>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <span className="text-sm font-medium text-green-800 dark:text-green-200">Correct answer: </span>
              <span className="text-sm text-green-700 dark:text-green-300">{question.correctAnswer}</span>
            </div>
          </div>
        );

      case 'true-false':
        return (
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-muted/30 rounded-lg">
              <span className="text-sm font-medium text-foreground">Your answer: </span>
              <span className="text-sm text-foreground">{userAnswer as string}</span>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <span className="text-sm font-medium text-green-800 dark:text-green-200">Correct answer: </span>
              <span className="text-sm text-green-700 dark:text-green-300">{question.correctAnswer}</span>
            </div>
          </div>
        );

      case 'matching':
        const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [];
        return (
          <div className="mt-4 space-y-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-3">Your answers:</p>
              <div className="space-y-2">
                {question.pairs?.map((pair, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2 bg-background rounded border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{pair.statement}</p>
                      <p className="text-xs text-muted-foreground italic">
                        {pair.statementTranslation}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground">→ {userAnswerArray[idx] || 'Not answered'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-3">Correct answers:</p>
              <div className="space-y-2">
                {question.pairs?.map((pair, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2 bg-green-100/50 dark:bg-green-900/10 rounded">
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">{pair.statement}</p>
                    </div>
                    <div>
                      <p className="text-sm text-green-700 dark:text-green-300">→ {pair.match}</p>
                      <p className="text-xs text-green-600 dark:text-green-400 italic">
                        {pair.matchTranslation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'gap-fill':
        const gapAnswers = Array.isArray(userAnswer) ? userAnswer : [];
        return (
          <div className="mt-4 space-y-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-3">Your answers:</p>
              <div className="space-y-2">
                {question.gaps?.map((gap, idx) => (
                  <div key={idx} className="p-2 bg-background rounded border">
                    <p className="text-sm font-medium text-foreground">Gap {idx + 1}:</p>
                    <p className="text-sm text-foreground mt-1">
                      {gapAnswers[idx] || 'Not answered'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-3">Correct answers:</p>
              <div className="space-y-2">
                {question.gaps?.map((gap, idx) => (
                  <div key={idx} className="p-2 bg-green-100/50 dark:bg-green-900/10 rounded">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Gap {idx + 1}:</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {gap.correctAnswer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (history.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No test history available
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Accordion type="single" collapsible className="w-full space-y-4">
        {history.map((test) => (
          <AccordionItem key={test.id} value={test.id} className="border border-border rounded-lg bg-card">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <div className="font-medium text-foreground">
                      {format(new Date(test.date), 'PPP')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(test.date), 'p')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                      test.score >= 80 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                        : test.score >= 60
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      Score: {test.score}%
                    </span>
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4 bg-card rounded-r-lg p-4">
                  <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {test.readingText.title}
                  </h3>
                  <p className="text-lg text-blue-500 dark:text-blue-300 italic mt-1">
                    {test.readingText.titleTranslation}
                  </p>
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                    {test.readingText.type}
                  </span>
                </div>

                <div className="bg-muted/50 p-6 rounded-lg border">
                  <h4 className="text-lg font-semibold mb-3 text-foreground">Reading Passage</h4>
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    {test.readingText.content.split('\n').filter(p => p.trim()).map((paragraph, i) => (
                      <p key={i} className="mb-3 text-foreground">{paragraph}</p>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <h5 className="text-md font-medium mb-2 text-muted-foreground">Translation</h5>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      {test.readingText.contentTranslation.split('\n').filter(p => p.trim()).map((paragraph, i) => (
                        <p key={i} className="mb-2 text-muted-foreground italic">{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-foreground">
                    Questions & Your Answers ({test.readingText.questions.length})
                  </h4>
                  {test.readingText.questions.map((question) => {
                    const userAnswer = test.userAnswers[question.id];
                    const isCorrect = Array.isArray(question.correctAnswer) 
                      ? JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer)
                      : userAnswer === question.correctAnswer;
                    
                    return (
                      <div key={question.id} className="bg-card border border-border rounded-lg p-6 shadow-sm">
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs font-medium">
                              {question.type}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              isCorrect 
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            }`}>
                              {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                            </span>
                          </div>
                          <p className="font-medium text-foreground text-lg">{question.text}</p>
                          <p className="text-muted-foreground italic mt-2">{question.textTranslation}</p>
                        </div>
                        
                        {renderQuestionAnswer(question, userAnswer)}
                        
                        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm font-medium text-foreground mb-1">Explanation:</p>
                          <p className="text-sm text-muted-foreground">{question.explanation}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(test.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
} 