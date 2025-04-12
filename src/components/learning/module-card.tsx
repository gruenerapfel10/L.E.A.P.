'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModuleDefinition } from '@/lib/learning/types';
import { ModuleConcept } from '@/lib/learning/registry/module-registry.service';
import { Book, Brain, Languages, PenTool, Headphones, BookOpen, Mic, BookText, Pencil } from "lucide-react";
import { ModulePerformance } from '@/lib/learning/statistics/statistics.service';
import { mapAccuracyToCEFR, getSkillLabel } from '@/lib/learning/utils/cefr-mapping';
import { BarChart2, CheckCircle, XCircle } from 'lucide-react';
import { InteractionTypeTag } from '@/lib/learning/modals/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ModuleCardProps {
  moduleConcept: ModuleConcept;
  userLanguage: string;
  targetLanguage: string;
  performance: ModulePerformance | null;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'adjective-declension': <PenTool className="h-8 w-8 text-white" />,
  'verb-conjugation': <Book className="h-8 w-8 text-white" />,
  'vocabulary': <Languages className="h-8 w-8 text-white" />,
  'grammar': <Brain className="h-8 w-8 text-white" />,
};

const MODULE_THEMES: Record<string, { 
  label: string,
  description: string,
  accent: string,
  darkAccent: string,
  iconGradient: string,
}> = {
  'adjective-declension': {
    label: 'Adjective Forms',
    description: 'Master the art of adjective declension to express descriptions with precision',
    accent: 'bg-indigo-50/50 dark:bg-indigo-950/30',
    darkAccent: 'dark:border-indigo-500/20',
    iconGradient: 'from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500',
  },
  'verb-conjugation': {
    label: 'Verb Forms',
    description: 'Learn to conjugate verbs correctly across all tenses and moods',
    accent: 'bg-emerald-50/50 dark:bg-emerald-950/30',
    darkAccent: 'dark:border-emerald-500/20',
    iconGradient: 'from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500',
  },
  'vocabulary': {
    label: 'Vocabulary',
    description: 'Build your vocabulary with essential words and phrases',
    accent: 'bg-purple-50/50 dark:bg-purple-950/30',
    darkAccent: 'dark:border-purple-500/20',
    iconGradient: 'from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500',
  },
  'grammar': {
    label: 'Grammar',
    description: 'Understand core grammar concepts for natural language use',
    accent: 'bg-amber-50/50 dark:bg-amber-950/30',
    darkAccent: 'dark:border-amber-500/20',
    iconGradient: 'from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500',
  },
};

const SKILL_ICONS: Record<'speaking' | 'listening' | 'reading' | 'writing', React.ReactNode> = {
  speaking: (
    <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500">
      <Mic className="h-4 w-4 text-white" />
    </div>
  ),
  listening: (
    <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-green-600 dark:from-green-400 dark:to-green-500">
      <Headphones className="h-4 w-4 text-white" />
    </div>
  ),
  reading: (
    <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500">
      <BookText className="h-4 w-4 text-white" />
    </div>
  ),
  writing: (
    <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500">
      <Pencil className="h-4 w-4 text-white" />
    </div>
  ),
};

