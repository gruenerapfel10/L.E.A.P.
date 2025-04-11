import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { statisticsService } from '@/lib/learning/statistics/statistics.service';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { sessionId } = body;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify the session belongs to the user
    const { data: session } = await supabase
      .from('user_learning_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    if (session.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to end this session' },
        { status: 403 }
      );
    }
    
    // End the session
    await statisticsService.endSession(sessionId);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Session ended successfully'
    });
  } catch (error) {
    console.error('Error ending learning session:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'An error occurred' },
      { status: 500 }
    );
  }
} 