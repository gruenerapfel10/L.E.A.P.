import { promises as fs } from 'fs';
import path from 'path';
import { ModuleDefinition } from '../types';

/**
 * Service responsible for loading and providing access to module definitions
 */
export class ModuleRegistryService {
  private modules: Map<string, ModuleDefinition> = new Map();
  private initialized = false;

  /**
   * Initialize the module registry by loading all module definition files
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Path to module definitions directory
      const definitionsDir = path.join(process.cwd(), 'src/lib/learning/registry/definitions');
      const files = await fs.readdir(definitionsDir);
      
      // Load all JSON files in the definitions directory
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(definitionsDir, file);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const moduleDefinition = JSON.parse(fileContent) as ModuleDefinition;
          
          this.modules.set(moduleDefinition.id, moduleDefinition);
          console.log(`Loaded module: ${moduleDefinition.id}`);
        }
      }
      
      this.initialized = true;
      console.log(`Module Registry initialized with ${this.modules.size} modules`);
    } catch (error) {
      console.error('Failed to initialize Module Registry:', error);
      throw error;
    }
  }

  /**
   * Get a specific module by ID
   */
  getModule(id: string): ModuleDefinition | undefined {
    if (!this.initialized) {
      throw new Error('Module Registry not initialized. Call initialize() first.');
    }
    return this.modules.get(id);
  }

  /**
   * Get all available modules
   */
  getAllModules(): ModuleDefinition[] {
    if (!this.initialized) {
      throw new Error('Module Registry not initialized. Call initialize() first.');
    }
    return Array.from(this.modules.values());
  }

  /**
   * Get a module with titles localized to the specified language
   * Falls back to English if the requested language is not available
   */
  getLocalizedModule(id: string, langCode: string): ModuleDefinition | undefined {
    const module = this.getModule(id);
    if (!module) return undefined;

    // Deep copy the module to avoid mutating the original
    const localizedModule = JSON.parse(JSON.stringify(module)) as ModuleDefinition;
    
    // Localize module title
    if (module.localization[langCode]?.title) {
      localizedModule.title_en = module.localization[langCode].title;
    }
    
    // Localize submodule titles
    for (let i = 0; i < localizedModule.submodules.length; i++) {
      const submodule = localizedModule.submodules[i];
      if (module.submodules[i].localization[langCode]?.title) {
        submodule.title_en = module.submodules[i].localization[langCode].title;
      }
    }
    
    return localizedModule;
  }

  /**
   * Get modules that support a specific source language
   */
  getModulesForLanguage(langCode: string): ModuleDefinition[] {
    return this.getAllModules().filter(module => 
      module.supportedSourceLanguages.includes(langCode)
    );
  }
}

// Create a singleton instance for use throughout the application
export const moduleRegistryService = new ModuleRegistryService(); 