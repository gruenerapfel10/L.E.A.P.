import { promises as fs } from 'fs';
import path from 'path';
import { ModuleDefinition } from '../types';

/**
 * Represents a conceptual module, potentially available in multiple languages.
 */
export interface ModuleConcept {
  id: string;
  title_en: string;
  supportedSourceLanguages: string[];
  supportedTargetLanguages: string[]; // Aggregated list of all target languages this module ID supports
}

/**
 * Service responsible for loading and providing access to module definitions
 */
export class ModuleRegistryService {
  // Store definitions nested: Map<moduleId, Map<targetLanguage, ModuleDefinition>>
  private definitions: Map<string, Map<string, ModuleDefinition>> = new Map();
  private initialized = false;

  /**
   * Initialize the module registry by loading all module definition files
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.definitions.clear(); // Clear previous state if re-initializing
      const definitionsDir = path.join(process.cwd(), 'src/lib/learning/registry/definitions');
      const files = await fs.readdir(definitionsDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(definitionsDir, file);
          try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const moduleDefinition = JSON.parse(fileContent) as ModuleDefinition;

            if (!moduleDefinition.id || !moduleDefinition.supportedTargetLanguages || moduleDefinition.supportedTargetLanguages.length === 0) {
              console.warn(`Skipping module file ${file}: Missing or empty id/supportedTargetLanguages.`);
              continue;
            }

            // Ensure the map for the module ID exists
            if (!this.definitions.has(moduleDefinition.id)) {
              this.definitions.set(moduleDefinition.id, new Map<string, ModuleDefinition>());
            }

            // Store the definition under each supported target language
            const langMap = this.definitions.get(moduleDefinition.id)!;
            for (const lang of moduleDefinition.supportedTargetLanguages) {
              if (langMap.has(lang)) {
                console.warn(`Duplicate definition found for module ${moduleDefinition.id} and target language ${lang}. Check files.`);
                // Potentially decide on overwrite logic here, e.g., prioritize specific filenames?
              }
              langMap.set(lang, moduleDefinition);
              // console.log(`Loaded module: ${moduleDefinition.id} for target language: ${lang}`);
            }
          } catch (parseError) {
             console.error(`Failed to parse module file ${file}:`, parseError);
          }
        }
      }
      
      this.initialized = true;
      console.log(`Module Registry initialized. Found definitions for ${this.definitions.size} unique module IDs.`);
    } catch (error) {
      console.error('Failed to initialize Module Registry:', error);
      // Reset state on error
      this.definitions.clear(); 
      this.initialized = false;
      throw error;
    }
  }

  /**
   * Get a specific module definition for a given ID and target language.
   */
  getModule(id: string, targetLanguage: string): ModuleDefinition | undefined {
    if (!this.initialized) {
      console.error('ModuleRegistryService not initialized. Call initialize() first.');
      // In a real app, might throw or handle differently
      return undefined; 
    }
    return this.definitions.get(id)?.get(targetLanguage);
  }

  /**
   * Gets the map of target languages to definitions for a specific module ID.
   * Useful for finding all available language versions of a module concept.
   */
  getDefinitionsForModuleId(id: string): Map<string, ModuleDefinition> | undefined {
    if (!this.initialized) {
        console.error('ModuleRegistryService not initialized. Call initialize() first.');
        return undefined;
    }
    return this.definitions.get(id);
  }

  /**
   * Get a list of unique module concepts available.
   */
  getUniqueModuleConcepts(): ModuleConcept[] {
    if (!this.initialized) {
      console.error('ModuleRegistryService not initialized.');
      return [];
    }
    
    const concepts: ModuleConcept[] = [];
    for (const [moduleId, langMap] of this.definitions.entries()) {
      if (langMap.size > 0) {
        // Use the definition from the first language found for common properties
        // This assumes title_en and supportedSourceLanguages are consistent across language files for the same ID
        const firstDefinition = langMap.values().next().value as ModuleDefinition;
        const allTargetLangs = Array.from(langMap.keys());
        
        concepts.push({
          id: moduleId,
          title_en: firstDefinition.title_en,
          supportedSourceLanguages: firstDefinition.supportedSourceLanguages || [], // Ensure array exists
          supportedTargetLanguages: allTargetLangs
        });
      }
    }
    return concepts;
  }

  /**
   * Get a module with titles localized to the specified language
   * Falls back to English if the requested language is not available
   * DEPRECATED/NEEDS REWORK: Localization should happen on the specific definition fetched by getModule(id, targetLang)
   */
  // getLocalizedModule(id: string, langCode: string): ModuleDefinition | undefined {
  //   console.warn("getLocalizedModule is deprecated and may not function correctly with the new structure.");
  //   // ... old logic would need significant rework ...
  //   return this.getModule(id); // Placeholder returning the non-localized version
  // }

  /**
   * Get modules that support a specific source language
   * DEPRECATED/NEEDS REWORK: Use getUniqueModuleConcepts and filter externally
   */
  // getModulesForLanguage(langCode: string): ModuleDefinition[] {
  //   console.warn("getModulesForLanguage is deprecated. Use getUniqueModuleConcepts() and filter.");
  //   return [];
  // }

  /**
   * Get all loaded module definitions (primarily for internal use or specific cases).
   * Returns a flat list of all language-specific definitions.
   */
  getAllDefinitionsFlat(): ModuleDefinition[] {
    if (!this.initialized) {
      console.error('ModuleRegistryService not initialized.');
      return [];
    }
    const allDefs: ModuleDefinition[] = [];
    for (const langMap of this.definitions.values()) {
      allDefs.push(...langMap.values());
    }
    return allDefs;
  }
}

// Create a singleton instance for use throughout the application
export const moduleRegistryService = new ModuleRegistryService(); 