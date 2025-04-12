import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Use server client here
import { StatisticsService } from '@/lib/learning/statistics/statistics.service';
import { modalSchemaRegistryService } from '@/lib/learning/modals/registry.service';

export async function GET(request: Request) {
  const supabase = await createClient();

  // Get user from session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get moduleId from query parameters
  const { searchParams } = new URL(request.url);
  const moduleId = searchParams.get('moduleId');

  if (!moduleId) {
    return NextResponse.json({ error: 'moduleId is required' }, { status: 400 });
  }

  try {
    // Ensure registries that use server features are initialized here
    // (Assuming modalSchemaRegistryService needs initialization)
    await Promise.all([
      modalSchemaRegistryService.initialize(),
      // Add other server-side initializations if needed
    ]);

    // Get performance data using the service and the server client
    const performance = await StatisticsService.getUserModulePerformance(
      supabase,
      user.id,
      moduleId
    );

    return NextResponse.json(performance);

  } catch (error: any) {
    console.error('[API /language-skills/performance] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch performance data' }, { status: 500 });
  }
}
