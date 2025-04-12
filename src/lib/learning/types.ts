import { InteractionTypeTag } from './modals/types';

export interface SkillPerformance {
  total: number;
  correct: number;
  accuracy: number;
  trend: number;
}

export interface ModulePerformance {
  overall: SkillPerformance;
  bySkill: Record<InteractionTypeTag, SkillPerformance>;
} 