const getTrendIcon = (trend: number) => {
  if (trend > 0) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const getTrendColor = (trend: number) => {
  if (trend > 0) return 'bg-emerald-500/20';
  if (trend < 0) return 'bg-red-500/20';
  return 'bg-muted';
};

export function ModuleCard({ moduleConcept, userLanguage, targetLanguage, performance }: ModuleCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const theme = MODULE_THEMES[moduleConcept.id] || {
    label: 'Module',
    description: 'Learn essential language concepts',
    accent: 'bg-gray-50 dark:bg-gray-950/50',
    darkAccent: 'dark:border-gray-500/20',
    iconGradient: 'from-gray-500 to-gray-600 dark:from-gray-400 dark:to-gray-500',
  };

  // Get the title (currently only English title is available in ModuleConcept)
  const title = moduleConcept.title_en;
  
  // Get the icon for this module
  const icon = ICON_MAP[moduleConcept.id] || <Languages className="h-8 w-8 text-gray-500" />;
  
  // Get the number of supported target languages for display (optional)
  const supportedLangCount = moduleConcept.supportedTargetLanguages.length;
  
  // Calculate CEFR grades from performance data
  const overallGrade = mapAccuracyToCEFR(performance?.overall?.accuracy);
  const skillGrades = performance?.bySkill ? 
    Object.entries(performance.bySkill)
      .filter(([_, skillPerf]) => skillPerf.total > 0)
      .map(([skill, skillPerf]) => ({
          skill: skill as InteractionTypeTag,
          label: getSkillLabel(skill as InteractionTypeTag),
          grade: mapAccuracyToCEFR(skillPerf.accuracy)
      })) 
    : [];
  
  // Start a learning session with this module CONCEPT and selected TARGET language
  const startSession = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/learning/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: moduleConcept.id, // Send the conceptual ID
          targetLanguage, // Send the selected target language
          sourceLanguage: userLanguage,
        }),
      });
      
      if (!response.ok) {
        // Try to get error message from response body
        let errorMsg = 'Failed to start session';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) { /* Ignore JSON parsing error */ }
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      
      // Navigate to the learning session page with the session ID
      router.push(`/dashboard/language-skills/session/${data.sessionId}`);
    } catch (error: any) {
      console.error('Error starting session:', error);
      toast.error(error.message || 'Could not start learning session.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="relative group">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 overflow-hidden rounded-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB3aWR0aD0iMTUiIGhlaWdodD0iMTUiPjxyZWN0IHdpZHRoPSIxNSIgaGVpZ2h0PSIxNSIgZmlsbD0icmdiYSgwLDAsMCwwLjA1KSIvPjxjaXJjbGUgY3g9IjcuNSIgY3k9IjcuNSIgcj0iMiIgZmlsbD0icmdiYSgwLDAsMCwwLjE1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIvPjwvc3ZnPg==')] opacity-100 dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB3aWR0aD0iMTUiIGhlaWdodD0iMTUiPjxyZWN0IHdpZHRoPSIxNSIgaGVpZ2h0PSIxNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjxjaXJjbGUgY3g9IjcuNSIgY3k9IjcuNSIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjE1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIvPjwvc3ZnPg==')]" />
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl animate-blob mix-blend-overlay" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-2000 mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-3xl animate-blob animation-delay-4000 mix-blend-overlay" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl animate-blob animation-delay-6000 mix-blend-overlay" />
      </div>

      {/* Card Content */}
      <div className="relative z-10 bg-card/80 backdrop-blur-sm border border-ring/30 rounded-lg p-6 transition-all duration-300 hover:border-ring/50 hover:shadow-lg">
        <CardHeader className="pb-2 px-0">
          <div className="flex items-start gap-3">
            <div className={cn(
              "p-2 rounded-lg bg-white dark:bg-black/40 shadow-sm",
              "border border-ring/20",
              "bg-gradient-to-br",
              theme.iconGradient
            )}>
              {ICON_MAP[moduleConcept.id] || <Languages className="h-6 w-6 text-white" />}
            </div>
            <div className="space-y-0.5">
              <CardTitle className="text-base font-semibold tracking-tight">
                {theme.label}
              </CardTitle>
              <CardDescription className="text-xs leading-snug line-clamp-2">
                {theme.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-grow space-y-3 px-0">
          {/* Overall Level */}
          <div className={cn(
            "p-2 rounded-lg",
            "bg-white/30 dark:bg-black/10 border border-ring/20",
            "flex items-center justify-between"
          )}>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-medium text-muted-foreground">Overall Level</p>
                {getTrendIcon(performance?.overall?.trend ?? 0)}
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xl font-bold tracking-tight">{overallGrade || 'A0'}</p>
                <p className="text-xs text-muted-foreground">+{Math.round(performance?.overall?.trend ?? 0)}%</p>
              </div>
              <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    getTrendColor(performance?.overall?.trend ?? 0)
                  )}
                  style={{ width: `${Math.min(Math.abs(performance?.overall?.trend ?? 0), 100)}%` }}
                />
              </div>
            </div>
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-primary/80 dark:from-primary dark:to-primary/80">
              <Brain className="h-4 w-4 text-white" />
            </div>
          </div>

          {/* Skills Section */}
          <div className="space-y-2 px-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Skills</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                  isExpanded && "rotate-180"
                )} />
              </Button>
            </div>

            <div className={cn(
              "grid gap-2 transition-all duration-200",
              isExpanded ? "grid-cols-1" : "grid-cols-4"
            )}>
              {(['speaking', 'listening', 'reading', 'writing'] as const).map((skill) => {
                const skillData = skillGrades.find(g => g.skill === skill);
                const level = skillData?.grade || 'A0';
                const trend = performance?.bySkill?.[skill]?.trend ?? 0;
                
                return (
                  <div
                    key={skill}
                    className={cn(
                      "p-2 rounded-lg",
                      "bg-white/30 dark:bg-black/10 border border-ring/20",
                      "flex items-center justify-between",
                      !isExpanded && "flex-col items-center text-center"
                    )}
                  >
                    <div className={cn(
                      "flex items-center",
                      isExpanded ? "gap-2" : "flex-col gap-1"
                    )}>
                      {SKILL_ICONS[skill]}
                      <div className={cn(
                        "space-y-0.5",
                        !isExpanded && "items-center"
                      )}>
                        <div className={cn(
                          "flex items-center",
                          isExpanded ? "gap-1.5" : "flex-col gap-0.5"
                        )}>
                          <span className="text-xs font-medium text-muted-foreground capitalize">
                            {skill}
                          </span>
                          {getTrendIcon(trend)}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <p className="text-base font-semibold">{level}</p>
                          <p className="text-xs text-muted-foreground">+{Math.round(trend)}%</p>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="w-24 h-1 rounded-full bg-muted overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            getTrendColor(trend)
                          )}
                          style={{ width: `${Math.min(Math.abs(trend), 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">Progress to Next Level</span>
              <span className="text-xs text-muted-foreground">{Math.round(performance?.overall?.accuracy ?? 0)}%</span>
            </div>
            <div className="w-full bg-white/30 dark:bg-black/10 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500 bg-primary"
                style={{ width: `${performance?.overall?.accuracy ?? 0}%` }}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-2 px-0">
          <Button 
            variant="default" 
            size="sm"
            onClick={startSession}
            disabled={isLoading}
            className={cn(
              "w-full font-medium relative group/button",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "shadow-[0_1px_2px_rgba(0,0,0,0.15)]",
              "dark:shadow-[0_1px_2px_rgba(0,0,0,0.25)]",
              "transition-all duration-300",
              "hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]",
              "dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.25)]",
              "hover:translate-y-[-1px] active:translate-y-[0px]",
              "disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  Start Learning
                  <ChevronRight className="h-3 w-3 transition-transform group-hover/button:translate-x-0.5" />
                </>
              )}
            </span>
          </Button>
        </CardFooter>
      </div>
    </div>
  );
} 