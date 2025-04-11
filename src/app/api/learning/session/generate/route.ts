import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { questionGenerationService } from '@/lib/learning/generation/question-generation.service';
import { modalSchemaRegistryService } from '@/lib/learning/modals/registry.service';
import { moduleRegistryService } from '@/lib/learning/registry/module-registry.service';
import { GenerationResult } from '@/lib/learning/generation/question-generation.service';
import { GenerationConstraints } from '@/lib/learning/generation/structure-constraint.service';

// Define expected request body schema
const generateBodySchema = z.object({
  sessionId: z.string(),
  moduleId: z.string(),
  targetLanguage: z.string(),
  sourceLanguage: z.string(),
  forcedSubmoduleId: z.string(),
  forcedModalSchemaId: z.string(),
  forcedConstraints: z.custom<GenerationConstraints>().optional()
});

export async function POST(request: NextRequest) {
  // Ensure registries are initialized
  await Promise.all([
    modalSchemaRegistryService.initialize(),
    moduleRegistryService.initialize(),
  ]);

  try {
    const body = await request.json();
    const validation = generateBodySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }

    const {
      sessionId, 
      moduleId,
      targetLanguage,
      sourceLanguage,
      forcedSubmoduleId,
      forcedModalSchemaId,
      forcedConstraints
    } = validation.data;

    console.log(`[Debug Generate] Request for session ${sessionId}: Force Submodule=${forcedSubmoduleId}, Modal=${forcedModalSchemaId}`);
    if (forcedConstraints) {
         console.log(`[Debug Generate] Forced Constraints Provided:`, forcedConstraints);
    }

    // Validate forced IDs exist
    const module = moduleRegistryService.getModule(moduleId);
    if (!module) {
       return NextResponse.json({ error: `Module ${moduleId} not found.` }, { status: 404 });
    }
    const submodule = module.submodules.find(sm => sm.id === forcedSubmoduleId);
    if (!submodule) {
       return NextResponse.json({ error: `Submodule ${forcedSubmoduleId} not found in module ${moduleId}.` }, { status: 404 });
    }
    const schema = modalSchemaRegistryService.getSchema(forcedModalSchemaId);
    if (!schema) {
        return NextResponse.json({ error: `Modal Schema ${forcedModalSchemaId} not found.` }, { status: 404 });
    }
    if (!submodule.supportedModalSchemaIds.includes(forcedModalSchemaId)){
        return NextResponse.json({ error: `Modal Schema ${forcedModalSchemaId} not supported by submodule ${forcedSubmoduleId}.` }, { status: 400 });
    }

    // Generate the question using the forced parameters AND constraints
    const { questionData, debugInfo }: GenerationResult = await questionGenerationService.generateQuestion({
        moduleId,
        submoduleId: forcedSubmoduleId,
        modalSchemaId: forcedModalSchemaId,
        targetLanguage,
        sourceLanguage,
        difficulty: forcedConstraints?.difficulty || 'intermediate',
        forcedConstraints: forcedConstraints ?? undefined
    });

    console.log(`[Debug Generate] Generated Question Data for ${sessionId}:`, questionData);
    // Also log debug info if available
    if (debugInfo) {
        console.log(`[Debug Generate] Generation Debug Info:`, debugInfo);
    }

    // Return the generated data AND the debug info
    return NextResponse.json({ 
      success: true, 
      newQuestionData: questionData, 
      newSubmoduleId: forcedSubmoduleId,
      newModalSchemaId: forcedModalSchemaId,
      newSubmoduleTitle: submodule.title_en, 
      newUiComponent: schema.uiComponent,
      // Pass debug info back to the client (debug menu)
      questionDebugInfo: debugInfo 
    });

  } catch (error) {
    console.error('[Debug Generate] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: 'Failed to process generation request', details: errorMessage }, { status: 500 });
  }
} 