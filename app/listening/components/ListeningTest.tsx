'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, AlertCircle, Play, Pause } from 'lucide-react';
import { AudioContent, ListeningSubmission, ListeningQuestion } from '../lib/listeningSchemas';
import { ListeningService } from '../lib/listeningService';
import AudioPlayer from './AudioPlayer';

interface ListeningTestProps {
  audioContent: AudioContent;
  voices: any[];
  onSubmit: (submission: ListeningSubmission) => void;
  onCancel?: () => void;
  timeLimit?: number; // in minutes
  showTranscript?: boolean;
}

export default function ListeningTest({ 
  audioContent, 
  voices, 
  onSubmit, 
  onCancel,
  timeLimit = 40,
  showTranscript = false
}: ListeningTestProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60); // Convert to seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());
  const [showResults, setShowResults] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [testStarted, setTestStarted] = useState(false);

  // Timer effect
  useEffect(() => {
    if (!testStarted) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    
    const submission: ListeningSubmission = {
      audio_id: audioContent.id,
      answers,
      time_taken_seconds: timeTaken,
      submitted_at: new Date().toISOString(),
    };
    
    onSubmit(submission);
  };

  const startTest = () => {
    setTestStarted(true);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    const percentage = (timeRemaining / (timeLimit * 60)) * 100;
    if (percentage > 50) return 'text-green-600 dark:text-green-400';
    if (percentage > 20) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = () => {
    const percentage = (timeRemaining / (timeLimit * 60)) * 100;
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const answeredQuestions = Object.keys(answers).filter(id => answers[id]?.trim()).length;
  const totalQuestions = audioContent.questions.length;
  const completionPercentage = (answeredQuestions / totalQuestions) * 100;

  const renderQuestion = (question: ListeningQuestion, index: number) => {
    const answer = answers[question.id] || '';
    
    return (
      <Card key={question.id} className="border-2 border-blue-100 dark:border-blue-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              Question {index + 1}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {question.type.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {question.points} pt{question.points > 1 ? 's' : ''}
              </Badge>
              {answer.trim() && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <p className="text-base leading-relaxed">{question.question}</p>
            
            {question.type === 'multiple_choice' && question.options && (
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={answer === option}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            )}
            
            {question.type === 'true_false' && (
              <div className="space-y-2">
                {['True', 'False'].map((option) => (
                  <label key={option} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={answer === option}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            )}
            
            {question.type === 'matching' && question.options && (
              <div className="space-y-2">
                <Select value={answer} onValueChange={(value) => handleAnswerChange(question.id, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your answer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {question.options.filter(option => option.trim() !== '').map((option, optionIndex) => (
                      <SelectItem key={optionIndex} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {question.type === 'short_answer' && (
              <Input
                type="text"
                value={answer}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Enter your answer..."
                className="w-full"
              />
            )}
            
            {question.type === 'gap_fill' && (
              <Input
                type="text"
                value={answer}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Fill in the blank..."
                className="w-full"
              />
            )}
            
            {question.type === 'summary' && (
              <Textarea
                value={answer}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Write your summary..."
                className="w-full min-h-[100px]"
              />
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Pre-test instructions
  if (!testStarted) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card className="border-2 border-blue-100 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {ListeningService.getTaskTypeIcon(audioContent.type)} Listening Comprehension Test
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{ListeningService.getTaskTypeDisplay(audioContent.type)}</Badge>
              <Badge variant="outline">{audioContent.duration_minutes} min audio</Badge>
              <Badge variant="outline">{totalQuestions} questions</Badge>
              <Badge variant="outline">{timeLimit} min limit</Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Test Instructions</h3>
              <ul className="space-y-2 text-sm">
                <li>• Listen to the audio carefully - you can replay it multiple times</li>
                <li>• Answer all {totalQuestions} questions based on what you hear</li>
                <li>• You have {timeLimit} minutes to complete the test</li>
                <li>• Use the audio controls to play, pause, and adjust speed</li>
                <li>• Review your answers before submitting</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">Audio Content Preview</h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold mb-2">{audioContent.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{audioContent.description}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span><strong>Topic:</strong> {audioContent.topic}</span>
                  <span>•</span>
                  <span><strong>Speakers:</strong> {audioContent.speakers.length}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Time limit: {timeLimit} minutes
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {onCancel && (
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button 
                  onClick={startTest}
                  className="px-8"
                  disabled={!audioReady}
                >
                  {audioReady ? 'Start Test' : 'Loading Audio...'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Audio Player for preview */}
        <AudioPlayer
          audioContent={audioContent}
          voices={voices}
          onAudioReady={() => setAudioReady(true)}
          showTranscript={false}
          autoGenerate={true}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Test Header */}
      <Card className="border-2 border-blue-100 dark:border-blue-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {audioContent.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{ListeningService.getTaskTypeDisplay(audioContent.type)}</Badge>
                <Badge variant="outline">{totalQuestions} questions</Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Progress */}
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">Progress</div>
                <div className="font-semibold">{answeredQuestions}/{totalQuestions}</div>
                <Progress value={completionPercentage} className="w-24 h-2 mt-1" />
              </div>
              
              {/* Timer */}
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">Time Remaining</div>
                <div className={`text-lg font-bold ${getTimeColor()}`}>
                  {formatTime(timeRemaining)}
                </div>
                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${getProgressColor()}`}
                    style={{ width: `${(timeRemaining / (timeLimit * 60)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audio Player */}
        <div className="space-y-4">
          <AudioPlayer
            audioContent={audioContent}
            voices={voices}
            showTranscript={showTranscript}
            autoGenerate={false}
          />
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Questions</h3>
            <div className="flex items-center gap-2">
              {timeRemaining < 300 && ( // 5 minutes warning
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {answeredQuestions} of {totalQuestions} answered
              </span>
            </div>
          </div>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {audioContent.questions.map((question, index) => 
              renderQuestion(question, index)
            )}
          </div>
          
          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {answeredQuestions < totalQuestions && (
                <span className="text-yellow-600 dark:text-yellow-400">
                  {totalQuestions - answeredQuestions} questions remaining
                </span>
              )}
              {answeredQuestions === totalQuestions && (
                <span className="text-green-600 dark:text-green-400">
                  All questions answered!
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
              )}
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || answeredQuestions === 0}
                className="px-8"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Test'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 