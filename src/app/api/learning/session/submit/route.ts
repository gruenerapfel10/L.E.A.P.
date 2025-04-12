import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { moduleRegistryService } from '@/lib/learning/registry/module-registry.service';
import { modalSchemaRegistryService } from '@/lib/learning/modals/registry.service';
import { markingService } from '@/lib/learning/marking/marking.service';
import { questionGenerationService, GenerationResult } from '@/lib/learning/generation/question-generation.service';
import { pickerAlgorithmService } from '@/lib/learning/picker/picker.service';
import { StatisticsService } from '@/lib/learning/statistics/statistics.service';
import { initializeLearningRegistries } from '@/lib/learning/registry/init';
import { SubmoduleDefinition } from '@/lib/learning/types/index';
import { ModalSchemaDefinition } from '@/lib/learning/modals/types';

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
  difficulty?: string;
}

export async function POST(request: Request) {
  try {
    // Ensure registries are initialized
    await initializeLearningRegistries();

    // Parse request body
    const body: SubmitBody = await request.json();
    const { 
      sessionId,
      moduleId,
      submoduleId, 
      modalSchemaId, 
      questionData, 
      userAnswer, 
      targetLanguage, 
      sourceLanguage
    } = body;

    console.log(`[Submit API] Received request for sessionId: ${sessionId}`);

    // Validate all required fields from the body
    if (!sessionId || !moduleId || !submoduleId || !modalSchemaId || !questionData || userAnswer === undefined || !targetLanguage || !sourceLanguage) {
      console.warn("[Submit API] Missing required fields in body:", body);
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create Supabase server client
    const supabase = await createClient();

    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("Unauthorized attempt to submit answer for session:", sessionId);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optional: Verify user owns the session (add similar check as in /end if needed)

    // --- REMOVED Fetching difficulty from session as column doesn't exist ---
    // const { data: sessionData, error: sessionError } = await supabase
    //   .from('user_learning_sessions')
    //   .select('difficulty') 
    //   .eq('id', sessionId)
    //   .single();

    // if (sessionError || !sessionData) {
    //   console.error('Error fetching session data:', sessionError);
    //   return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    // }
    // const difficulty = sessionData.difficulty ?? 'intermediate'; 
    const difficulty = 'intermediate'; // <-- Use default difficulty for now
    // --------------------------------------------------------------------

    // Retrieve module and submodule definitions
    const moduleDef = moduleRegistryService.getModule(moduleId, targetLanguage);
    if (!moduleDef) {
      console.error(`Module definition not found for ID: ${moduleId}, Language: ${targetLanguage}`);
      return NextResponse.json({ error: `Internal error: Module ${moduleId} not found.` }, { status: 500 });
    }
    
    const submoduleDef = moduleDef.submodules.find((sub: SubmoduleDefinition) => sub.id === submoduleId);
    if (!submoduleDef) {
      console.error(`Submodule definition not found for ID: ${submoduleId} in Module: ${moduleId}`);
      return NextResponse.json({ error: `Internal error: Submodule ${submoduleId} not found.` }, { status: 500 });
    }

    // Retrieve modal schema definition
    const modalSchemaDef = modalSchemaRegistryService.getSchema(modalSchemaId);
    if (!modalSchemaDef) {
        console.error(`Modal schema definition not found for ID: ${modalSchemaId}`);
        return NextResponse.json({ error: `Internal error: Modal schema ${modalSchemaId} not found.` }, { status: 500 });
    }

    // Mark the user's answer
    const markingResult = await markingService.markAnswer({
      moduleId: moduleId,
      submoduleId: submoduleId,
      modalSchemaId: modalSchemaId,
      moduleDefinition: moduleDef,
      submoduleDefinition: submoduleDef,
      modalSchemaDefinition: modalSchemaDef,
      questionData: questionData,
      userAnswer: userAnswer,
      targetLanguage: targetLanguage,
      sourceLanguage: sourceLanguage,
      difficulty: difficulty,
      userId: user.id, 
      sessionId: sessionId,
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
    const nextSubmodule = module.submodules.find((sub: SubmoduleDefinition) => sub.id === nextStep.submoduleId);
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
      difficulty: difficulty,
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