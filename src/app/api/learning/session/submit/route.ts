import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { moduleRegistryService } from '@/lib/learning/registry/module-registry.service';
import { modalSchemaRegistryService } from '@/lib/learning/modals/registry.service';
import { StatisticsService } from '@/lib/learning/statistics/statistics.service';
import { pickerAlgorithmService } from '@/lib/learning/picker/picker.service';
import { questionGenerationService } from '@/lib/learning/generation/question-generation.service';
import { markingService } from '@/lib/learning/marking/marking.service';
import { GenerationResult } from '@/lib/learning/generation/question-generation.service';

// Initialize registries once
let registriesInitialized = false;

async function initializeRegistries() {
  if (registriesInitialized) return;
  try {
    await Promise.all([
      moduleRegistryService.initialize(),
      modalSchemaRegistryService.initialize(),
    ]);
    registriesInitialized = true;
    console.log("Learning Registries Initialized for Submit.");
  } catch (error) {
    console.error("Failed to initialize learning registries for Submit:", error);
    throw new Error("Failed to initialize learning registries");
  }
}

// Define expected body shape
interface SubmitBody {
  sessionId: string;
  moduleId: string;
  submoduleId: string;
  modalSchemaId: string;
  questionData: any;
  userAnswer: any;
  targetLanguage: string;
  sourceLanguage: string;
}

export async function POST(request: Request) {
  try {
    // Ensure registries are initialized
    await initializeRegistries();

    // Parse request body
    const body = await request.json();
    const { sessionId, submoduleId, modalSchemaId, questionData, userAnswer } = body;

    if (!sessionId || !submoduleId || !modalSchemaId || !questionData || userAnswer === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create Supabase client
    const supabase = await createClient();

    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optional: Verify user owns the session (add similar check as in /end if needed)

    // Get module ID and languages from the session
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_learning_sessions')
      .select('module_id, target_language, source_language')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      console.error('Error fetching session data:', sessionError);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const { module_id: moduleId, target_language: targetLanguage, source_language: sourceLanguage } = sessionData;

    // Mark the user's answer
    const markingResult = await markingService.markAnswer({
      moduleId,
      submoduleId,
      modalSchemaId,
      questionData,
      userAnswer,
      targetLanguage,
      sourceLanguage,
    });

    // Record the event using the static method
    await StatisticsService.recordEvent(supabase, {
      sessionId,
      submoduleId,
      modalSchemaId,
      questionData,
      userAnswer,
      markData: markingResult,
    });

    // Get updated session history for the picker
    const history = await StatisticsService.getUserSessionHistory(supabase, user.id, moduleId);

    // Determine the next step
    const nextStep = await pickerAlgorithmService.getNextStep({
      userId: user.id,
      moduleId,
      targetLanguage,
      sourceLanguage,
      history,
    });

    // Get details for the next step
    const module = moduleRegistryService.getModule(moduleId, targetLanguage);
    if (!module) throw new Error(`Module ${moduleId} not found`); // Should ideally not happen if session exists
    const nextSubmodule = module.submodules.find(sub => sub.id === nextStep.submoduleId);
    const nextModalSchema = modalSchemaRegistryService.getSchema(nextStep.modalSchemaId);
    if (!nextSubmodule || !nextModalSchema) {
      throw new Error(`Could not find next submodule (${nextStep.submoduleId}) or modal schema (${nextStep.modalSchemaId})`);
    }

    // Generate the next question
    const { questionData: nextQuestionData, debugInfo: nextDebugInfo }: GenerationResult = await questionGenerationService.generateQuestion({
      moduleId,
      submoduleId: nextStep.submoduleId,
      modalSchemaId: nextStep.modalSchemaId,
      moduleDefinition: module,
      submoduleDefinition: nextSubmodule,
      modalSchemaDefinition: nextModalSchema,
      targetLanguage,
      sourceLanguage,
    });

    // Determine the UI component for the next question
    const nextUiComponent = nextSubmodule.overrides?.[nextStep.modalSchemaId]?.uiComponentOverride || nextModalSchema.uiComponent;

    // Record the next question event (without answer/mark)
    try {
        await StatisticsService.recordEvent(supabase, {
            sessionId,
            submoduleId: nextStep.submoduleId,
            modalSchemaId: nextStep.modalSchemaId,
            questionData: nextQuestionData,
            userAnswer: null,
            markData: null,
        });
        console.log(`Recorded next question event for session ${sessionId}`);
    } catch(eventError) {
        console.error("Failed to record next question event:", eventError);
        // Log but continue
    }

    // Return the marking result and the next step details
    return NextResponse.json({
      markingResult,
      nextStep: {
        submoduleId: nextStep.submoduleId,
        submoduleTitle: nextSubmodule.localization[targetLanguage]?.title || nextSubmodule.title_en,
        modalSchemaId: nextStep.modalSchemaId,
        uiComponent: nextUiComponent,
        questionData: nextQuestionData,
        ...(process.env.NODE_ENV === 'development' && nextDebugInfo && { questionDebugInfo: nextDebugInfo })
      },
    });

  } catch (error) {
    console.error('Error submitting answer:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 