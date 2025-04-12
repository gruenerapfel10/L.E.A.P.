'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight, Languages, Plus, Target, Trophy, Clock, BookText, Mic, Headphones, Pencil, Brain, List, FileText, BookMarked, GraduationCap, Filter, Sparkles, Info } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from "react";
import { ModuleConcept } from '@/lib/learning/registry/module-registry.service';
import { ModuleCard } from '@/components/learning/module-card';
import { ModuleCardSkeleton } from '@/components/learning/module-card-skeleton';
import { ModulePerformance } from '@/lib/learning/statistics/statistics.service';
import { createClient } from '@/lib/supabase/client';
import { TargetLanguageSelector } from '@/components/learning/target-language-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import 'flag-icons/css/flag-icons.min.css';
import { getFlagGradient, getFlagIconClass, getDifficultyColor } from '@/lib/languages';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const languageNames: Record<string, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  ja: '日本語',
  pt: 'Português'
};

// Create Supabase client instance once for client-side operations
const supabase = createClient();

export default function LanguageSkillsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingConcepts, setIsFetchingConcepts] = useState(false);
  const [isFetchingPerformance, setIsFetchingPerformance] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('de');
  const [userLanguage, setUserLanguage] = useState('en');
  const [user, setUser] = useState<User | null>(null);
  const [supportedConcepts, setSupportedConcepts] = useState<ModuleConcept[]>([]);
  const [performanceData, setPerformanceData] = useState<Record<string, ModulePerformance | null>>({});

  const fetchSupportedConcepts = useCallback(async (lang: string) => {
    if (!lang) return;
    setIsFetchingConcepts(true);
    try {
      const response = await fetch(`/api/language-skills/concepts?targetLanguage=${lang}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch concepts: ${response.statusText}`);
      }
      const concepts: ModuleConcept[] = await response.json();
      setSupportedConcepts(concepts);
    } catch (error: any) {
      console.error("Error fetching concepts:", error);
      toast.error(error.message || "Could not load language modules.");
      setSupportedConcepts([]); // Clear concepts on error
    } finally {
      setIsFetchingConcepts(false);
    }
  }, []);

  const fetchPerformanceData = useCallback(async (concepts: ModuleConcept[]) => {
    if (!user || concepts.length === 0) {
        // Clear performance data if no concepts or no user
        setPerformanceData({});
        return;
    }
    setIsFetchingPerformance(true);
    const newPerformanceData: Record<string, ModulePerformance | null> = {}; // Reset when fetching

    try {
      const performancePromises = concepts.map(async (concept) => {
        try {
          const response = await fetch(`/api/language-skills/performance?moduleId=${concept.id}`);
          if (!response.ok) {
             console.error(`Failed to fetch performance for ${concept.id}: ${response.statusText}`);
             return { moduleId: concept.id, performance: null };
          }
          const perfData: ModulePerformance = await response.json();
          return { moduleId: concept.id, performance: perfData };
        } catch (fetchError) {
          console.error(`Error fetching performance for ${concept.id}:`, fetchError);
          return { moduleId: concept.id, performance: null };
        }
      });

      const results = await Promise.all(performancePromises);

      results.forEach(result => {
        if (result) {
          newPerformanceData[result.moduleId] = result.performance;
        }
      });
      setPerformanceData(newPerformanceData);
    } catch (error) {
      console.error("Error fetching performance data:", error);
      toast.error("Could not load performance data.");
    } finally {
      setIsFetchingPerformance(false);
    }
  }, [user]);

  useEffect(() => {
    const initializePage = async () => {
      setIsLoading(true);
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);

        if (!authUser) {
          router.push('/login');
          return;
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('native_language, target_language')
          .eq('id', authUser.id)
          .single();

        const initialUserLang = profileData?.native_language || 'en';
        const initialTargetLang = profileData?.target_language || 'de';
        setUserLanguage(initialUserLang);
        setTargetLanguage(initialTargetLang);

        await fetchSupportedConcepts(initialTargetLang);

  } catch (error) {
        console.error("Error initializing page:", error);
        toast.error("Failed to initialize page.");
      } finally {
        setIsLoading(false);
      }
    };
    initializePage();
  }, [router]);

  useEffect(() => {
    fetchPerformanceData(supportedConcepts);
  }, [supportedConcepts, fetchPerformanceData]);

  const handleTargetLanguageChange = async (newLanguage: string) => {
    if (newLanguage === targetLanguage) return;

    setTargetLanguage(newLanguage);

    await fetchSupportedConcepts(newLanguage);

    if (user) {
      supabase
        .from('profiles')
        .update({ target_language: newLanguage })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) {
            toast.error("Failed to save target language preference.");
            console.error("Profile update error:", error);
          }
        });
    } else {
      console.warn("User not available for profile update.");
    }
  };

  const conceptsAvailable = supportedConcepts.length > 0;
  const showLoadingIndicator = isLoading || isFetchingConcepts || isFetchingPerformance;
  const showNoModulesMessage = !isLoading && !isFetchingConcepts && !conceptsAvailable;

  if (isLoading) {
  return (
    <div className="space-y-8 p-8">
      <div 
          className="rounded-lg p-6 text-white bg-muted"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-[20%]" />
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="flex gap-2">
                <Skeleton className="h-10 w-[180px]" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-[180px]" />
                <Skeleton className="h-10 w-[180px]" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <ModuleCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/50" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,#3b82f61a,transparent)] dark:bg-[radial-gradient(circle_800px_at_100%_200px,#3b82f61a,transparent)]" />
          </div>
          
      {/* Main Content */}
      <div className="relative z-10 flex-1 overflow-auto">
        <div className="px-8">
          {/* Header */}
          <div className="relative rounded-lg p-6 text-white border-y border-ring/30 backdrop-blur-sm my-6 overflow-hidden bg-black">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:24px_24px]" />
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  background: getFlagGradient(targetLanguage),
                  maskImage: 'radial-gradient(circle at center, black, transparent)',
                  WebkitMaskImage: 'radial-gradient(circle at center, black, transparent)',
                }}
              />
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  background: getFlagGradient(targetLanguage),
                  maskImage: 'radial-gradient(circle at 100% 0%, black, transparent)',
                  WebkitMaskImage: 'radial-gradient(circle at 100% 0%, black, transparent)',
                }}
              />
            </div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left Column - Title and Flag */}
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    {/* Country Border SVG with Flag Overlay */}
                    <div className="w-32 h-32 flex-shrink-0 relative">
                      <div className="absolute inset-0" style={{
                        background: getFlagGradient(targetLanguage),
                        WebkitMaskImage: `url(/flags/borders/${targetLanguage}_border.svg)`,
                        WebkitMaskSize: 'contain',
                        WebkitMaskPosition: 'center',
                        WebkitMaskRepeat: 'no-repeat',
                        maskImage: `url(/flags/borders/${targetLanguage}_border.svg)`,
                        maskSize: 'contain',
                        maskPosition: 'center',
                        maskRepeat: 'no-repeat',
                      }} />
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <defs>
                          <filter id="border">
                            <feMorphology operator="dilate" radius="1" in="SourceAlpha" result="thicken" />
                            <feFlood flood-color="white" result="white" />
                            <feComposite in="white" in2="thicken" operator="in" result="border" />
                            <feMerge>
                              <feMergeNode in="border" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>
                        <image 
                          href={`/flags/borders/${targetLanguage}_border.svg`}
                          width="100" 
                          height="100"
                          filter="url(#border)"
                        />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-5xl font-extrabold tracking-tight">
                        <span className="text-white/80">Master</span>
                        <span 
                          className="ml-2 inline-block bg-clip-text text-transparent"
                          style={{
                            backgroundImage: getFlagGradient(targetLanguage),
                          }}
                        >
                          {languageNames[targetLanguage] || targetLanguage}
                        </span>
                      </h1>
                      <div className="flex items-center gap-2 text-white/60 mt-2">
                        <p>{supportedConcepts.length} modules available</p>
                        <span className="w-1 h-1 rounded-full bg-white/30"></span>
                        <p>Start your language learning journey</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Filters */}
                <div className="w-full md:w-80 space-y-4">
                  <TargetLanguageSelector 
                    currentTargetLanguage={targetLanguage} 
                    onLanguageChange={handleTargetLanguageChange}
                    userId={user?.id || ''}
                  />
                  
              <Select>
                    <SelectTrigger className="w-full bg-white/10 border-ring/20 text-white backdrop-blur-sm">
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="grammar">Grammar</SelectItem>
                  <SelectItem value="vocabulary">Vocabulary</SelectItem>
                  <SelectItem value="practice">Practice</SelectItem>
                  <SelectItem value="reading">Reading</SelectItem>
                  <SelectItem value="listening">Listening</SelectItem>
                  <SelectItem value="speaking">Speaking</SelectItem>
                  <SelectItem value="writing">Writing</SelectItem>
                </SelectContent>
              </Select>
              
              <Select>
                    <SelectTrigger className="w-full bg-white/10 border-ring/20 text-white backdrop-blur-sm">
                  <SelectValue placeholder="Filter by Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

          {/* Fast Track Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Fast Track</h2>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">AI-Powered Learning Path</h4>
                      <p className="text-sm text-muted-foreground">
                        These modules are recommended based on your current progress and learning patterns. 
                        Focus on these to maximize your language learning efficiency.
                      </p>
                      <div className="text-xs text-muted-foreground">
                        <p>• Prioritizes modules needing improvement</p>
                        <p>• Suggests new concepts to explore</p>
                        <p>• Adapts to your learning style</p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {supportedConcepts
                .filter(concept => {
                  const perf = performanceData[concept.id];
                  if (!perf) return true;
                  return perf.overall.accuracy < 80;
                })
                .slice(0, 3)
                .map((concept) => (
            <ModuleCard 
              key={concept.id}
              moduleConcept={concept}
              userLanguage={userLanguage}
              targetLanguage={targetLanguage}
              performance={performanceData[concept.id] || null} 
            />
                ))}
            </div>
          </div>

          {/* All Modules Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">All Modules</h2>
            {(isFetchingConcepts || isFetchingPerformance) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <ModuleCardSkeleton key={index} />
                ))}
              </div>
            )}

            {showNoModulesMessage && (
          <div className="col-span-3 text-center py-8">
                <p className="text-muted-foreground mb-4">No modules available for the selected target language.</p>
                <p className="text-sm text-muted-foreground">Try selecting a different language.</p>
              </div>
            )}

            {!showLoadingIndicator && conceptsAvailable && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {supportedConcepts.map((concept) => (
                  <ModuleCard 
                    key={concept.id}
                    moduleConcept={concept}
                    userLanguage={userLanguage}
                    targetLanguage={targetLanguage}
                    performance={performanceData[concept.id] || null} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 