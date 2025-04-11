'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModuleDefinition } from '@/lib/learning/types';
import { Book, Brain, Languages, PenTool } from "lucide-react";
import { ModulePerformance } from '@/lib/learning/statistics/statistics.service';
import { mapAccuracyToCEFR, getSkillLabel } from '@/lib/learning/utils/cefr-mapping';
import { BarChart2, CheckCircle, XCircle } from 'lucide-react';
import { InteractionTypeTag } from '@/lib/learning/modals/types';

interface ModuleCardProps {
  module: ModuleDefinition;
  userLanguage: string;
  targetLanguage: string;
  performance: ModulePerformance | null;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'adjective-declension.de': <PenTool className="h-6 w-6 text-indigo-500" />,
  'verb-conjugation': <Book className="h-6 w-6 text-emerald-500" />,
  'vocabulary': <Languages className="h-6 w-6 text-purple-500" />,
  'grammar': <Brain className="h-6 w-6 text-amber-500" />,
};

export function ModuleCard({ module, userLanguage, targetLanguage, performance }: ModuleCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Get the localized title or fall back to English
  const title = module.localization[userLanguage]?.title || module.title_en;
  
  // Get the icon for this module or fall back to default
  const icon = ICON_MAP[module.id] || <Languages className="h-6 w-6 text-gray-500" />;
  
  // Count the number of submodules
  const submoduleCount = module.submodules.length;
  
  // Get a list of supported schema IDs across all submodules (for potential future use, not displayed)
  const supportedSchemaIds = Array.from(
    new Set(module.submodules.flatMap(sub => sub.supportedModalSchemaIds || []))
  );
  
  // Calculate CEFR grades from performance data
  const overallGrade = mapAccuracyToCEFR(performance?.overall?.accuracy);
  const skillGrades = performance?.bySkill ? 
    Object.entries(performance.bySkill)
      // Filter out skills with no attempts
      .filter(([_, skillPerf]) => skillPerf.total > 0)
      .map(([skill, skillPerf]) => ({
          skill: skill as InteractionTypeTag,
          label: getSkillLabel(skill as InteractionTypeTag),
          grade: mapAccuracyToCEFR(skillPerf.accuracy)
      })) 
    : [];
  
  // Start a learning session with this module
  const startSession = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/learning/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: module.id,
          targetLanguage,
          sourceLanguage: userLanguage,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start session');
      }
      
      const data = await response.json();
      
      // Navigate to the learning session page with the session ID
      router.push(`/dashboard/language-skills/session/${data.sessionId}`);
    } catch (error) {
      console.error('Error starting session:', error);
      // Handle error (could show toast notification here)
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {icon}
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
        </div>
        {performance && overallGrade !== '-' && (
             <Badge variant="outline" className="mt-2 w-fit text-base px-3 py-1">
                 Overall: {overallGrade}
                 <span className="ml-2 text-xs text-muted-foreground">({performance.overall.accuracy}%)</span>
             </Badge>
        )}
      </CardHeader>
      
      <CardContent className="pb-4 flex-grow">
        <CardDescription className="mb-3">
          {submoduleCount} {submoduleCount === 1 ? 'submodule' : 'submodules'}
        </CardDescription>
        
        {skillGrades.length > 0 && (
             <div className="space-y-1">
                 <p className="text-xs font-medium text-muted-foreground mb-1">Skill Levels:</p>
                 <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {skillGrades.map(({ skill, label, grade }) => (
                        <Badge key={skill} variant="secondary" className="font-normal">
                            {label}: {grade}
            </Badge>
          ))}
        </div>
             </div>
         )}
         {performance && skillGrades.length === 0 && overallGrade === '-' && (
             <p className="text-xs text-muted-foreground italic">No performance data yet.</p>
         )}
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          variant="default" 
          onClick={startSession}
          disabled={isLoading}
        >
          {isLoading ? 'Starting...' : 'Start Learning'}
        </Button>
      </CardFooter>
    </Card>
  );
} 