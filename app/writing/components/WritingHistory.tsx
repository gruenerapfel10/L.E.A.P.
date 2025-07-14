"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Clock, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  Eye,
  Trash2,
  Award,
  Brain,
  Lightbulb,
  Filter
} from 'lucide-react';
import type { WritingHistory, WritingExercise, GrammarMistake } from '../lib/writingSchemas';
import { getWritingHistory, getWritingStatistics, getMistakeSummary, deleteWritingHistory } from '../lib/writingService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface WritingHistoryProps {}

export function WritingHistory({}: WritingHistoryProps) {
  const [history, setHistory] = useState<WritingHistory[]>([]);
  const [selectedTest, setSelectedTest] = useState<WritingHistory | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [activeMetric, setActiveMetric] = useState<'score' | 'grammar' | 'vocabulary' | 'wpm' | 'accuracy'>('score');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'score-high' | 'score-low'>('newest');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const writingHistory = getWritingHistory();
    setHistory(writingHistory);
  };

  const statistics = getWritingStatistics();
  const mistakeSummary = getMistakeSummary();

  const handleDeleteTest = (id: string) => {
    deleteWritingHistory(id);
    loadHistory();
    if (selectedTest?.id === id) {
      setSelectedTest(null);
    }
  };

  const filteredHistory = history
    .filter(entry => filterType === 'all' || entry.exercise.prompt.type === filterType)
    .sort((a, b) => {
      switch (sortOrder) {
        case 'newest': return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'oldest': return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'score-high': return b.score - a.score;
        case 'score-low': return a.score - b.score;
        default: return 0;
      }
    });

  const getChartData = () => {
    const data = filteredHistory.slice(0, 10).reverse(); // Last 10 tests, oldest to newest for chart
    return data.map((entry, index) => ({
      test: `Test ${index + 1}`,
      date: new Date(entry.date).toLocaleDateString(),
      score: entry.score || 0,
      grammar: Math.max(0, 100 - ((entry.grammarMistakeCount || 0) * 5)),
      vocabulary: entry.vocabularyScore || 0,
      wpm: entry.wordsPerMinute || 0,
      accuracy: entry.accuracyRate || 0
    }));
  };

  const getSkillDistribution = () => {
    const skills = statistics.strongestSkills;
    return Object.entries(skills).map(([skill, count]) => ({
      name: skill.replace(/([A-Z])/g, ' $1').trim(),
      value: count,
    }));
  };

  const getMistakeTypeData = () => {
    return Object.entries(mistakeSummary.grammarMistakes).map(([type, data]) => ({
      type: type.replace(/-/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
      count: data.count,
    })).sort((a, b) => b.count - a.count).slice(0, 8);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default' as const;
    if (score >= 80) return 'secondary' as const;
    if (score >= 70) return 'outline' as const;
    return 'destructive' as const;
  };

  if (history.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold mb-2">No Writing History Yet</h3>
        <p>Complete some writing exercises to see your progress and analytics here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exercises</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalExercises}</div>
            <p className="text-xs text-muted-foreground">
              {Object.keys(statistics.exercisesByType).length} different types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(statistics.averageScore)}`}>
              {statistics.averageScore}%
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.improvementRate > 0 ? '+' : ''}{statistics.improvementRate}% improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(statistics.totalTimeSpent)}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatTime(Math.round(statistics.totalTimeSpent / statistics.totalExercises))} per test
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grammar Accuracy</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((statistics.accuracyTrend.length > 0 ? statistics.accuracyTrend.reduce((a, b) => a + b, 0) / statistics.accuracyTrend.length : 0))}%
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.keys(mistakeSummary.grammarMistakes).length} mistake types tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">
            <TrendingUp className="w-4 h-4 mr-2" />
            Progress Trends
          </TabsTrigger>
          <TabsTrigger value="tests">
            <Eye className="w-4 h-4 mr-2" />
            Test History
          </TabsTrigger>
          <TabsTrigger value="mistakes">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Mistake Analysis
          </TabsTrigger>
          <TabsTrigger value="skills">
            <Award className="w-4 h-4 mr-2" />
            Skills Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>Track your progress over time</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={activeMetric} onValueChange={(value: any) => setActiveMetric(value)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score">Overall Score</SelectItem>
                      <SelectItem value="grammar">Grammar Score</SelectItem>
                      <SelectItem value="vocabulary">Vocabulary Score</SelectItem>
                      <SelectItem value="wpm">Words/Minute</SelectItem>
                      <SelectItem value="accuracy">Accuracy Rate</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                {chartType === 'line' ? (
                  <LineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="test" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey={activeMetric} 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="test" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey={activeMetric} fill="#8884d8" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Test History</CardTitle>
                  <CardDescription>View and analyze individual test results</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="argumentative-essay">Argumentative</SelectItem>
                      <SelectItem value="opinion-essay">Opinion</SelectItem>
                      <SelectItem value="formal-letter">Formal Letter</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="score-high">Highest Score</SelectItem>
                      <SelectItem value="score-low">Lowest Score</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {filteredHistory.map((entry) => (
                    <Card key={entry.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="capitalize">
                              {entry.exercise.prompt.type.replace('-', ' ')}
                            </Badge>
                            <Badge variant={getScoreBadgeVariant(entry.score)}>
                              {entry.score}%
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(entry.date).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <h4 className="font-medium mb-1">{entry.exercise.prompt.topic}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {entry.exercise.prompt.topicTranslation}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(entry.timeSpent)}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {entry.exercise.submission?.wordCount || 0} words
                            </span>
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {entry.grammarMistakeCount} mistakes
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {Math.round(entry.wordsPerMinute)} WPM
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedTest(entry)}>
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              {selectedTest && <TestDetailsDialog test={selectedTest} />}
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteTest(entry.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mistakes" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Grammar Mistake Types</CardTitle>
                <CardDescription>Most common grammar errors</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getMistakeTypeData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Mistake Analysis</CardTitle>
                <CardDescription>Patterns and improvements needed</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {Object.entries(mistakeSummary.grammarMistakes).map(([type, data]) => (
                      <div key={type} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium capitalize">
                            {type.replace(/-/g, ' ')}
                          </h4>
                          <Badge variant="secondary">{data.count} times</Badge>
                        </div>
                        {data.examples.length > 0 && (
                          <div className="text-sm space-y-1">
                            <div className="text-red-600 dark:text-red-400">
                              ❌ {data.examples[0].original}
                            </div>
                            <div className="text-green-600 dark:text-green-400">
                              ✅ {data.examples[0].corrected}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {data.examples[0].explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Vocabulary Improvements</CardTitle>
                <CardDescription>Words that need attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mistakeSummary.vocabularyMistakes.slice(0, 6).map((vocab, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-red-600 dark:text-red-400">
                          {vocab.word}
                        </span>
                        <Badge variant="outline">{vocab.count} times</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Context: {vocab.context}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        → {vocab.suggestion}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Strongest Skills</CardTitle>
                <CardDescription>Areas where you excel</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={getSkillDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getSkillDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Areas for Improvement</CardTitle>
                <CardDescription>Focus areas based on your weaknesses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mistakeSummary.commonWeaknesses.slice(0, 5).map((weakness) => (
                    <div key={weakness.skill} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          weakness.priority === 'high' ? 'bg-red-500' :
                          weakness.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <span className="font-medium">{weakness.skill}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{weakness.frequency} tests</Badge>
                        <Badge variant={
                          weakness.priority === 'high' ? 'destructive' :
                          weakness.priority === 'medium' ? 'default' : 'secondary'
                        }>
                          {weakness.priority} priority
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Improvement Recommendations</CardTitle>
              <CardDescription>Personalized suggestions based on your performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-medium text-blue-600 dark:text-blue-400">
                      Grammar Focus
                    </h4>
                  </div>
                  <p className="text-sm">
                    {Object.keys(mistakeSummary.grammarMistakes).length > 0 ? (
                      <>Practice {Object.keys(mistakeSummary.grammarMistakes)[0]?.replace(/-/g, ' ')} exercises. 
                      You've made this mistake {Object.values(mistakeSummary.grammarMistakes)[0]?.count || 0} times.</>
                    ) : (
                      'Complete more writing exercises to see detailed grammar feedback.'
                    )}
                  </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h4 className="font-medium text-green-600 dark:text-green-400">
                      Vocabulary Building
                    </h4>
                  </div>
                  <p className="text-sm">
                    {Object.keys(statistics.exercisesByType).length > 0 ? (
                      <>Focus on advanced vocabulary for {Object.keys(statistics.exercisesByType)[0]?.replace(/-/g, ' ')} 
                      writing. Your current vocabulary score: {Math.round(statistics.vocabularyTrend.slice(-1)[0] || 0)}%</>
                    ) : (
                      'Complete more writing exercises to see vocabulary improvement suggestions.'
                    )}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h4 className="font-medium text-purple-600 dark:text-purple-400">
                      Writing Speed
                    </h4>
                  </div>
                  <p className="text-sm">
                    {statistics.wpmTrend.length > 0 ? (
                      <>Current speed: {Math.round(statistics.wpmTrend.slice(-1)[0] || 0)} WPM. 
                      Target for C1: 35-45 WPM. Practice timed writing exercises.</>
                    ) : (
                      'Complete writing exercises to track your writing speed and get personalized targets.'
                    )}
                  </p>
                </div>

                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <h4 className="font-medium text-orange-600 dark:text-orange-400">
                      Overall Progress
                    </h4>
                  </div>
                  <p className="text-sm">
                    {statistics.improvementRate > 0 ? 
                      `Great job! You've improved by ${statistics.improvementRate}% recently.` :
                      'Focus on consistency. Regular practice will show improvement.'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TestDetailsDialog({ test }: { test: WritingHistory }) {
  const evaluation = test.exercise.evaluation;
  if (!evaluation) return <div>No evaluation data available</div>;

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>{test.exercise.prompt.topic}</DialogTitle>
        <DialogDescription>
          {test.exercise.prompt.topicTranslation} • {new Date(test.date).toLocaleDateString()}
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {test.score}%
          </div>
          <div className="text-sm text-muted-foreground">Overall Score</div>
        </div>
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {test.grammarMistakeCount}
          </div>
          <div className="text-sm text-muted-foreground">Grammar Mistakes</div>
        </div>
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {Math.round(test.wordsPerMinute)}
          </div>
          <div className="text-sm text-muted-foreground">Words/Minute</div>
        </div>
      </div>

      <Tabs defaultValue="essay" className="w-full">
        <TabsList>
          <TabsTrigger value="essay">Original Essay</TabsTrigger>
          <TabsTrigger value="feedback">Detailed Feedback</TabsTrigger>
          <TabsTrigger value="mistakes">Grammar Mistakes</TabsTrigger>
        </TabsList>

        <TabsContent value="essay">
          <Card>
            <CardContent className="pt-6">
              <div className="whitespace-pre-wrap text-sm leading-relaxed p-4 bg-muted rounded-lg">
                {test.exercise.submission?.content || 'No content available'}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Criteria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Task Fulfillment</span>
                      <Badge variant="outline">{evaluation.criteria.taskFulfillment}%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Coherence & Cohesion</span>
                      <Badge variant="outline">{evaluation.criteria.coherenceAndCohesion}%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Vocabulary & Language</span>
                      <Badge variant="outline">{evaluation.criteria.vocabularyAndLanguageRange}%</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Grammar & Accuracy</span>
                      <Badge variant="outline">{evaluation.criteria.grammarAndAccuracy}%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Style Appropriateness</span>
                      <Badge variant="outline">{evaluation.criteria.appropriatenessOfStyle}%</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600 dark:text-green-400">Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {evaluation.strengths.map((strength, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-amber-600 dark:text-amber-400">Areas for Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {evaluation.areasForImprovement.map((area, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mistakes">
          <Card>
            <CardHeader>
              <CardTitle>Grammar Mistakes</CardTitle>
              <CardDescription>{evaluation.grammarMistakes.length} mistakes found</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {evaluation.grammarMistakes.map((mistake, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="capitalize">
                        {mistake.type.replace(/-/g, ' ')}
                      </Badge>
                      <Badge variant={
                        mistake.severity === 'major' ? 'destructive' :
                        mistake.severity === 'moderate' ? 'default' : 'secondary'
                      }>
                        {mistake.severity}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="text-red-600 dark:text-red-400">
                        ❌ Original: {mistake.originalText}
                      </div>
                      <div className="text-green-600 dark:text-green-400">
                        ✅ Corrected: {mistake.correctedText}
                      </div>
                      <div className="text-muted-foreground">
                        💡 {mistake.explanation}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 