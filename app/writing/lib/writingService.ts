import type { WritingExercise, WritingHistory, WritingSubmission, WritingRubric } from './writingSchemas';

const WRITING_HISTORY_KEY = 'writing-history';
const CURRENT_EXERCISE_KEY = 'current-writing-exercise';

export function saveWritingHistory(historyEntry: WritingHistory): void {
  const history = getWritingHistory();
  
  // Add to beginning of array (most recent first)
  history.unshift(historyEntry);
  
  // Keep only last 100 entries
  if (history.length > 100) {
    history.splice(100);
  }
  
  localStorage.setItem(WRITING_HISTORY_KEY, JSON.stringify(history));
}

// Get writing history from localStorage
export function getWritingHistory(): WritingHistory[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(WRITING_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading writing history:', error);
    return [];
  }
}

// Delete specific writing history entry
export function deleteWritingHistory(id: string): void {
  const history = getWritingHistory();
  const filtered = history.filter(entry => entry.id !== id);
  localStorage.setItem(WRITING_HISTORY_KEY, JSON.stringify(filtered));
}

// Clear all writing history
export function clearWritingHistory(): void {
  localStorage.removeItem(WRITING_HISTORY_KEY);
}

// Save current exercise to localStorage (for persistence during writing)
export function saveCurrentExercise(exercise: WritingExercise): void {
  localStorage.setItem(CURRENT_EXERCISE_KEY, JSON.stringify(exercise));
}

// Get current exercise from localStorage
export function getCurrentExercise(): WritingExercise | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(CURRENT_EXERCISE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading current exercise:', error);
    return null;
  }
}

// Clear current exercise
export function clearCurrentExercise(): void {
  localStorage.removeItem(CURRENT_EXERCISE_KEY);
}

