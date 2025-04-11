import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';
import { SessionEvent } from '../types';
import { modalSchemaRegistryService } from '../modals/registry.service'; // Import schema registry
import { InteractionTypeTag } from '../modals/types'; // Import skill type tag

interface CreateSessionParams {
  userId: string;
  moduleId: string;
  targetLanguage: string;
  sourceLanguage: string;
}

interface RecordEventParams {
  sessionId: string;
  submoduleId: string;
  modalSchemaId: string;
  questionData: any;
  userAnswer: any;
  markData: any;
}

// Define structure for skill-based performance
interface SkillPerformance {
    total: number;
    correct: number;
    accuracy: number;
}

// Structure for the performance results
export interface ModulePerformance {
    overall: SkillPerformance;
    bySkill: Record<InteractionTypeTag, SkillPerformance>;
    // Keep bySubmodule and byModalSchema if still needed for detailed views
    // bySubmodule: Record<string, SkillPerformance>;
    // byModalSchema: Record<string, SkillPerformance>;
}

/**
 * Service responsible for tracking and storing learning statistics
 */
export class StatisticsService {
  constructor() {
    // Eagerly create client? Or lazy?
  }

  /**
   * Start a new learning session and record it in the database
   */
  async startSession(params: CreateSessionParams): Promise<string> {
    const { userId, moduleId, targetLanguage, sourceLanguage } = params;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('user_learning_sessions')
      .insert({
        user_id: userId,
        module_id: moduleId,
        target_language: targetLanguage,
        source_language: sourceLanguage,
        start_time: new Date().toISOString(),
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Failed to start learning session:', error);
      throw new Error(`Failed to start learning session: ${error.message}`);
    }
    
    return data.id;
  }

  /**
   * Record a session event (question, answer, mark) in the database
   */
  async recordEvent(params: RecordEventParams): Promise<void> {
    const { 
      sessionId, 
      submoduleId, 
      modalSchemaId,
      questionData, 
      userAnswer, 
      markData 
    } = params;
    
    const supabase = await createClient();
    
    const isCorrect = typeof markData?.isCorrect === 'boolean' ? markData.isCorrect : false;
    
    const { error } = await supabase
      .from('user_session_events')
      .insert({
        session_id: sessionId,
        submodule_id: submoduleId,
        modal_schema_id: modalSchemaId,
        question_data: questionData,
        user_answer: userAnswer,
        mark_data: markData,
        is_correct: isCorrect,
        timestamp: new Date().toISOString(),
      });
    
    if (error) {
      console.error('Failed to record session event:', error);
      throw new Error(`Failed to record session event: ${error.message}`);
    }
    console.log(`Recorded event for session ${sessionId}, submodule ${submoduleId}, schema ${modalSchemaId}`);
  }

  /**
   * End a learning session by setting its end time
   */
  async endSession(sessionId: string): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('user_learning_sessions')
      .update({
        end_time: new Date().toISOString(),
      })
      .eq('id', sessionId);
    
    if (error) {
      console.error('Failed to end learning session:', error);
      throw new Error(`Failed to end learning session: ${error.message}`);
    }
    console.log(`Ended session: ${sessionId}`);
  }

  /**
   * Get recent session events for a user and module
   */
  async getUserSessionHistory(
    userId: string,
    moduleId?: string,
    limit = 100
  ): Promise<SessionEvent[]> {
    const supabase = await createClient();

    // Query user_session_events directly
    let query = supabase
      .from('user_session_events')
      .select(`
        submodule_id,
        modal_schema_id,
        question_data,
        user_answer,
        mark_data,
        is_correct,
        timestamp,
        user_learning_sessions!inner ( 
          user_id, 
          module_id,
          start_time
        )
      `)
      // Filter on the joined user_learning_sessions table
      .eq('user_learning_sessions.user_id', userId)
      .order('timestamp', { ascending: false }) // Order by event timestamp
      .limit(limit);

    if (moduleId) {
      // Filter on the joined module_id
      query = query.eq('user_learning_sessions.module_id', moduleId);
    }

    const { data: eventsData, error } = await query;

    if (error) {
      console.error('Failed to get user session history:', error);
      // Provide more context in the error message if possible
      throw new Error(`Failed to get user session history: ${error.message} (Hint: ${error.hint})`);
    }

    // Map the query results to the SessionEvent structure
    const events: SessionEvent[] = eventsData?.map((event: any) => ({
      submoduleId: event.submodule_id,
      modalSchemaId: event.modal_schema_id,
      questionData: event.question_data,
      userAnswer: event.user_answer,
      markingResult: event.mark_data,
      isCorrect: event.is_correct,
      timestamp: new Date(event.timestamp),
    })) || [];

    return events;
  }

  /**
   * Get performance statistics for a user and module, grouped by skill type.
   */
  async getUserModulePerformance(userId: string, moduleId: string): Promise<ModulePerformance> {
    const supabase = await createClient();
    // Ensure schema registry is initialized (might need more robust async handling)
    if (!modalSchemaRegistryService.getAllSchemas().length) await modalSchemaRegistryService.initialize(); 

    // Fetch events joined with session data to filter by user and module
    const { data: eventsData, error } = await supabase
      .from('user_session_events')
      .select(`
        is_correct,
        modal_schema_id,
        user_learning_sessions!inner (user_id, module_id)
      `)
      .eq('user_learning_sessions.user_id', userId)
      .eq('user_learning_sessions.module_id', moduleId);

    if (error) {
      console.error('Failed to get user module performance events:', error);
      throw new Error(`Failed to get user module performance: ${error.message} (Hint: ${error.hint})`);
    }
    
    // Initialize performance objects
    const overall: SkillPerformance = { total: 0, correct: 0, accuracy: 0 };
    const bySkill: Record<string, SkillPerformance> = { 
        reading: { total: 0, correct: 0, accuracy: 0 },
        writing: { total: 0, correct: 0, accuracy: 0 },
        listening: { total: 0, correct: 0, accuracy: 0 },
        speaking: { total: 0, correct: 0, accuracy: 0 },
    };

    // Process events to calculate performance
    eventsData.forEach(event => {
      if (event.is_correct === null) return; // Skip events not yet marked

      overall.total++;
      if (event.is_correct) {
        overall.correct++;
      }

      // Get skill type from modal schema definition
      const schema = modalSchemaRegistryService.getSchema(event.modal_schema_id);
      const skillType = schema?.interactionType as InteractionTypeTag | undefined;

      if (skillType && bySkill[skillType]) {
          bySkill[skillType].total++;
          if (event.is_correct) {
              bySkill[skillType].correct++;
          }
      } else {
          console.warn(`Could not determine skill type for schema ID: ${event.modal_schema_id}`);
      }
    });

    // Calculate accuracies
    overall.accuracy = overall.total > 0 ? Math.round((overall.correct / overall.total) * 100) : 0;
    Object.values(bySkill).forEach(stats => {
      stats.accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    });

    return {
      overall,
      bySkill: bySkill as Record<InteractionTypeTag, SkillPerformance>,
      // Include bySubmodule/byModalSchema if needed later
    };
  }
}

// Create a singleton instance for use throughout the application
export const statisticsService = new StatisticsService(); 