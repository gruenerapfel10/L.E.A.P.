import { NextResponse } from 'next/server';
import { moduleRegistryService } from '@/lib/learning/registry/module-registry.service';

export async function GET(request: Request) {
  // Get targetLanguage from query parameters
  const { searchParams } = new URL(request.url);
  const targetLanguage = searchParams.get('targetLanguage');

  if (!targetLanguage) {
    return NextResponse.json({ error: 'targetLanguage is required' }, { status: 400 });
  }

  try {
    // Ensure the module registry is initialized (uses fs - safe here)
    await moduleRegistryService.initialize();

    // Get all concepts
    const allConcepts = moduleRegistryService.getUniqueModuleConcepts();

    // Filter concepts based on target language
    const supportedConcepts = allConcepts.filter(concept =>
      concept.supportedTargetLanguages?.includes(targetLanguage)
    );

    return NextResponse.json(supportedConcepts);

  } catch (error: any) {
    console.error('[API /language-skills/concepts] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch language concepts' }, { status: 500 });
  }
}
