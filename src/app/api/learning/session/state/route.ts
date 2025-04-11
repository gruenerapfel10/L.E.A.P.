import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { moduleRegistryService } from '@/lib/learning/registry/module-registry.service';
import { modalSchemaRegistryService } from '@/lib/learning/modals/registry.service';

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
    console.error("Failed to initialize learning registries for GET state:", error);
    throw new Error("Failed to initialize learning registries");
  }
}

export async function GET(request: NextRequest) {
  try {
    await initializeRegistries();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Get User (Optional but good for security)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch the Session details and the *first* event for that session
    // We need the first event to get the initial question data and IDs
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_learning_sessions')
      .select(`
        id,
        module_id,
        target_language,
        source_language,
        user_session_events ( 
          submodule_id,
          modal_schema_id,
          question_data,
          timestamp
        )
      `)
      .eq('id', sessionId)
      .eq('user_id', user.id) // Ensure user owns the session
      .order('timestamp', { referencedTable: 'user_session_events', ascending: true })
      .limit(1, { referencedTable: 'user_session_events' })
      .maybeSingle(); // Use maybeSingle as session might not exist or have events

    if (sessionError) {
      console.error("Error fetching session state:", sessionError);
      throw sessionError;
    }

    if (!sessionData || !sessionData.user_session_events || sessionData.user_session_events.length === 0) {
      console.log(`Session not found or no events for sessionId: ${sessionId}`);
      return NextResponse.json({ error: 'Session not found or is empty' }, { status: 404 });
    }

    const firstEvent = sessionData.user_session_events[0];

    // 3. Get Submodule and Modal Schema details for titles/UI component
    const moduleDef = moduleRegistryService.getModule(sessionData.module_id, sessionData.target_language);
    const submoduleDef = moduleDef?.submodules.find(sub => sub.id === firstEvent.submodule_id);
    const modalSchemaDef = modalSchemaRegistryService.getSchema(firstEvent.modal_schema_id);

    if (!submoduleDef || !modalSchemaDef) {
        console.error(`Definitions missing: Submodule=${firstEvent.submodule_id}, Schema=${firstEvent.modal_schema_id}`);
        return NextResponse.json({ error: 'Module or schema definition missing' }, { status: 500 });
    }

    // 4. Determine UI Component (handling overrides)
    const uiComponent = submoduleDef.overrides?.[firstEvent.modal_schema_id]?.uiComponentOverride 
                       || modalSchemaDef.uiComponent;

    // 5. Get Localized Submodule Title
    const submoduleTitle = submoduleDef.localization[sessionData.target_language]?.title 
                           || submoduleDef.title_en;

    // 6. Construct the response matching StartSessionApiResponse structure
    const responsePayload = {
        sessionId: sessionData.id,
        moduleId: sessionData.module_id,
        moduleDefinition: moduleDef,
        submoduleId: firstEvent.submodule_id,
        submoduleDefinition: submoduleDef,
        submoduleTitle: submoduleTitle,
        modalSchemaId: firstEvent.modal_schema_id,
        uiComponent: uiComponent,
        questionData: firstEvent.question_data,
        targetLanguage: sessionData.target_language,
        sourceLanguage: sessionData.source_language,
    };

    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error('Error in GET /api/learning/session/state:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 