// Helper function to calculate word count
export function calculateWordCount(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

// Helper function to get strongest skill from criteria
export function getStrongestSkill(criteria: any): string {
  const skills: Record<string, number> = {
    'Task Fulfillment': criteria.taskFulfillment,
    'Coherence & Cohesion': criteria.coherenceAndCohesion,
    'Vocabulary & Language': criteria.vocabularyAndLanguageRange,
    'Grammar & Accuracy': criteria.grammarAndAccuracy,
    'Style Appropriateness': criteria.appropriatenessOfStyle,
  };
  
  return Object.entries(skills).reduce((max, [skill, score]) => 
    score > skills[max] ? skill : max, 'Task Fulfillment'
  );
}

// Helper function to get weakest skill from criteria
export function getWeakestSkill(criteria: any): string {
  const skills: Record<string, number> = {
    'Task Fulfillment': criteria.taskFulfillment,
    'Coherence & Cohesion': criteria.coherenceAndCohesion,
    'Vocabulary & Language': criteria.vocabularyAndLanguageRange,
    'Grammar & Accuracy': criteria.grammarAndAccuracy,
    'Style Appropriateness': criteria.appropriatenessOfStyle,
  };
  
  return Object.entries(skills).reduce((min, [skill, score]) => 
    score < skills[min] ? skill : min, 'Task Fulfillment'
  );
}

// Get comprehensive writing statistics with analytics
export function getWritingStatistics(): {
  totalExercises: number;
  averageScore: number;
  totalTimeSpent: number;
  exercisesByType: Record<string, number>;
  recentTrend: number[];
  grammarTrend: number[];
  vocabularyTrend: number[];
  wpmTrend: number[];
  accuracyTrend: number[];
  strongestSkills: Record<string, number>;
  weekestSkills: Record<string, number>;
  improvementRate: number;
} {
  const history = getWritingHistory();
  
  if (history.length === 0) {
    return {
      totalExercises: 0,
      averageScore: 0,
      totalTimeSpent: 0,
      exercisesByType: {},
      recentTrend: [],
      grammarTrend: [],
      vocabularyTrend: [],
      wpmTrend: [],
      accuracyTrend: [],
      strongestSkills: {},
      weekestSkills: {},
      improvementRate: 0,
    };
  }
  
  const totalExercises = history.length;
  const averageScore = history.reduce((sum, entry) => sum + entry.score, 0) / totalExercises;
  const totalTimeSpent = history.reduce((sum, entry) => sum + entry.timeSpent, 0);
  
  const exercisesByType: Record<string, number> = {};
  const strongestSkills: Record<string, number> = {};
  const weekestSkills: Record<string, number> = {};
  
  history.forEach(entry => {
    const type = entry.exercise.prompt.type;
    exercisesByType[type] = (exercisesByType[type] || 0) + 1;
    
    if (entry.strongestSkill) {
      strongestSkills[entry.strongestSkill] = (strongestSkills[entry.strongestSkill] || 0) + 1;
    }
    
    if (entry.weakestSkill) {
      weekestSkills[entry.weakestSkill] = (weekestSkills[entry.weakestSkill] || 0) + 1;
    }
  });
  
  const recentHistory = history.slice(0, 10).reverse();
  const recentTrend = recentHistory.map(entry => entry.score || 0);
  const grammarTrend = recentHistory.map(entry => Math.max(0, 100 - ((entry.grammarMistakeCount || 0) * 5)));
  const vocabularyTrend = recentHistory.map(entry => entry.vocabularyScore || 0);
  const wpmTrend = recentHistory.map(entry => entry.wordsPerMinute || 0);
  const accuracyTrend = recentHistory.map(entry => entry.accuracyRate || 0);
  
  let improvementRate = 0;
  if (history.length >= 6) {
    const firstThree = history.slice(-3).map(e => e.score);
    const lastThree = history.slice(0, 3).map(e => e.score);
    const firstAvg = firstThree.reduce((a, b) => a + b, 0) / 3;
    const lastAvg = lastThree.reduce((a, b) => a + b, 0) / 3;
    improvementRate = ((lastAvg - firstAvg) / firstAvg) * 100;
  }
  
  return {
    totalExercises,
    averageScore: Math.round(averageScore),
    totalTimeSpent,
    exercisesByType,
    recentTrend,
    grammarTrend,
    vocabularyTrend,
    wpmTrend,
    accuracyTrend,
    strongestSkills,
    weekestSkills,
    improvementRate: Math.round(improvementRate),
  };
}

// Get detailed mistake summary across all tests
export function getMistakeSummary(): {
  grammarMistakes: Record<string, { count: number; examples: Array<{ original: string; corrected: string; explanation: string }> }>;
  vocabularyMistakes: Array<{ word: string; context: string; suggestion: string; count: number }>;
  commonWeaknesses: Array<{ skill: string; frequency: number; priority: 'high' | 'medium' | 'low' }>;
} {
  const history = getWritingHistory();
  const grammarMistakes: Record<string, { count: number; examples: Array<{ original: string; corrected: string; explanation: string }> }> = {};
  const vocabularyMistakesMap: Record<string, { word: string; context: string; suggestion: string; count: number }> = {};
  const weaknessCount: Record<string, number> = {};
  
  history.forEach(entry => {
    if (entry.exercise?.evaluation) {
      // Grammar mistakes
      if (entry.exercise.evaluation.grammarMistakes && Array.isArray(entry.exercise.evaluation.grammarMistakes)) {
        entry.exercise.evaluation.grammarMistakes.forEach(mistake => {
          if (!grammarMistakes[mistake.type]) {
            grammarMistakes[mistake.type] = { count: 0, examples: [] };
          }
          grammarMistakes[mistake.type].count++;
          if (grammarMistakes[mistake.type].examples.length < 5) { // Keep only top 5 examples
            grammarMistakes[mistake.type].examples.push({
              original: mistake.originalText,
              corrected: mistake.correctedText,
              explanation: mistake.explanation
            });
          }
        });
      }
      
      // Vocabulary mistakes
      if (entry.exercise.evaluation.vocabularyUsage?.inappropriateWords && Array.isArray(entry.exercise.evaluation.vocabularyUsage.inappropriateWords)) {
        entry.exercise.evaluation.vocabularyUsage.inappropriateWords.forEach(vocab => {
          const key = vocab.word.toLowerCase();
          if (!vocabularyMistakesMap[key]) {
            vocabularyMistakesMap[key] = { ...vocab, count: 0 };
          }
          vocabularyMistakesMap[key].count++;
        });
      }
      
      // Weaknesses
      if (entry.weakestSkill) {
        weaknessCount[entry.weakestSkill] = (weaknessCount[entry.weakestSkill] || 0) + 1;
      }
    }
  });
  
  const vocabularyMistakes = Object.values(vocabularyMistakesMap);
  const commonWeaknesses = Object.entries(weaknessCount)
    .map(([skill, frequency]) => ({
      skill,
      frequency,
      priority: frequency >= 3 ? 'high' as const : frequency >= 2 ? 'medium' as const : 'low' as const
    }))
    .sort((a, b) => b.frequency - a.frequency);
  
  return {
    grammarMistakes,
    vocabularyMistakes,
    commonWeaknesses
  };
} 