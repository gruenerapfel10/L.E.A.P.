import { moduleRegistryService } from '../registry/module-registry.service';
import { SessionEvent } from '../types/index';
import { modalSchemaRegistryService } from '../modals/registry.service';

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
 * Simple random strategy that picks a random submodule and a random supported modal schema
 */
class RandomStrategy implements PickerStrategy {
  async pickNext(params: PickNextParams): Promise<PickResult> {
    const { moduleId, targetLanguage } = params;
    
    // Get the module definition for the specific target language
    const module = moduleRegistryService.getModule(moduleId, targetLanguage);
    if (!module || !module.submodules || module.submodules.length === 0) {
      throw new Error(`Module not found or has no submodules for ID ${moduleId} and language ${targetLanguage}`);
    }
    
    // Randomly select a submodule
    const submoduleIndex = Math.floor(Math.random() * module.submodules.length);
    const submodule = module.submodules[submoduleIndex];
    
    if (!submodule || !submodule.supportedModalSchemaIds || submodule.supportedModalSchemaIds.length === 0) {
      throw new Error(`Submodule ${submodule?.id || 'unknown'} has no supported modal schemas.`);
    }
    const schemaIndex = Math.floor(Math.random() * submodule.supportedModalSchemaIds.length);
    const modalSchemaId = submodule.supportedModalSchemaIds[schemaIndex];
    
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