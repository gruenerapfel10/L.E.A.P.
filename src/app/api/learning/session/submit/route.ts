import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { moduleRegistryService } from '@/lib/learning/registry/module-registry.service';
import { modalSchemaRegistryService } from '@/lib/learning/modals/registry.service';
import { statisticsService } from '@/lib/learning/statistics/statistics.service';
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
      // Initialize other dependent services if needed
    ]);
    registriesInitialized = true;
    console.log("Learning Registries Initialized.");
  } catch (error) {
    console.error("Failed to initialize learning registries:", error);
    throw new Error("Failed to initialize learning registries");
  }
}

export async function POST(request: Request) {
  try {
    // Ensure registries are initialized
    await initializeRegistries();
    
    // Parse the request body
    const body = await request.json();
    const { 
      sessionId, 
      moduleId, 
      submoduleId, 
      modalSchemaId,
      questionData, 
      userAnswer,
      targetLanguage = 'de',
      sourceLanguage = 'en'
    } = body;
    
    if (!sessionId || !moduleId || !submoduleId || !modalSchemaId || !questionData) {
      return NextResponse.json(
        { error: 'Session ID, module ID, submodule ID, modal schema ID, and question data are required' },
        { status: 400 }
      );
    }
    
    // Get the user ID
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Mark the user's answer
    const markResult = await markingService.markAnswer({
      moduleId,
      submoduleId,
      modalSchemaId,
      questionData,
      userAnswer,
      targetLanguage,
      sourceLanguage
    });
    
    // Record the event in the statistics service
    await statisticsService.recordEvent({
      sessionId,
      submoduleId,
      modalSchemaId,
      questionData,
      userAnswer,
      markData: markResult
    });
    
    // --- Determine Next Step ---
    // Get updated user session history
    const history = await statisticsService.getUserSessionHistory(user.id, moduleId);
    
    // Pick the next submodule and modal schema
    const nextStepInfo = await pickerAlgorithmService.getNextStep({
      userId: user.id,
      moduleId,
      targetLanguage,
      sourceLanguage,
      history,
    });
    
    // Generate the next question (returns GenerationResult)
    const { questionData: nextQuestionData, debugInfo }: GenerationResult = await questionGenerationService.generateQuestion({
      moduleId,
      submoduleId: nextStepInfo.submoduleId,
      modalSchemaId: nextStepInfo.modalSchemaId,
      targetLanguage,
      sourceLanguage,
    });

    // Get details for the next step (submodule and modal schema)
    const moduleDef = moduleRegistryService.getModule(moduleId);
    const nextSubmoduleDef = moduleDef?.submodules.find(sub => sub.id === nextStepInfo.submoduleId);
    const nextModalSchemaDef = modalSchemaRegistryService.getSchema(nextStepInfo.modalSchemaId);

    if (!nextSubmoduleDef || !nextModalSchemaDef) {
       console.error(`Could not find next submodule (${nextStepInfo.submoduleId}) or modal schema (${nextStepInfo.modalSchemaId})`);
       // Decide how to handle: end session, retry picking, return error?
       // For now, return null for next step to indicate session end/error
        return NextResponse.json({
          markResult, 
          nextStep: null, 
          nextQuestionData: null 
        });
    }

    // Determine the UI component for the next step
    const nextUiComponent = nextSubmoduleDef.overrides?.[nextStepInfo.modalSchemaId]?.uiComponentOverride 
                         || nextModalSchemaDef.uiComponent;

    // Get localized title for the next submodule
    const nextSubmoduleTitle = nextSubmoduleDef.localization[targetLanguage]?.title 
                             || nextSubmoduleDef.title_en;
    
    // Return marking result and correctly structured next step data
    return NextResponse.json({
      markResult,
      nextStep: {
        submoduleId: nextStepInfo.submoduleId,
        modalSchemaId: nextStepInfo.modalSchemaId,
        submoduleTitle: nextSubmoduleTitle,
        uiComponent: nextUiComponent,
      },
      // Send questionData and debugInfo separately
      nextQuestionData: nextQuestionData, 
      nextQuestionDebugInfo: process.env.NODE_ENV === 'development' ? debugInfo : undefined // Only send debug in dev
    });

  } catch (error) {
    console.error('Error submitting answer:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
} 