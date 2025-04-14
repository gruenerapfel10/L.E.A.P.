import { moduleRegistryService } from '../registry/module-registry.service';
import { SessionEvent } from '../types/index';
import { modalSchemaRegistryService } from '../modals/registry.service';
import { shuffleArray } from '../../utils/random';
import { ModalTypeDefinition, InteractionTypeTag } from '../modals/types';

interface PickNextParams {
  userId: string;
  moduleId: string;
  targetLanguage: string;
  sourceLanguage: string;
  history?: SessionEvent[];
}

interface PickResult {
  submoduleId: string;
  modalSchemaId: string;
}

/**
 * Strategy interface for different picking algorithms
 */
interface PickerStrategy {
  pickNext(params: PickNextParams): Promise<PickResult>;
}

/**
 * Simple random strategy that picks a random submodule and a random supported modal schema,
 * considering modal families for balanced picking and interaction type categories.
 */
class RandomStrategy implements PickerStrategy {
  // Array of interaction types to randomly select from
  private interactionTypes: InteractionTypeTag[] = ['reading', 'writing', 'listening', 'speaking'];
  
  async pickNext(params: PickNextParams): Promise<PickResult> {
    const { moduleId, targetLanguage } = params;
    
    // Get the module definition
    const module = moduleRegistryService.getModule(moduleId, targetLanguage);
    if (!module || !module.submodules || module.submodules.length === 0) {
      throw new Error(`Module not found or has no submodules for ID ${moduleId} and language ${targetLanguage}`);
    }
    
    // Randomly select a submodule
    const submoduleIndex = Math.floor(Math.random() * module.submodules.length);
    const submodule = module.submodules[submoduleIndex];
    const supportedIds = submodule?.supportedModalSchemaIds;
    
    if (!submodule || !supportedIds || supportedIds.length === 0) {
      throw new Error(`Submodule ${submodule?.id || 'unknown'} has no supported modal schemas.`);
    }

    // Get all dynamically loaded schemas from the registry
    const allLoadedSchemas = modalSchemaRegistryService.getAllSchemas();
    if (allLoadedSchemas.length === 0) {
        console.error("[Picker] FATAL: ModalSchemaRegistryService has not been initialized or found no schemas.");
        throw new Error("Modal schema registry is not initialized or empty.");
    }
    const loadedSchemaMap = new Map(allLoadedSchemas.map(s => [s.id, s]));

    // Filter the submodule's supported IDs to only those actually loaded
    const availableSupportedSchemas: ModalTypeDefinition[] = supportedIds
        .map((id: string) => loadedSchemaMap.get(id))
        .filter((schema: ModalTypeDefinition | undefined): schema is ModalTypeDefinition => !!schema);

    if (availableSupportedSchemas.length === 0) {
        console.warn(`[Picker] Submodule ${submodule.id} supports schemas [${supportedIds.join(', ')}], but none of these are currently loaded/available. Loaded IDs: [${Array.from(loadedSchemaMap.keys()).join(', ')}]`);
        throw new Error(`No currently available/loaded modal schemas found for submodule ${submodule.id}.`);
    }

    // --- New Logic: First select interaction type, then family, then schema --- 
    
    // Get the interaction types available in this submodule's supported schemas
    const availableInteractionTypes = new Set<InteractionTypeTag>();
    availableSupportedSchemas.forEach(schema => {
      if (schema.interactionType) {
        availableInteractionTypes.add(schema.interactionType as InteractionTypeTag);
      }
    });
    
    // If no interaction types available, fall back to old behavior
    if (availableInteractionTypes.size === 0) {
      console.warn("[Picker] No interaction types found in available schemas. Using fallback logic.");
      return this.pickByFamilyOnly(submodule, availableSupportedSchemas);
    }
    
    // 1. Randomly select an interaction type from available ones
    const interactionTypesArray = Array.from(availableInteractionTypes);
    const selectedInteractionTypeIndex = Math.floor(Math.random() * interactionTypesArray.length);
    const selectedInteractionType = interactionTypesArray[selectedInteractionTypeIndex];
    
    console.log(`[Picker Debug] Selected interaction type: ${selectedInteractionType}`);
    
    // 2. Filter schemas by the selected interaction type
    const schemasOfSelectedType = availableSupportedSchemas.filter(
      schema => schema.interactionType === selectedInteractionType
    );
    
    // 3. Get unique modal families for the selected interaction type
    const uniqueFamilies = new Set<string>();
    schemasOfSelectedType.forEach((schema: ModalTypeDefinition) => {
        uniqueFamilies.add(schema.modalFamily || schema.id); // Use ID as fallback family
    });
    const familiesArray = Array.from(uniqueFamilies);
    
    if (familiesArray.length === 0) {
        // Should not happen given our filtering, but safety check
        console.error(`[Picker] Internal Error: No modal families found for interaction type ${selectedInteractionType}.`);
        throw new Error(`Internal error during picker interaction type selection.`);
    }
    
    console.log(`[Picker Debug] Available families for interaction type ${selectedInteractionType}: [${familiesArray.join(', ')}]`);
    
    // 4. Randomly select a family
    const selectedFamilyIndex = Math.floor(Math.random() * familiesArray.length);
    const selectedFamily = familiesArray[selectedFamilyIndex];
    console.log(`[Picker Debug] Selected family: ${selectedFamily}`);
    
    // 5. Filter available schemas to both the selected interaction type AND family
    const schemasInFamilyAndType = schemasOfSelectedType.filter((schema: ModalTypeDefinition) =>
        (schema.modalFamily || schema.id) === selectedFamily
    );
    
    if (schemasInFamilyAndType.length === 0) {
        // Should not happen given our filtering, but safety check
        console.error(`[Picker] Internal Error: No schemas found for selected family '${selectedFamily}' with interaction type '${selectedInteractionType}'.`);
        throw new Error(`Internal error during picker family and interaction type selection.`);
    }
    
    // 6. Randomly select a specific modal schema from filtered ones
    const schemaIndex = Math.floor(Math.random() * schemasInFamilyAndType.length);
    const selectedSchema = schemasInFamilyAndType[schemaIndex];
    const modalSchemaId = selectedSchema.id;
    
    console.log(`[Picker] Picked: Submodule=${submodule.id}, ModalSchema=${modalSchemaId} (InteractionType=${selectedInteractionType}, Family=${selectedFamily})`);
    
    return {
      submoduleId: submodule.id,
      modalSchemaId,
    };
  }
  
