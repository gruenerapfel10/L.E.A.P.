'use client';

import React, { useState, useEffect } from 'react';
import { useCompletion } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Play, RotateCcw, TrendingUp, Clock, Target, Headphones } from 'lucide-react';
import { 
  AudioContent, 
  Voice, 
  AudioTaskType, 
  ListeningSubmission, 
  ListeningEvaluation,
  ListeningHistoryEntry,
  ListeningStats
} from './lib/listeningSchemas';
import { ListeningService } from './lib/listeningService';
import AudioPlayer from './components/AudioPlayer';
import ListeningTest from './components/ListeningTest';

type ViewState = 'home' | 'generating' | 'test' | 'evaluating' | 'results';

export default function ListeningPage() {
  const [viewState, setViewState] = useState<ViewState>('home');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [audioContent, setAudioContent] = useState<AudioContent | null>(null);
  const [currentSubmission, setCurrentSubmission] = useState<ListeningSubmission | null>(null);
  const [currentEvaluation, setCurrentEvaluation] = useState<ListeningEvaluation | null>(null);
  const [history, setHistory] = useState<ListeningHistoryEntry[]>([]);
  const [stats, setStats] = useState<ListeningStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Generation settings
  const [selectedTaskType, setSelectedTaskType] = useState<AudioTaskType>('conversation');
  const [selectedTopic, setSelectedTopic] = useState<string>('random');
  const [duration, setDuration] = useState(3);
  const [numSpeakers, setNumSpeakers] = useState(2);

  // Audio generation completion
  const { 
    completion: audioCompletion, 
    isLoading: isGeneratingAudio, 
    error: audioError,
    complete: generateAudio 
  } = useCompletion({
    api: '/api/listening/generate-audio',
    onFinish: (prompt, completion) => {
      console.log('[Listening Page] Audio generation completed');
      console.log('[Listening Page] Completion length:', completion.length);
      if (completion.trim()) {
        parseAudioContent(completion);
      }
    },
    onError: (error) => {
      console.error('[Listening Page] Audio generation error:', error);
      setError('Failed to generate audio content. Please try again.');
      setViewState('home');
    }
  });

  // Evaluation completion
  const { 
    completion: evaluationCompletion, 
    isLoading: isEvaluating, 
    error: evaluationError,
    complete: evaluateSubmission 
  } = useCompletion({
    api: '/api/listening/evaluate',
    onFinish: (prompt, completion) => {
      console.log('[Listening Page] Evaluation completed');
      if (completion.trim()) {
        parseEvaluationResult(completion);
      }
    },
    onError: (error) => {
      console.error('[Listening Page] Evaluation error:', error);
      setError('Failed to evaluate submission. Please try again.');
      setViewState('home');
    }
  });

  // Load voices and data on mount
  useEffect(() => {
    loadVoices();
    loadHistoryAndStats();
  }, []);

  const loadVoices = async () => {
    try {
      // Try to get cached voices first
      const cachedVoices = ListeningService.getCachedVoices();
      if (cachedVoices) {
        setVoices(cachedVoices);
        setLoadingVoices(false);
        return;
      }

      // Fetch from API
      const response = await fetch('/api/listening/voices');
      if (!response.ok) {
        throw new Error('Failed to fetch voices');
      }
      
      const data = await response.json();
      setVoices(data.voices || []);
      
      // Cache the voices
      ListeningService.cacheVoices(data.voices || []);
      
    } catch (error) {
      console.error('Error loading voices:', error);
      setError('Failed to load voices. Some features may not work properly.');
    } finally {
      setLoadingVoices(false);
    }
  };

  const loadHistoryAndStats = () => {
    const historyData = ListeningService.getHistory();
    const statsData = ListeningService.getStats();
    setHistory(historyData);
    setStats(statsData);
  };

  const parseAudioContent = (completion: string) => {
    try {
      console.log('[Listening Page] Parsing audio content...');
      
      // Parse the structured response
      const lines = completion.split('\n');
      let currentSection = '';
      const sections: Record<string, string[]> = {};
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.includes(':') && !trimmedLine.startsWith(' ') && !trimmedLine.startsWith('-')) {
          const [key] = trimmedLine.split(':');
          currentSection = key.trim();
          sections[currentSection] = [];
        } else if (currentSection && trimmedLine) {
          sections[currentSection].push(trimmedLine);
        }
      }
      
      // Extract basic information
      const title = sections['TITLE']?.[0] || 'Listening Exercise';
      const type = sections['TYPE']?.[0] || selectedTaskType;
      const topic = sections['TOPIC']?.[0] || selectedTopic;
      const transcriptDe = sections['TRANSCRIPT_DE']?.join('\n') || '';
      const transcriptEn = sections['TRANSCRIPT_EN']?.join('\n') || '';
      
      // Fallback: If transcripts are empty, generate a sample transcript
      const finalTranscriptDe = transcriptDe || generateSampleTranscript(topic, type, 'de');
      const finalTranscriptEn = transcriptEn || generateSampleTranscript(topic, type, 'en');
      
      // Parse questions
      const questions = parseQuestions(completion);
      
      // Generate speakers
      const speakers = generateSpeakers(numSpeakers, voices);
      
      const audioContentData: AudioContent = {
        id: ListeningService.generateId(),
        type: type as AudioTaskType,
        title,
        description: sections['CONTENT_STRUCTURE']?.[0] || `A ${type} about ${topic}`,
        topic,
        difficulty_level: 'C1',
        duration_minutes: duration,
        transcript_de: finalTranscriptDe,
        transcript_en: finalTranscriptEn,
        speakers,
        questions,
      };
      
      console.log('[Listening Page] Parsed audio content:', audioContentData);
      setAudioContent(audioContentData);
      setViewState('test');
      
    } catch (error) {
      console.error('[Listening Page] Error parsing audio content:', error);
      setError('Failed to parse generated content. Please try again.');
      setViewState('home');
    }
  };

  const parseQuestions = (completion: string): any[] => {
    const questions = [];
    const lines = completion.split('\n');
    let currentQuestion: any = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.match(/^Q\d+:/)) {
        // Save previous question
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        
        // Start new question
        currentQuestion = {
          id: ListeningService.generateId(),
          question: trimmedLine.replace(/^Q\d+:\s*/, ''),
          type: 'multiple_choice',
          options: [],
          correct_answer: '',
          explanation: '',
          points: 1,
        };
      } else if (currentQuestion) {
        if (trimmedLine.startsWith('TYPE:')) {
          currentQuestion.type = trimmedLine.replace('TYPE:', '').trim();
        } else if (trimmedLine.startsWith('OPTIONS:')) {
          const optionsText = trimmedLine.replace('OPTIONS:', '').trim();
          currentQuestion.options = optionsText.split(/[A-D]\)\s*/).filter(Boolean).filter(option => option.trim() !== '');
        } else if (trimmedLine.startsWith('ANSWER:')) {
          currentQuestion.correct_answer = trimmedLine.replace('ANSWER:', '').trim();
        } else if (trimmedLine.startsWith('EXPLANATION:')) {
          currentQuestion.explanation = trimmedLine.replace('EXPLANATION:', '').trim();
        } else if (trimmedLine.startsWith('POINTS:')) {
          currentQuestion.points = parseInt(trimmedLine.replace('POINTS:', '').trim()) || 1;
        }
      }
    }
    
    // Add the last question
    if (currentQuestion) {
      questions.push(currentQuestion);
    }
    
    // Generate default questions if none found
    if (questions.length === 0) {
      return generateDefaultQuestions();
    }
    
    return questions;
  };

  const generateDefaultQuestions = () => {
    return [
      {
        id: ListeningService.generateId(),
        type: 'multiple_choice',
        question: 'What is the main topic of this audio?',
        options: ['Technology', 'Education', 'Environment', 'Culture'],
        correct_answer: 'Technology',
        explanation: 'The main topic discussed throughout the audio.',
        points: 2,
      },
      {
        id: ListeningService.generateId(),
        type: 'short_answer',
        question: 'What is the speaker\'s main argument?',
        options: [],
        correct_answer: 'Sample answer',
        explanation: 'The speaker\'s primary point or argument.',
        points: 3,
      },
      {
        id: ListeningService.generateId(),
        type: 'true_false',
        question: 'The speaker supports the use of new technology.',
        options: ['True', 'False'],
        correct_answer: 'True',
        explanation: 'Based on the speaker\'s tone and statements.',
        points: 1,
      },
    ];
  };

  const generateSpeakers = (count: number, availableVoices: Voice[]) => {
    const speakers = [];
    const germanVoices = availableVoices.filter(v => v.language === 'de');
    const voicesToUse = germanVoices.length > 0 ? germanVoices : availableVoices;
    
    for (let i = 0; i < count; i++) {
      const voice = voicesToUse[i % voicesToUse.length];
      speakers.push({
        name: `Speaker ${i + 1}`,
        role: i === 0 ? 'Host' : 'Guest',
        voice_id: voice?.voice_id || 'default',
      });
    }
    
    return speakers;
  };

  const generateSampleTranscript = (topic: string, type: string, language: 'de' | 'en') => {
    const sampleTranscripts = {
      de: {
        conversation: `Sprecher 1: Guten Tag! Schön, dass Sie Zeit für unser Gespräch haben. Ich wollte mit Ihnen über ${topic} sprechen - das ist ja momentan ein sehr aktuelles Thema.

Sprecher 2: Ja, das stimmt. Ich beschäftige mich schon seit Jahren damit und muss sagen, die Entwicklungen der letzten Zeit sind wirklich bemerkenswert. Was interessiert Sie denn besonders daran?

Sprecher 1: Nun, mich fasziniert vor allem die gesellschaftliche Dimension. Wie sehen Sie denn die Auswirkungen auf unseren Alltag? Ich meine, man merkt ja schon jetzt deutliche Veränderungen.

Sprecher 2: Absolut. Das ist auch das, was mich am meisten beschäftigt. Einerseits bieten sich dadurch völlig neue Möglichkeiten - denken Sie nur an die Effizienzsteigerungen und die Vereinfachungen in vielen Bereichen. Andererseits entstehen aber auch neue Herausforderungen.

Sprecher 1: Können Sie das konkretisieren? Welche Herausforderungen meinen Sie?

Sprecher 2: Nun, da wäre zum Beispiel die Frage der Gerechtigkeit. Nicht alle haben gleichen Zugang zu diesen Entwicklungen. Und dann ist da noch die Frage der Nachhaltigkeit - das wird oft übersehen.

Sprecher 1: Das ist ein wichtiger Punkt. Wie könnte man Ihrer Meinung nach diese Probleme angehen?

Sprecher 2: Ich denke, es braucht eine gesamtgesellschaftliche Diskussion. Politik, Wirtschaft und Zivilgesellschaft müssen zusammenarbeiten. Nur so können wir sicherstellen, dass die Vorteile allen zugutekommen.

Sprecher 1: Sehen Sie denn konkrete Ansätze, die vielversprechend sind?

Sprecher 2: Ja, durchaus. Es gibt bereits einige interessante Initiativen. Besonders in den skandinavischen Ländern wird viel experimentiert. Aber auch hier in Deutschland tut sich einiges - wenn auch manchmal etwas langsamer.`,
        
        lecture: `Guten Tag, meine Damen und Herren. Herzlich willkommen zu unserem heutigen Vortrag über ${topic}. Mein Name ist Professor Schmidt, und ich beschäftige mich seit über zwanzig Jahren mit diesem faszinierenden Thema.

Zunächst möchte ich Ihnen einen Überblick über die historische Entwicklung geben. Die Anfänge reichen zurück bis ins 19. Jahrhundert, als die ersten theoretischen Grundlagen gelegt wurden. Damals konnte man noch nicht ahnen, welche revolutionären Veränderungen auf uns zukommen würden.

In den letzten beiden Jahrzehnten hat sich die Situation dramatisch verändert. Was früher als reine Theorie galt, ist heute praktische Realität geworden. Die Auswirkungen sind in allen Bereichen unseres Lebens spürbar - von der Wirtschaft über die Bildung bis hin zu unserem privaten Alltag.

Besonders bemerkenswert sind die jüngsten Forschungsergebnisse aus Skandinavien. Dort hat man festgestellt, dass die Entwicklung noch schneller voranschreitet als ursprünglich prognostiziert. Die Implikationen für unsere Gesellschaft sind enorm.

Lassen Sie mich Ihnen einige konkrete Beispiele nennen. In Finnland hat man bereits vor fünf Jahren begonnen, systematisch neue Ansätze zu erproben. Die Ergebnisse sind durchweg positiv. Ähnliche Projekte laufen inzwischen auch in Deutschland, Österreich und der Schweiz.

Natürlich gibt es auch kritische Stimmen. Einige Experten warnen vor unvorhersehbaren Nebenwirkungen. Diese Bedenken sind durchaus berechtigt und müssen ernst genommen werden. Dennoch überwiegen meiner Ansicht nach die Vorteile deutlich.

Zum Abschluss möchte ich noch einen Blick in die Zukunft werfen. Die nächsten zehn Jahre werden entscheidend sein. Wir stehen vor historischen Weichenstellungen, die das Leben künftiger Generationen maßgeblich prägen werden.`,
        
        interview: `Interviewer: Herzlich willkommen zu unserem Gespräch über ${topic}. Ich freue mich sehr, dass Sie sich die Zeit genommen haben. Können Sie uns zunächst Ihre Perspektive zu diesem aktuellen Thema erläutern?

Experte: Vielen Dank für die Einladung. Aus meiner Sicht ist ${topic} ein außerordentlich komplexes Thema, das verschiedene gesellschaftliche Ebenen betrifft. Wir müssen sowohl die positiven Entwicklungen als auch die kritischen Aspekte betrachten.

Interviewer: Das ist ein sehr wichtiger Punkt. Welche konkreten Herausforderungen sehen Sie denn in der aktuellen Situation?

Experte: Die größte Herausforderung liegt meiner Meinung nach in der Balance zwischen Innovation und bewährten Strukturen. Wir dürfen nicht vergessen, dass Veränderungen Zeit brauchen und nicht alle Menschen gleich schnell mitgehen können.

Interviewer: Sie sprechen einen wichtigen Aspekt an. Wie bewerten Sie denn die bisherigen Maßnahmen der Politik?

Experte: Nun, es ist ein schwieriger Balanceakt. Einerseits muss die Politik handlungsfähig bleiben, andererseits sollte sie die Bürger nicht überfordern. Ich sehe durchaus positive Ansätze, aber es gibt auch noch viel Verbesserungspotential.

Interviewer: Können Sie uns ein konkretes Beispiel nennen?

Experte: Gerne. Schauen Sie sich die Situation in den Niederlanden an. Dort hat man sehr früh begonnen, alle Beteiligten in den Prozess einzubeziehen. Das Ergebnis ist eine viel breitere gesellschaftliche Akzeptanz.

Interviewer: Das klingt vielversprechend. Welche Rolle spielen Ihrer Meinung nach die Medien in diesem Prozess?

Experte: Die Medien haben eine enorme Verantwortung. Sie können sowohl zur Aufklärung beitragen als auch Ängste schüren. Leider dominiert oft die Sensation über die sachliche Information.

Interviewer: Zum Abschluss noch eine Frage: Wie sehen Sie die Entwicklung in den nächsten Jahren?

Experte: Ich bin grundsätzlich optimistisch. Die Herausforderungen sind groß, aber wir haben auch die Mittel, sie zu bewältigen. Wichtig ist, dass wir alle an einem Strang ziehen.`,
        
        podcast: `Host: Willkommen zu unserem Podcast! Heute sprechen wir über ${topic}. Ein Thema, das uns alle betrifft. Ich bin gespannt auf eure Meinungen dazu. Was denkst du denn darüber?
Gast: Also, ich finde das Thema super interessant. Es hat mich schon lange beschäftigt. Besonders die praktischen Auswirkungen auf den Alltag finde ich faszinierend.
Host: Ja, das kann ich gut verstehen. Hast du konkrete Beispiele?
Gast: Auf jeden Fall! Ich merke das täglich in meinem Beruf.`,
        
        panel_discussion: `Moderator: Herzlich willkommen zu unserer Diskussionsrunde über ${topic}. Wir haben heute drei Experten zu Gast. Herr Schmidt, wie bewerten Sie die aktuelle Situation?
Herr Schmidt: Ich sehe sowohl Chancen als auch Risiken. Wir müssen differenziert betrachten.
Frau Müller: Ich stimme zu, aber ich würde noch einen Schritt weiter gehen. Die gesellschaftlichen Auswirkungen sind enormer als wir denken.
Herr Weber: Da bin ich anderer Meinung. Die Vorteile überwiegen eindeutig.`
      },
      en: {
        conversation: `Speaker 1: Hello! How are you doing today?
Speaker 2: Thank you, very well! I just read an interesting article about ${topic}.
Speaker 1: Oh really? That sounds fascinating. Tell me more about it!
Speaker 2: It was about the latest developments in this field. I found the impact on our society particularly fascinating.
Speaker 1: That's really an important topic. How do you see the future?
Speaker 2: I'm optimistic, but we also need to consider the challenges.`,
        
        lecture: `Good day, ladies and gentlemen. Today I would like to talk to you about ${topic}. This topic is of great importance for our modern society. First, let's look at the historical foundations. The development began several decades ago. Today we see the effects in various areas of our lives. The latest research results are particularly interesting, showing that the situation will change significantly in the coming years.`,
        
        interview: `Interviewer: Welcome to our conversation about ${topic}. Can you first explain your perspective on this topic?
Expert: Thank you for the invitation. From my point of view, ${topic} is a very complex topic that encompasses various aspects. We need to consider both the positive and negative impacts.
Interviewer: That's an interesting point. What challenges do you see specifically?
Expert: In my opinion, the biggest challenge lies in the balance between innovation and tradition.`,
        
        podcast: `Host: Welcome to our podcast! Today we're talking about ${topic}. A topic that affects us all. I'm excited to hear your opinions on it. What do you think about it?
Guest: Well, I find the topic super interesting. It has occupied me for a long time. I find the practical effects on everyday life particularly fascinating.
Host: Yes, I can understand that well. Do you have concrete examples?
Guest: Absolutely! I notice this daily in my work.`,
        
        panel_discussion: `Moderator: Welcome to our discussion round about ${topic}. We have three experts with us today. Mr. Schmidt, how do you assess the current situation?
Mr. Schmidt: I see both opportunities and risks. We need to consider this differentially.
Mrs. Müller: I agree, but I would go one step further. The societal impacts are greater than we think.
Mr. Weber: I disagree. The advantages clearly outweigh the disadvantages.`
      }
    };
    
    const typeKey = type as keyof typeof sampleTranscripts.de;
    return sampleTranscripts[language][typeKey] || sampleTranscripts[language].conversation;
  };

  const parseEvaluationResult = (completion: string) => {
    try {
      console.log('[Listening Page] Parsing evaluation result...');
      
      if (!currentSubmission || !audioContent) return;
      
      // Calculate basic metrics
      const totalQuestions = audioContent.questions.length;
      let correctAnswers = 0;
      
      const detailedFeedback = audioContent.questions.map(question => {
        const userAnswer = currentSubmission.answers[question.id] || '';
        const isCorrect = userAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
        if (isCorrect) correctAnswers++;
        
        return {
          question_id: question.id,
          question: question.question,
          user_answer: userAnswer,
          correct_answer: question.correct_answer,
          is_correct: isCorrect,
          explanation: question.explanation || '',
        };
      });
      
      const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);
      
      // Parse AI feedback
      const sections = completion.split('\n\n');
      const overallFeedback = sections.find(s => s.includes('OVERALL_FEEDBACK:'))?.replace('OVERALL_FEEDBACK:', '').trim() || 'Good effort on this listening exercise.';
      const strengths = parseListSection(completion, 'STRENGTHS:');
      const improvements = parseListSection(completion, 'AREAS_FOR_IMPROVEMENT:');
      
      const evaluation: ListeningEvaluation = {
        audio_id: audioContent.id,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        score_percentage: scorePercentage,
        time_taken_seconds: currentSubmission.time_taken_seconds,
        detailed_feedback: detailedFeedback,
        overall_feedback: overallFeedback,
        strengths,
        areas_for_improvement: improvements,
        evaluated_at: new Date().toISOString(),
      };
      
      // Save to history
      const historyEntry: ListeningHistoryEntry = {
        id: ListeningService.generateId(),
        audio_content: audioContent,
        submission: currentSubmission,
        evaluation,
        created_at: new Date().toISOString(),
      };
      
      ListeningService.saveHistoryEntry(historyEntry);
      
      setCurrentEvaluation(evaluation);
      setViewState('results');
      
      // Refresh history and stats
      loadHistoryAndStats();
      
    } catch (error) {
      console.error('[Listening Page] Error parsing evaluation:', error);
      setError('Failed to parse evaluation results.');
      setViewState('home');
    }
  };

  const parseListSection = (text: string, sectionName: string): string[] => {
    const lines = text.split('\n');
    const sectionIndex = lines.findIndex(line => line.includes(sectionName));
    if (sectionIndex === -1) return [];
    
    const items = [];
    for (let i = sectionIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('-') || line.startsWith('•')) {
        items.push(line.replace(/^[-•]\s*/, ''));
      } else if (line.includes(':') && !line.startsWith(' ')) {
        break; // Next section
      }
    }
    
    return items;
  };

  const handleStartNewTest = () => {
    setError(null);
    setViewState('generating');
    
    const prompt = {
      type: selectedTaskType,
      topic: selectedTopic === 'random' || !selectedTopic ? ListeningService.getRandomTopic(selectedTaskType) : selectedTopic,
      difficulty: 'C1',
      duration_minutes: duration,
      num_speakers: numSpeakers,
      include_questions: true,
      question_types: ['multiple_choice', 'short_answer', 'true_false'],
    };
    
    console.log('[Listening Page] Starting audio generation with prompt:', prompt);
    generateAudio('', { body: prompt });
  };

  const handleSubmitTest = (submission: ListeningSubmission) => {
    setCurrentSubmission(submission);
    setViewState('evaluating');
    
    const evaluationData = {
      audio_content: audioContent,
      submission,
    };
    
    console.log('[Listening Page] Starting evaluation with data:', evaluationData);
    evaluateSubmission('', { body: evaluationData });
  };

  const handleBackToHome = () => {
    setViewState('home');
    setAudioContent(null);
    setCurrentSubmission(null);
    setCurrentEvaluation(null);
    setError(null);
    loadHistoryAndStats();
  };

  const taskTypes: AudioTaskType[] = ['lecture', 'panel_discussion', 'interview', 'podcast', 'conversation', 'news_report'];

  // Loading states
  if (loadingVoices) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading voices...</p>
        </div>
      </div>
    );
  }

  // Generation view
  if (viewState === 'generating') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-2 border-blue-100 dark:border-blue-900">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
              <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                Generating Audio Content
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Creating a {ListeningService.getTaskTypeDisplay(selectedTaskType).toLowerCase()} 
                {selectedTopic && ` about ${selectedTopic}`}...
              </p>
              <div className="text-sm text-gray-500">
                This may take a few moments
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Test view
  if (viewState === 'test' && audioContent) {
    return (
      <ListeningTest
        audioContent={audioContent}
        voices={voices}
        onSubmit={handleSubmitTest}
        onCancel={handleBackToHome}
        timeLimit={40}
        showTranscript={false}
      />
    );
  }

  // Evaluation view
  if (viewState === 'evaluating') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-2 border-blue-100 dark:border-blue-900">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
              <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                Evaluating Your Performance
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Analyzing your answers and generating detailed feedback...
              </p>
              <div className="text-sm text-gray-500">
                This may take a few moments
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results view
  if (viewState === 'results' && currentEvaluation) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card className="border-2 border-green-100 dark:border-green-900">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {currentEvaluation.score_percentage}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {currentEvaluation.correct_answers}/{currentEvaluation.total_questions}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Correct</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {ListeningService.formatTime(currentEvaluation.time_taken_seconds)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Time</div>
              </div>
            </div>

            {/* Feedback */}
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold mb-2">Overall Feedback</h3>
                <p className="text-sm">{currentEvaluation.overall_feedback}</p>
              </div>

              {currentEvaluation.strengths.length > 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h3 className="font-semibold mb-2 text-green-600 dark:text-green-400">Strengths</h3>
                  <ul className="text-sm space-y-1">
                    {currentEvaluation.strengths.map((strength, index) => (
                      <li key={index}>• {strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {currentEvaluation.areas_for_improvement.length > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h3 className="font-semibold mb-2 text-yellow-600 dark:text-yellow-400">Areas for Improvement</h3>
                  <ul className="text-sm space-y-1">
                    {currentEvaluation.areas_for_improvement.map((area, index) => (
                      <li key={index}>• {area}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleBackToHome}>
                Back to Home
              </Button>
              <Button onClick={handleStartNewTest}>
                Take Another Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Home view
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">
          🎧 Listening Practice
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          German C1 Listening Comprehension with AI-Generated Audio
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-2 border-red-100 dark:border-red-900">
          <CardContent className="p-4">
            <div className="text-red-600 dark:text-red-400">{error}</div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Configuration */}
        <Card className="border-2 border-blue-100 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-blue-600 dark:text-blue-400">
              Start New Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Audio Type</label>
              <Select value={selectedTaskType} onValueChange={(value) => setSelectedTaskType(value as AudioTaskType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taskTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {ListeningService.getTaskTypeIcon(type)} {ListeningService.getTaskTypeDisplay(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Topic (Optional)</label>
                             <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                 <SelectTrigger>
                   <SelectValue placeholder="Random topic" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="random">Random topic</SelectItem>
                  {ListeningService.getTopicsForTaskType(selectedTaskType).map(topic => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Duration</label>
                <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                                       <SelectItem value="2">2 minutes</SelectItem>
                   <SelectItem value="3">3 minutes</SelectItem>
                   <SelectItem value="4">4 minutes</SelectItem>
                   <SelectItem value="5">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Speakers</label>
                <Select value={numSpeakers.toString()} onValueChange={(value) => setNumSpeakers(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Speaker</SelectItem>
                    <SelectItem value="2">2 Speakers</SelectItem>
                    <SelectItem value="3">3 Speakers</SelectItem>
                    <SelectItem value="4">4 Speakers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleStartNewTest} 
              className="w-full"
              disabled={isGeneratingAudio || voices.length === 0}
            >
              {isGeneratingAudio ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Listening Test
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="border-2 border-green-100 dark:border-green-900">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-green-600 dark:text-green-400">
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.total_tests > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.total_tests}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tests</div>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Math.round(stats.average_score)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Average</div>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.best_score}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Best</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {ListeningService.formatDuration(stats.total_time_minutes)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Time</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Headphones className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No tests completed yet. Start your first listening test!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent History */}
      {history.length > 0 && (
        <Card className="border-2 border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Recent Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">
                      {ListeningService.getTaskTypeIcon(entry.audio_content.type)}
                    </div>
                    <div>
                      <div className="font-medium">{entry.audio_content.title}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {entry.audio_content.topic}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${ListeningService.getScoreColor(entry.evaluation.score_percentage)}`}>
                      {entry.evaluation.score_percentage}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 