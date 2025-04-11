import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight, Languages, Plus, Target, Trophy, Clock, BookText, Mic, Headphones, Pencil, Brain, List, FileText, BookMarked, GraduationCap } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useState } from "react";
import { moduleRegistryService } from '@/lib/learning/registry/module-registry.service';
import { ModuleCard } from '@/components/learning/module-card';
import { LanguageSwitcher } from '@/components/language-switcher';
import { getUser } from './actions'; // Import the server action
import { redirect } from 'next/navigation'; // Keep for redirection if needed
import { statisticsService, ModulePerformance } from '@/lib/learning/statistics/statistics.service'; // Import service and type
import { modalSchemaRegistryService } from '@/lib/learning/modals/registry.service'; // Import modal registry

interface LanguageModule {
  id: string;
  title: string;
  description: string;
  category: "grammar" | "vocabulary" | "practice" | "reading" | "listening" | "speaking" | "writing";
  difficulty: "beginner" | "intermediate" | "advanced";
  progress: number;
  estimatedTime: string;
  icon: React.ReactNode;
  color: string;
}

const mockModules: LanguageModule[] = [
  {
    id: "adj-declension",
    title: "Adjective Declension",
    description: "Master the rules of adjective declension in German",
    category: "grammar",
    difficulty: "intermediate",
    progress: 65,
    estimatedTime: "45 min",
    icon: <List className="h-5 w-5" />,
    color: "from-blue-500/10 to-blue-600/10"
  },
  {
    id: "verb-conjugation",
    title: "Verb Conjugation",
    description: "Learn regular and irregular verb conjugations",
    category: "grammar",
    difficulty: "beginner",
    progress: 80,
    estimatedTime: "30 min",
    icon: <FileText className="h-5 w-5" />,
    color: "from-purple-500/10 to-purple-600/10"
  },
  {
    id: "daily-vocab",
    title: "Daily Vocabulary",
    description: "Essential words and phrases for everyday conversation",
    category: "vocabulary",
    difficulty: "beginner",
    progress: 40,
    estimatedTime: "20 min",
    icon: <BookMarked className="h-5 w-5" />,
    color: "from-green-500/10 to-green-600/10"
  },
  {
    id: "pronunciation",
    title: "Pronunciation Practice",
    description: "Improve your accent and intonation",
    category: "speaking",
    difficulty: "intermediate",
    progress: 55,
    estimatedTime: "25 min",
    icon: <Mic className="h-5 w-5" />,
    color: "from-red-500/10 to-red-600/10"
  },
  {
    id: "reading-comprehension",
    title: "Reading Comprehension",
    description: "Practice reading and understanding texts",
    category: "reading",
    difficulty: "advanced",
    progress: 30,
    estimatedTime: "40 min",
    icon: <BookText className="h-5 w-5" />,
    color: "from-yellow-500/10 to-yellow-600/10"
  },
  {
    id: "listening-practice",
    title: "Listening Practice",
    description: "Train your ear with native speaker audio",
    category: "listening",
    difficulty: "intermediate",
    progress: 70,
    estimatedTime: "35 min",
    icon: <Headphones className="h-5 w-5" />,
    color: "from-indigo-500/10 to-indigo-600/10"
  },
  {
    id: "writing-exercises",
    title: "Writing Exercises",
    description: "Practice writing essays and formal letters",
    category: "writing",
    difficulty: "advanced",
    progress: 25,
    estimatedTime: "50 min",
    icon: <Pencil className="h-5 w-5" />,
    color: "from-pink-500/10 to-pink-600/10"
  },
  {
    id: "grammar-drills",
    title: "Grammar Drills",
    description: "Intensive practice of grammar rules",
    category: "grammar",
    difficulty: "advanced",
    progress: 45,
    estimatedTime: "60 min",
    icon: <Brain className="h-5 w-5" />,
    color: "from-orange-500/10 to-orange-600/10"
  }
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "beginner": return "text-green-500";
    case "intermediate": return "text-yellow-500";
    case "advanced": return "text-red-500";
    default: return "text-gray-500";
  }
};

export default async function LanguageSkillsPage() {
  // Initialize *both* registries reliably before use
  await Promise.all([
      moduleRegistryService.initialize(),
      modalSchemaRegistryService.initialize(), // Add modal registry initialization
  ]);
  console.log("Registries initialized for LanguageSkillsPage."); // Add log for confirmation

  const modules = moduleRegistryService.getAllModules();
  
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }
  console.log(`LanguageSkillsPage: User found - ${user.id}`);

  // Fetch performance data for all modules in parallel
  const performanceData: Record<string, ModulePerformance | null> = {}; // Allow null for error cases
  try {
      const performancePromises = modules.map(module => 
          statisticsService.getUserModulePerformance(user.id, module.id)
            .then(perf => ({ moduleId: module.id, performance: perf }))
            .catch(err => {
                console.error(`Failed to fetch performance for module ${module.id}:`, err);
                return { moduleId: module.id, performance: null }; // Handle errors gracefully
            })
      );
      const results = await Promise.all(performancePromises);
      results.forEach(result => {
          if (result.performance) {
              performanceData[result.moduleId] = result.performance;
          }
      });
  } catch (error) {
      console.error("Error fetching module performances:", error);
      // Handle overall fetch error if necessary
  }
  
  // Define languages (consider fetching user preferences later)
  const userLanguage = 'en'; 
  const targetLanguage = 'de';

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Language Skills</h1>
        <LanguageSwitcher />
      </div>
      <p className="text-muted-foreground">
        Explore available language modules and start learning!
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <ModuleCard 
            key={module.id}
            module={module}
            userLanguage={userLanguage}
            targetLanguage={targetLanguage}
            performance={performanceData[module.id] || null} 
          />
        ))}
      </div>
    </div>
  );
} 