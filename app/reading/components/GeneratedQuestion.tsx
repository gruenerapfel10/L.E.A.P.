"use client";

import React from 'react';
import type { Question } from '../lib/questionSchemas';

interface GeneratedQuestionProps {
  question: Question;
  onAnswer: (answer: string | string[]) => void;
}

export function GeneratedQuestion({ question, onAnswer }: GeneratedQuestionProps) {
  const renderQuestion = () => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium">{question.text}</p>
            <div className="space-y-2">
              {question.options.map((option, idx) => (
                <label key={idx} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    onChange={(e) => onAnswer(e.target.value)}
                    className="rounded-full"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'true-false':
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium">{question.text}</p>
            <div className="flex space-x-4">
              {['Richtig', 'Falsch', 'Nicht im Text'].map((option) => (
                <label key={option} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    onChange={(e) => onAnswer(e.target.value)}
                    className="rounded-full"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'matching':
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium">{question.text}</p>
            <div className="space-y-4">
              {question.pairs.map((pair, idx) => (
                <div key={idx} className="flex items-center space-x-4">
                  <span className="font-medium">{pair.statement}</span>
                  <select
                    onChange={(e) => {
                      const newAnswers = [...question.correctAnswer];
                      newAnswers[idx] = e.target.value;
                      onAnswer(newAnswers);
                    }}
                    className="rounded-md border p-2"
                  >
                    <option value="">Select match...</option>
                    {question.pairs.map((p) => (
                      <option key={p.match} value={p.match}>
                        {p.match}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        );

      case 'gap-fill':
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium">{question.text}</p>
            <div className="space-y-4">
              {question.gaps.map((gap, idx) => (
                <div key={idx} className="flex items-center space-x-4">
                  <select
                    onChange={(e) => {
                      const newAnswers = [...question.correctAnswer];
                      newAnswers[idx] = e.target.value;
                      onAnswer(newAnswers);
                    }}
                    className="rounded-md border p-2"
                  >
                    <option value="">Select answer...</option>
                    {gap.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return <p>Unsupported question type</p>;
    }
  };

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm">
      {renderQuestion()}
    </div>
  );
} 