import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { moduleRegistryService } from '@/lib/learning/registry/module-registry.service';
import { ModuleDefinition } from '@/lib/learning/types';

// Initialize the module registry once
let registryInitialized = false;

export async function GET(request: Request) {
  try {
    // Initialize the module registry if not already done
    if (!registryInitialized) {
      await moduleRegistryService.initialize();
      registryInitialized = true;
    }
    
    // Get the sessionId from the URL
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // Get the user ID from the session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the session data
    const { data: session, error: sessionError } = await supabase
      .from('user_learning_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    // Get the most recent event for this session
    const { data: events, error: eventsError } = await supabase
      .from('user_session_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: false })
      .limit(1);
    
    if (eventsError) {
      return NextResponse.json(
        { error: 'Failed to fetch session events' },
        { status: 500 }
      );
    }
    
    // Handle case where somehow events are still empty (shouldn't happen now)
    if (!events || events.length === 0) {
       console.error(`Critical Error: Session ${sessionId} exists but has no events, even after start.`);
       return NextResponse.json(
         { error: 'Internal error: Session data incomplete.' },
         { status: 500 }
       );
    }
    
    const latestEvent = events[0];
    
    // **** ADDED: Get localized submodule title ****
    let submoduleTitle = 'Unknown Submodule';
    const moduleDef = moduleRegistryService.getModule(session.module_id);
    const sourceLang = session.source_language || 'en'; // Determine language for localization
    if (moduleDef) {
      const subDef = moduleDef.submodules.find(sub => sub.id === latestEvent.submodule_id);
      if (subDef) {
        submoduleTitle = subDef.localization[sourceLang]?.title || subDef.title_en;
      }
    }
    // ******************************************
    
    // Return the session data with the current question state AND title
    return NextResponse.json({
      sessionId,
      moduleId: session.module_id,
      submoduleId: latestEvent.submodule_id,
      submoduleTitle,
      modalId: latestEvent.modal_id,
      flavourId: latestEvent.flavour_id,
      questionData: latestEvent.question_data,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'An error occurred' },
      { status: 500 }
    );
  }
} 