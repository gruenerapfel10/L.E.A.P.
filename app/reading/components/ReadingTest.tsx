"use client";

import React, { useState } from 'react';
import { ExamTimer } from './ExamTimer';
import { Button } from '@/components/ui/button';

export interface Question {
  id: string;
  type: 'multiple-choice' | 'matching' | 'true-false' | 'gap-fill';
  text: string;
  textTranslation: string;
  options?: string[];
  optionsTranslations?: string[];
  pairs?: Array<{
    statement: string;
    statementTranslation: string;
    match: string;
    matchTranslation: string;
  }>;
  correctAnswer: string | string[];
  explanation: string;
  gaps?: Array<{
    options: string[];
    optionsTranslations?: string[];
  }>;
}

export interface ReadingText {
  id: string;
  title: string;
  titleTranslation: string;
  content: string;
  contentTranslation: string;
  type: string;
  questions: Question[];
}

interface ReadingTestProps {
  texts: ReadingText[];
  onComplete: (score: number, answers: Record<string, any>) => void;
}

export function ReadingTest({ texts, onComplete }: ReadingTestProps) {
  const [isActive, setIsActive] = useState(true);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showTranslations, setShowTranslations] = useState(false);
  
  const currentText = texts[currentTextIndex];

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const calculateScore = () => {
    let totalCorrect = 0;
    let totalQuestions = 0;

    texts.forEach(text => {
      text.questions.forEach(question => {
        totalQuestions++;
        const userAnswer = answers[question.id];
        
        if (!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0) || userAnswer === '') {
          return; // Skip unanswered questions
        }

        switch (question.type) {
          case 'multiple-choice':
          case 'true-false':
            if (userAnswer === question.correctAnswer) {
              totalCorrect++;
            }
            break;

          case 'matching':
          case 'gap-fill':
            if (!Array.isArray(userAnswer) || !Array.isArray(question.correctAnswer)) {
              return; // Skip if answer format doesn't match
            }
            // Only check answers that have been provided
            const answeredCount = userAnswer.filter(ans => ans !== undefined && ans !== '').length;
            if (answeredCount === 0) {
              return; // Skip if no answers provided
            }
            // Check if all provided answers are correct
            const correct = userAnswer.every((ans, idx) => 
              ans && question.correctAnswer[idx] && ans === question.correctAnswer[idx]
            );
            if (correct) totalCorrect++;
            break;
        }
      });
    });

    return Math.round((totalCorrect / totalQuestions) * 100);
  };

  const handleTimeUp = () => {
    const score = calculateScore();
    
    // Ensure all answers are properly formatted
    const formattedAnswers: Record<string, string | string[]> = {};
    
    texts.forEach(text => {
      text.questions.forEach(question => {
        const answer = answers[question.id];
        if (!answer) {
          formattedAnswers[question.id] = question.type === 'multiple-choice' || question.type === 'true-false' 
            ? '' 
            : [];
        } else {
          formattedAnswers[question.id] = answer;
        }
      });
    });

    onComplete(score, formattedAnswers);
  };

  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, idx) => (
              <label key={idx} className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  className="mt-1 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-foreground">{option}</span>
                  </div>
                  {showTranslations && question.optionsTranslations && (
                    <p className="text-muted-foreground text-sm italic mt-1 ml-8">
                      {question.optionsTranslations[idx]}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
        );

      case 'true-false':
        return (
          <div className="space-y-3">
            {['Richtig', 'Falsch', 'Nicht im Text'].map((option) => (
              <label key={option} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  className="rounded-full"
                />
                <span className="text-foreground">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'matching':
        return (
          <div className="space-y-4">
            {question.pairs?.map((pair, idx) => (
              <div key={idx} className="bg-muted/50 p-4 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <p className="font-medium text-foreground">{pair.statement}</p>
                    {showTranslations && (
                      <p className="text-muted-foreground text-sm italic mt-1">
                        {pair.statementTranslation}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-center">
                    <select
                      value={answers[question.id]?.[idx] || ''}
                      onChange={(e) => {
                        const newAnswers = [...(answers[question.id] || new Array(question.pairs?.length).fill(''))];
                        newAnswers[idx] = e.target.value;
                        handleAnswer(question.id, newAnswers);
                      }}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select match...</option>
                      {question.pairs?.map((p, matchIdx) => (
                        <option key={matchIdx} value={p.match}>
                          {p.match}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {showTranslations && pair.matchTranslation && (
                      <p className="italic">Expected: {pair.matchTranslation}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'gap-fill':
        return (
          <div className="space-y-4">
            {question.gaps?.map((gap, gapIdx) => (
              <div key={gapIdx} className="bg-muted/50 p-4 rounded-lg border">
                <p className="font-medium text-foreground mb-3">Gap {gapIdx + 1}:</p>
                <div className="space-y-2">
                  {gap.options.map((option, optIdx) => (
                    <label key={optIdx} className="flex items-center space-x-3 p-2 rounded border border-border hover:bg-background transition-colors cursor-pointer">
                      <input
                        type="radio"
                        name={`${question.id}-gap-${gapIdx}`}
                        value={option}
                        checked={answers[question.id]?.[gapIdx] === option}
                        onChange={(e) => {
                          const newAnswers = [...(answers[question.id] || [])];
                          newAnswers[gapIdx] = e.target.value;
                          handleAnswer(question.id, newAnswers);
                        }}
                        className="rounded-full"
                      />
                      <div className="flex-1">
                        <span className="text-foreground">{option}</span>
                        {showTranslations && gap.optionsTranslations && (
                          <p className="text-muted-foreground text-sm italic mt-1">
                            {gap.optionsTranslations[optIdx]}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <ExamTimer duration={70} onTimeUp={handleTimeUp} isActive={isActive} />
        <Button
          variant="outline"
          onClick={() => setShowTranslations(!showTranslations)}
          className="ml-4"
        >
          {showTranslations ? 'Hide Translations' : 'Show Translations'}
        </Button>
      </div>
      
      <div className="mb-8">
        <div className="border-l-4 border-blue-500 pl-4 bg-card rounded-r-lg p-4 mb-6">
          <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {currentText.title}
          </h2>
          {showTranslations && (
            <p className="text-lg text-blue-500 dark:text-blue-300 italic mt-1">
              {currentText.titleTranslation}
            </p>
          )}
          <span className="inline-block mt-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
            {currentText.type}
          </span>
        </div>

        <div className="bg-muted/50 p-6 rounded-lg border mb-6">
          <h3 className="text-lg font-semibold mb-3 text-foreground">Reading Passage</h3>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            {currentText.content.split('\n').filter(p => p.trim()).map((paragraph, i) => (
              <p key={i} className="mb-3 text-foreground">{paragraph}</p>
            ))}
          </div>
          {showTranslations && (
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-md font-medium mb-2 text-muted-foreground">Translation</h4>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                {currentText.contentTranslation.split('\n').filter(p => p.trim()).map((paragraph, i) => (
                  <p key={i} className="mb-2 text-muted-foreground italic">{paragraph}</p>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Questions ({currentText.questions.length})
          </h3>
          {currentText.questions.map((question) => (
            <div key={question.id} className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <div className="mb-4">
                <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs font-medium mb-3">
                  {question.type}
                </span>
                <p className="font-medium text-foreground text-lg">{question.text}</p>
                {showTranslations && (
                  <p className="text-muted-foreground italic mt-2">{question.textTranslation}</p>
                )}
              </div>
              {renderQuestion(question)}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button
          onClick={() => setCurrentTextIndex(prev => Math.max(0, prev - 1))}
          disabled={currentTextIndex === 0}
          variant="outline"
        >
          Previous Text
        </Button>
        
        {currentTextIndex < texts.length - 1 ? (
          <Button
            onClick={() => setCurrentTextIndex(prev => prev + 1)}
            variant="default"
          >
            Next Text
          </Button>
        ) : (
          <Button
            onClick={handleTimeUp}
            variant="default"
          >
            Finish Test
          </Button>
        )}
      </div>
    </div>
  );
} 