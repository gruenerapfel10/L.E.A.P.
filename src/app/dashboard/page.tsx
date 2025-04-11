'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Cpu, Languages, ChevronRight, Flame, Trophy, Target, Clock, BookOpen, Plus, Mic, Headphones, BookText, Pencil, Calendar as CalendarIcon } from "lucide-react";
import { useTranslation } from 'react-i18next';
import Image from "next/image";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

interface LanguageSkill {
  name: string;
  overallLevel: number;
  lastPracticed: string;
  streak: number;
  totalHours: number;
  nextMilestone: string;
  achievements: number;
  flag: string;
  color: string;
  skills: {
    speaking: string;
    listening: string;
    reading: string;
    writing: string;
  };
}

const mockSkills: LanguageSkill[] = [
  {
    name: "Spanish",
    overallLevel: 75,
    lastPracticed: "2 hours ago",
    streak: 5,
    totalHours: 120,
    nextMilestone: "B2 Level",
    achievements: 8,
    flag: "🇪🇸",
    color: "from-yellow-500/10 to-red-500/10",
    skills: {
      speaking: "B1",
      listening: "B2",
      reading: "B2",
      writing: "B1"
    }
  },
  {
    name: "French",
    overallLevel: 45,
    lastPracticed: "1 day ago",
    streak: 3,
    totalHours: 60,
    nextMilestone: "A2 Level",
    achievements: 5,
    flag: "🇫🇷",
    color: "from-blue-500/10 to-white/10",
    skills: {
      speaking: "A2",
      listening: "A2",
      reading: "B1",
      writing: "A2"
    }
  },
  {
    name: "German",
    overallLevel: 30,
    lastPracticed: "3 days ago",
    streak: 0,
    totalHours: 30,
    nextMilestone: "A1 Level",
    achievements: 3,
    flag: "🇩🇪",
    color: "from-yellow-500/10 to-black/10",
    skills: {
      speaking: "A1",
      listening: "A1",
      reading: "A2",
      writing: "A1"
    }
  }
];

const getLevelColor = (level: string) => {
  switch (level) {
    case "A1": return "text-blue-500";
    case "A2": return "text-green-500";
    case "B1": return "text-yellow-500";
    case "B2": return "text-orange-500";
    case "C1": return "text-red-500";
    case "C2": return "text-purple-500";
    default: return "text-gray-500";
  }
};

interface ImportantDate {
  date: Date;
  title: string;
  language: string;
  type: "exam" | "milestone" | "practice";
  description: string;
}

const mockImportantDates: ImportantDate[] = [
  {
    date: new Date(2025, 5, 15), // June 15, 2025
    title: "DELE B2 Exam",
    language: "Spanish",
    type: "exam",
    description: "Spanish B2 level certification exam"
  },
  {
    date: new Date(2025, 6, 20), // July 20, 2025
    title: "DELF B1 Exam",
    language: "French",
    type: "exam",
    description: "French B1 level certification exam"
  },
  {
    date: new Date(2025, 7, 10), // August 10, 2025
    title: "Goethe-Zertifikat A2",
    language: "German",
    type: "exam",
    description: "German A2 level certification exam"
  }
];

