'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModuleDefinition } from '@/lib/learning/types';
import { ModuleConcept } from '@/lib/learning/registry/module-registry.service';
import { Book, Brain, Languages, PenTool } from "lucide-react";
import { ModulePerformance } from '@/lib/learning/statistics/statistics.service';
import { mapAccuracyToCEFR, getSkillLabel } from '@/lib/learning/utils/cefr-mapping';
import { BarChart2, CheckCircle, XCircle } from 'lucide-react';
import { InteractionTypeTag } from '@/lib/learning/modals/types';
import { toast } from 'sonner';

interface ModuleCardProps {
  moduleConcept: ModuleConcept;
  userLanguage: string;
  targetLanguage: string;
  performance: ModulePerformance | null;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'adjective-declension': <PenTool className="h-6 w-6 text-indigo-500" />,
  'verb-conjugation': <Book className="h-6 w-6 text-emerald-500" />,
  'vocabulary': <Languages className="h-6 w-6 text-purple-500" />,
  'grammar': <Brain className="h-6 w-6 text-amber-500" />,
};

export function ModuleCard({ moduleConcept, userLanguage, targetLanguage, performance }: ModuleCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Get the title (currently only English title is available in ModuleConcept)
  const title = moduleConcept.title_en;
  
  // Get the icon for this module
  const icon = ICON_MAP[moduleConcept.id] || <Languages className="h-6 w-6 text-gray-500" />;
  
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
    <Card 
      className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-card border border-border/40"
      onClick={startSession} 
      role="button" 
      tabIndex={0} 
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && startSession()}
    >
      <CardHeader className="flex flex-row items-start gap-4 pb-2">
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1">
          <CardTitle className="text-base font-semibold mb-1">{title}</CardTitle>
          {/* Optionally display supported target languages */}
          <CardDescription className="text-xs">
            Supports: {moduleConcept.supportedTargetLanguages.join(', ').toUpperCase()}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 pt-2">
        <div className="text-xs text-muted-foreground flex justify-between">
          <span>Overall Progress</span>
          <span>{overallGrade || '-'}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${performance?.overall?.accuracy ?? 0}%` }}
          ></div>
        </div>
        
        {skillGrades.length > 0 && (
          <div className="space-y-1 pt-2">
            <p className="text-xs font-medium text-muted-foreground">Skill Levels:</p>
                 <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {skillGrades.map(({ skill, label, grade }) => (
                <Badge key={skill} variant="secondary" className="text-xs font-normal">
                  {label}: {grade || '-'}
            </Badge>
          ))}
        </div>
             </div>
         )}
      </CardContent>
      <CardFooter className="mt-auto pt-3">
        <Button 
          variant="secondary" 
          size="sm" 
          className="w-full text-xs"
          disabled={isLoading}
        >
          {isLoading ? 'Starting...' : 'Start Learning'}
        </Button>
      </CardFooter>
    </Card>
  );
} 