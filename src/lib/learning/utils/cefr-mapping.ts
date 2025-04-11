import { InteractionTypeTag } from "@/lib/learning/modals/types";

// Basic CEFR Levels
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | '-'; // Added '-' for insufficient data

// Simple mapping from accuracy percentage to CEFR level
// Note: This is a very simplistic mapping and doesn't reflect real CEFR criteria.
// Real CEFR assessment is much more nuanced.
export function mapAccuracyToCEFR(accuracy: number | undefined | null): CEFRLevel {
  if (accuracy === undefined || accuracy === null || accuracy < 0) {
    return '-'; // Indicate insufficient data or error
  }
  if (accuracy < 20) return 'A1';
  if (accuracy < 40) return 'A2';
  if (accuracy < 60) return 'B1';
  if (accuracy < 80) return 'B2';
  if (accuracy < 95) return 'C1';
  return 'C2';
}

// Helper to get a display label for InteractionTypeTag
export function getSkillLabel(skill: InteractionTypeTag): string {
    switch (skill) {
        case 'reading': return 'Reading';
        case 'writing': return 'Writing';
        case 'listening': return 'Listening';
        case 'speaking': return 'Speaking';
        default: return 'Other';
    }
} 