export default function OverviewPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [showCalendar, setShowCalendar] = useState(false);
  
  useEffect(() => {
    const success = searchParams.get('success');
    const cancelled = searchParams.get('cancelled');

    if (success === 'true') {
      console.log('[DashboardPage] Subscription success detected, showing toast.');
      toast.success("Subscription Activated!", {
        description: "Thank you! Your plan is now active. Welcome to the enhanced experience.",
        duration: 5000, // Show for 5 seconds
      });
      // Optional: Clear the query parameters from the URL
      // window.history.replaceState(null, '', '/dashboard');
    }

    if (cancelled === 'true') {
      console.log('[DashboardPage] Subscription cancellation detected, showing info toast.');
      toast.info("Subscription Process Cancelled", {
        description: "You haven't been charged. Feel free to browse our plans again anytime.",
        duration: 5000,
      });
      // Optional: Clear the query parameters from the URL
      // window.history.replaceState(null, '', '/dashboard');
    }
  }, [searchParams]);

  // Get today's date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Sort dates and find the next exam
  const sortedDates = [...mockImportantDates].sort((a, b) => a.date.getTime() - b.date.getTime());
  const nextExam = sortedDates.find(date => {
    const examDate = new Date(date.date);
    examDate.setHours(0, 0, 0, 0);
    
    // Log the comparison details
    console.log('Date Comparison:', {
      today: today.toLocaleDateString(),
      examDate: examDate.toLocaleDateString(),
      todayTimestamp: today.getTime(),
      examTimestamp: examDate.getTime(),
      isAfter: examDate.getTime() >= today.getTime()
    });
    
    return examDate.getTime() >= today.getTime();
  });
  
  // Calculate days until next exam
  const daysUntilNextExam = nextExam 
    ? Math.ceil((nextExam.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  console.log('Next exam:', nextExam);
  console.log('Days until next exam:', daysUntilNextExam);

  return (
    <div className="space-y-8 h-full animate-fade-in">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Overview
          </h1>
          <p className="text-muted-foreground">
            Your language learning progress at a glance
          </p>
        </div>
      </div>

      {/* Language Selection Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Languages</h2>
          <Button className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity hover:scale-105 transform">
            <Plus className="mr-2 h-4 w-4" />
            Add Language
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockSkills.map((skill) => (
            <Card 
              key={skill.name} 
              className={`group hover:bg-accent/5 transition-all duration-300 hover:scale-105 transform bg-gradient-to-br ${skill.color} cursor-pointer`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{skill.flag}</span>
                    <div>
                      <h3 className="text-lg font-semibold">{skill.name}</h3>
                      <p className="text-sm text-muted-foreground">Overall Level {skill.overallLevel}%</p>
                    </div>
                  </div>
                  <BookOpen className="h-5 w-5 text-primary group-hover:rotate-12 transition-transform" />
                </div>
                <Progress value={skill.overallLevel} className="h-2 mb-6" />
                
                {/* Skills Breakdown */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 group-hover:scale-105 transition-transform">
                    <Mic className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Speaking</p>
                      <p className={`text-sm font-medium ${getLevelColor(skill.skills.speaking)}`}>
                        {skill.skills.speaking}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 group-hover:scale-105 transition-transform">
                    <Headphones className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Listening</p>
                      <p className={`text-sm font-medium ${getLevelColor(skill.skills.listening)}`}>
                        {skill.skills.listening}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 group-hover:scale-105 transition-transform">
                    <BookText className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Reading</p>
                      <p className={`text-sm font-medium ${getLevelColor(skill.skills.reading)}`}>
                        {skill.skills.reading}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 group-hover:scale-105 transition-transform">
                    <Pencil className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Writing</p>
                      <p className={`text-sm font-medium ${getLevelColor(skill.skills.writing)}`}>
                        {skill.skills.writing}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Calendar Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Upcoming Exams</h2>
        <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
          <CardContent className="p-6">
            {!showCalendar ? (
              // First page: Days until next exam
              <div className="flex flex-col items-center justify-center space-y-4">
                {nextExam ? (
                  <>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold mb-2">{nextExam.title}</h3>
                      <p className="text-muted-foreground">{nextExam.language}</p>
                    </div>
                    <div className="text-5xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                      {daysUntilNextExam}
                    </div>
                    <p className="text-sm text-muted-foreground">days until exam</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setShowCalendar(true)}
                    >
                      View Calendar
                    </Button>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-muted-foreground">No upcoming exams scheduled</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setShowCalendar(true)}
                    >
                      View Calendar
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              // Second page: Calendar view
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Exam Calendar</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowCalendar(false)}
                  >
                    Back
                  </Button>
                </div>
                <Calendar
                  mode="single"
                  selected={today}
                  className="rounded-md border"
                  modifiers={{
                    hasEvents: (date) => mockImportantDates.some(event => 
                      event.date.getDate() === date.getDate() &&
                      event.date.getMonth() === date.getMonth() &&
                      event.date.getFullYear() === date.getFullYear()
                    )
                  }}
                  modifiersClassNames={{
                    hasEvents: "bg-primary/10 text-primary hover:bg-primary/20"
                  }}
                />
                <div className="space-y-2">
                  {mockImportantDates.map((event, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${
                        event.type === "exam" ? "bg-red-500" : "bg-blue-500"
                      }`} />
                      <span className="font-medium">{event.title}</span>
                      <span className="text-muted-foreground">
                        ({format(event.date, "MMM d")})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Progress Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Overall Progress Card */}
          <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Overall Progress</h3>
                <Trophy className="h-5 w-5 text-yellow-500 animate-bounce" />
              </div>
              <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                50%
              </div>
              <p className="text-sm text-muted-foreground mb-4">Average proficiency across all languages</p>
              <Progress value={50} className="h-2" />
            </CardContent>
          </Card>

          {/* Streak Card */}
          <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Current Streak</h3>
                <Flame className="h-5 w-5 text-rose-500 animate-pulse" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                5 days
              </div>
              <p className="text-sm text-muted-foreground mt-1">Keep the streak going!</p>
            </CardContent>
          </Card>

          {/* Time Spent Card */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Total Time</h3>
                <Clock className="h-5 w-5 text-violet-500 animate-spin-slow" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-violet-500 bg-clip-text text-transparent">
                210h
              </div>
              <p className="text-sm text-muted-foreground mt-1">Across all languages</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}