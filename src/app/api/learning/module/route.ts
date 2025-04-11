import { NextRequest, NextResponse } from 'next/server';
import { moduleRegistryService, ModuleConcept } from '@/lib/learning/registry/module-registry.service';
import { SubmoduleDefinition, ModuleDefinition } from '@/lib/learning/types';

// Initialize registry once
let registryInitialized = false;
async function initializeRegistry() {
  if (registryInitialized) return;
  try {
    await moduleRegistryService.initialize();
    registryInitialized = true;
  } catch (error) {
    console.error("Failed to initialize module registry for GET module:", error);
    throw new Error("Failed to initialize module registry");
  }
}

export async function GET(request: NextRequest) {
  try {
    await initializeRegistry();

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');

    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 });
    }

    // Try to get the first available definition for the given module ID
    // The Debug menu mainly needs the submodule structure, which we assume is consistent
    // across target languages for the same module concept ID.
    const langMap = moduleRegistryService.getDefinitionsForModuleId(moduleId);
    if (!langMap || langMap.size === 0) {
         console.log(`Module concept not found for ID: ${moduleId}`);
         return NextResponse.json({ error: `Module concept not found: ${moduleId}` }, { status: 404 });
    }
    
    // Get the definition from the first available target language
    const moduleDefinition: ModuleDefinition | undefined = langMap.values().next().value;

    // Add a check to ensure moduleDefinition is valid
    if (!moduleDefinition) {
        console.error(`Could not retrieve a valid definition for module ID: ${moduleId}`);
        return NextResponse.json({ error: `Could not retrieve definition for module: ${moduleId}` }, { status: 404 });
    }
    
    // Return only the necessary data for the debug menu (e.g., submodules list)
    // Avoid sending the entire potentially large definition object
    const responsePayload = {
        id: moduleDefinition.id,
        title_en: moduleDefinition.title_en,
        submodules: moduleDefinition.submodules.map((sub: SubmoduleDefinition) => ({
            id: sub.id,
            title_en: sub.title_en,
            supportedModalSchemaIds: sub.supportedModalSchemaIds || [],
        })),
        supportedTargetLanguages: Array.from(langMap.keys()),
    };
    
    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error('Error fetching module details:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 