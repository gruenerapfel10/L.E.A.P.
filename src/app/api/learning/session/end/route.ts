import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StatisticsService } from '@/lib/learning/statistics/statistics.service';
import { moduleRegistryService } from '@/lib/learning/registry/module-registry.service';
import { modalSchemaRegistryService } from '@/lib/learning/modals/registry.service';
import { initializeLearningRegistries } from '@/lib/learning/registry/init';

export async function POST(request: Request) {
  try {
    await initializeLearningRegistries();

    // Parse the request body
    const body = await request.json();
    const { sessionId } = body;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // Create Supabase client for this request
    const supabase = await createClient();
    
    // Get the user ID to potentially verify ownership of the session (optional, but recommended)
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // End the learning session using the static method
    await StatisticsService.endSession(supabase, sessionId);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Session ended successfully'
    });
  } catch (error) {
    console.error('Error ending learning session:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
} 