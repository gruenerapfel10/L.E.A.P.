import { NextRequest, NextResponse } from 'next/server';
import { moduleRegistryService } from '@/lib/learning/registry/module-registry.service';

export async function GET(request: NextRequest) {
  // Ensure registry is initialized (ideally done at application startup, but included here for safety)
  // Consider moving initialization to a central place if not already done.
  await moduleRegistryService.initialize(); 

  const { searchParams } = new URL(request.url);
  const moduleId = searchParams.get('moduleId');

  if (!moduleId) {
    return NextResponse.json({ error: 'moduleId query parameter is required' }, { status: 400 });
  }

  try {
    const module = moduleRegistryService.getModule(moduleId);

    if (!module) {
      return NextResponse.json({ error: `Module with ID '${moduleId}' not found` }, { status: 404 });
    }
    
    // Return the full module definition (including submodules and their supported schema IDs)
    return NextResponse.json(module);
  } catch (error) {
    console.error(`Error fetching module ${moduleId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch module data' }, { status: 500 });
  }
} 