import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { moduleRegistryService } from '@/lib/learning/registry/module-registry.service';
import { modalSchemaRegistryService } from '@/lib/learning/modals/registry.service';
import { StatisticsService } from '@/lib/learning/statistics/statistics.service';
import { pickerAlgorithmService } from '@/lib/learning/picker/picker.service';
import { questionGenerationService } from '@/lib/learning/generation/question-generation.service';
import { SubmoduleDefinition } from '@/lib/learning/types';
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
    // Handle initialization failure (e.g., throw or set a critical error state)
    throw new Error("Failed to initialize learning registries");
  }
}

export async function POST(request: Request) {
  try {
    // Ensure registries are initialized
    await initializeRegistries();

    // Verify registries are ready immediately after initialization
    // This is a sanity check
    if (!modalSchemaRegistryService.getSchema('multiple-choice')) {
      // Attempt to re-initialize just in case, though this might indicate a deeper issue
      console.warn("Modal schema 'multiple-choice' not found immediately after init, attempting re-init...");
      await modalSchemaRegistryService.initialize(); 
      if (!modalSchemaRegistryService.getSchema('multiple-choice')) {
         throw new Error("Critical Error: Modal schema 'multiple-choice' still not found after re-initialization.");
      }
    }

    // Parse the request body
    const body = await request.json();
    const { moduleId, targetLanguage, sourceLanguage = 'en' } = body; // Default sourceLanguage

    if (!moduleId || !targetLanguage) {
      return NextResponse.json(
        { error: 'Module ID and target language are required' },
        { status: 400 }
      );
    }

    // Create Supabase client for this request (server-side)
    const supabase = await createClient();

    // Get the user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the module exists for the target language
    const module = moduleRegistryService.getModule(moduleId, targetLanguage);
    if (!module) {
      return NextResponse.json({ error: `Module not found for ID ${moduleId} and language ${targetLanguage}` }, { status: 404 });
    }

    // Start a new learning session using the static method
    const sessionId = await StatisticsService.startSession(supabase, {
      userId: user.id,
      moduleId,
      targetLanguage,
      sourceLanguage,
    });

    // Get user's session history for the module (for picker)
    const history = await StatisticsService.getUserSessionHistory(supabase, user.id, moduleId);

    // Determine the first step (submodule + modal schema)
    const { submoduleId, modalSchemaId } = await pickerAlgorithmService.getNextStep({
      userId: user.id,
      moduleId,
      targetLanguage,
      sourceLanguage,
      history, // Pass potentially adjusted history
    });

    // Get the specific submodule and modal schema details
    const submodule = module.submodules.find(sub => sub.id === submoduleId);
    const modalSchema = modalSchemaRegistryService.getSchema(modalSchemaId);
    if (!submodule || !modalSchema) {
      throw new Error(`Could not find submodule (${submoduleId}) or modal schema (${modalSchemaId})`);
    }

    // Generate the first question, now returns GenerationResult
    const { questionData, debugInfo }: GenerationResult = await questionGenerationService.generateQuestion({
      moduleId,
      submoduleId,
      modalSchemaId,
      moduleDefinition: module,
      submoduleDefinition: submodule,
      modalSchemaDefinition: modalSchema,
      targetLanguage,
      sourceLanguage,
    });

    // Determine the UI component (check for submodule override first)
    const uiComponent = submodule.overrides?.[modalSchemaId]?.uiComponentOverride || modalSchema.uiComponent;

    // Record the first event using the static method
    try {
      await StatisticsService.recordEvent(supabase, {
        sessionId,
        submoduleId,
        modalSchemaId,
        questionData,
        userAnswer: null,
        markData: null
      });
      console.log(`Recorded initial event for session ${sessionId}`);
    } catch (eventError) {
      // Log the error but continue - the session start shouldn't necessarily fail if event recording fails initially
      console.error('Failed to record initial session event:', eventError);
      // Optionally, could implement cleanup logic for the created session if recording is critical
    }

    // Return session info, first step, question, AND debugInfo
    return NextResponse.json({
      sessionId,
      moduleId,
      submoduleId,
      submoduleTitle: submodule.localization[targetLanguage]?.title || submodule.title_en,
      modalSchemaId,
      uiComponent,
      questionData,
      targetLanguage,
      sourceLanguage,
      ...(process.env.NODE_ENV === 'development' && debugInfo && { questionDebugInfo: debugInfo })
    });

  } catch (error) {
    console.error('Error starting learning session:', error);
    // Provide a more generic error message in production
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
} 