  /**
   * Legacy fallback method to pick by family only (no interaction type)
   */
  private pickByFamilyOnly(submodule: any, availableSupportedSchemas: ModalTypeDefinition[]): PickResult {
    // 1. Get unique modal families from the available schemas
    const uniqueFamilies = new Set<string>();
    availableSupportedSchemas.forEach((schema: ModalTypeDefinition) => {
        uniqueFamilies.add(schema.modalFamily || schema.id); // Use ID as fallback family
    });
    const familiesArray = Array.from(uniqueFamilies);

    if (familiesArray.length === 0) {
        // Should not happen if availableSupportedSchemas is not empty, but safety check
        throw new Error(`No modal families could be determined for submodule ${submodule.id}.`);
    }

    console.log(`[Picker Debug] Available families for submodule ${submodule.id}: [${familiesArray.join(', ')}]`);

    // 2. Randomly select a family
    const selectedFamilyIndex = Math.floor(Math.random() * familiesArray.length);
    const selectedFamily = familiesArray[selectedFamilyIndex];
    console.log(`[Picker Debug] Selected family: ${selectedFamily}`);

    // 3. Filter available schemas to the selected family
    const schemasInFamily = availableSupportedSchemas.filter((schema: ModalTypeDefinition) =>
        (schema.modalFamily || schema.id) === selectedFamily
    );

    if (schemasInFamily.length === 0) {
        // Should not happen if logic is correct, but safety check
        console.error(`[Picker] Internal Error: No schemas found for selected family '${selectedFamily}' despite it being identified.`);
        throw new Error(`Internal error during picker family selection.`);
    }
    
    // 4. Randomly select a specific modal schema ID from within that family
    const schemaIndexInFamily = Math.floor(Math.random() * schemasInFamily.length);
    const selectedSchema = schemasInFamily[schemaIndexInFamily];
    const modalSchemaId = selectedSchema.id;
    
    console.log(`[Picker] Picked: Submodule=${submodule.id}, ModalSchema=${modalSchemaId} (Family=${selectedFamily}, Options in family: ${schemasInFamily.map(s => s.id).join(', ')})`);
    
    return {
      submoduleId: submodule.id,
      modalSchemaId,
    };
  }
}

/**
 * Spaced repetition strategy - Placeholder, needs rework for new model
 * TODO: Adapt this strategy to prioritize based on modalSchemaId success rates
 */
class SpacedRepetitionStrategy implements PickerStrategy {
  async pickNext(params: PickNextParams): Promise<PickResult> {
    console.warn("SpacedRepetitionStrategy needs rework for the new modal schema model. Falling back to Random.");
    // For now, fall back to random
    return new RandomStrategy().pickNext(params);
    // TODO: Implement logic based on history analysis of (submoduleId, modalSchemaId) pairs
  }
}

/**
 * Service responsible for deciding which submodule and modal schema to show next
 */
export class PickerAlgorithmService {
  private strategies: Record<string, PickerStrategy> = {
    'random': new RandomStrategy(),
    'spaced-repetition': new SpacedRepetitionStrategy()
  };
  
  private activeStrategy: string = 'random';
  
  constructor() {
    // REMOVED: Initialize calls moved elsewhere
    // Ensure registries are initialized before use - might need a better async handling pattern
    // moduleRegistryService.initialize().catch(err => console.error("Failed to init ModuleRegistry in Picker", err));
    // modalSchemaRegistryService.initialize().catch(err => console.error("Failed to init ModalSchemaRegistry in Picker", err));
  }
  
  /**
   * Set the active picking strategy
   */
  setStrategy(strategyName: string): void {
    if (!this.strategies[strategyName]) {
      throw new Error(`Strategy not found: ${strategyName}`);
    }
    this.activeStrategy = strategyName;
    console.log(`Picker Algorithm set to ${strategyName} strategy`);
  }
  
  /**
   * Add a new picking strategy
   */
  registerStrategy(name: string, strategy: PickerStrategy): void {
    this.strategies[name] = strategy;
    console.log(`Registered new picker strategy: ${name}`);
  }
  
  /**
   * Get the next submodule and modal schema ID to show
   */
  async getNextStep(params: PickNextParams): Promise<PickResult> {
    // Ensure the selected strategy exists
    const strategy = this.strategies[this.activeStrategy];
    if (!strategy) {
        console.error(`Active strategy '${this.activeStrategy}' not found. Falling back to random.`);
        return this.strategies['random'].pickNext(params); 
    }
    return strategy.pickNext(params);
  }
}

// Create a singleton instance for use throughout the application
export const pickerAlgorithmService = new PickerAlgorithmService(); 