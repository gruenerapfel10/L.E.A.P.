import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { moduleRegistryService } from '@/lib/learning/registry/module-registry.service';
import { modalSchemaRegistryService } from '@/lib/learning/modals/registry.service';
import { statisticsService } from '@/lib/learning/statistics/statistics.service';
import { pickerAlgorithmService } from '@/lib/learning/picker/picker.service';
import { questionGenerationService } from '@/lib/learning/generation/question-generation.service';
import { GenerationResult } from '@/lib/learning/generation/question-generation.service';
import { markingService } from '@/lib/learning/marking/marking.service';
import { AiMarkingResult } from '@/lib/learning/marking/marking.service';

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
  } catch (error) {
    console.error("Failed to initialize learning registries for POST submit:", error);
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
    await initializeRegistries();
    
    const body: SubmitBody = await request.json();

    // Validate required fields from the body
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
    
    if (!sessionId || !moduleId || !submoduleId || !modalSchemaId || !questionData || !targetLanguage || !sourceLanguage) {
      return NextResponse.json({ error: 'Missing required fields in request body' }, { status: 400 });
    }
    
    // 1. Mark the user's answer
    const markResult: AiMarkingResult = await markingService.markAnswer({
      moduleId,
      submoduleId,
      modalSchemaId,
      questionData,
      userAnswer,
      targetLanguage,
      sourceLanguage
    });
    
    // 2. Record the event
    try {
    await statisticsService.recordEvent({
      sessionId,
      submoduleId,
      modalSchemaId,
      questionData,
      userAnswer,
      markData: markResult
    });
      console.log(`Recorded marking event for session ${sessionId}`);
    } catch (eventError) {
      console.error(`Failed to record marking event for session ${sessionId}:`, eventError);
      // Decide if this is critical. For now, log and continue.
    }

    // 3. Pick the next step
    const supabase = await createClient(); // Await createClient from server
    const { data: { user } } = await supabase.auth.getUser(); // Await getUser
    if (!user) throw new Error("User not found for picking next step");

    // Fetch history (optional, depending on picker strategy)
    const history = await statisticsService.getUserSessionHistory(user.id, moduleId);
    
    const nextStepInfo = await pickerAlgorithmService.getNextStep({
      userId: user.id,
      moduleId,
      targetLanguage,
      sourceLanguage,
      history,
    });
    
    // Get details for the next step (module, submodule, and modal schema definitions)
    const moduleDef = moduleRegistryService.getModule(moduleId, targetLanguage);
    const nextSubmoduleDef = moduleDef?.submodules.find(sub => sub.id === nextStepInfo.submoduleId);
    const nextModalSchemaDef = modalSchemaRegistryService.getSchema(nextStepInfo.modalSchemaId);

    if (!moduleDef || !nextSubmoduleDef || !nextModalSchemaDef) {
       console.error(`Could not find definitions for next step: Module=${moduleId}, Submodule=${nextStepInfo.submoduleId}, Schema=${nextStepInfo.modalSchemaId} for lang ${targetLanguage}`);
       // Return null for next step if definitions are missing
        return NextResponse.json({
          markResult, 
          nextStep: null, 
          nextQuestionData: null,
          nextQuestionDebugInfo: null
        });
    }
    
    // 4. Generate the next question (passing definitions)
    const { questionData: nextQuestionData, debugInfo }: GenerationResult = await questionGenerationService.generateQuestion({
      moduleId,
      submoduleId: nextStepInfo.submoduleId,
      modalSchemaId: nextStepInfo.modalSchemaId,
      moduleDefinition: moduleDef,
      submoduleDefinition: nextSubmoduleDef,
      modalSchemaDefinition: nextModalSchemaDef,
      targetLanguage,
      sourceLanguage,
    });

    // Determine the UI component for the next step
    const nextUiComponent = nextSubmoduleDef.overrides?.[nextStepInfo.modalSchemaId]?.uiComponentOverride 
                         || nextModalSchemaDef.uiComponent;

    // Get localized title for the next submodule
    const nextSubmoduleTitle = nextSubmoduleDef.localization[targetLanguage]?.title 
                             || nextSubmoduleDef.title_en;
    
    // 5. Construct the response including next step info
    const responsePayload = {
      markResult,
      nextStep: {
        submoduleId: nextStepInfo.submoduleId,
        modalSchemaId: nextStepInfo.modalSchemaId,
        submoduleTitle: nextSubmoduleTitle,
        uiComponent: nextUiComponent,
      },
      nextQuestionData,
      ...(process.env.NODE_ENV === 'development' && debugInfo && { nextQuestionDebugInfo: debugInfo })
    };

    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error('Error submitting answer:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 