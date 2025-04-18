import { ModalTypeDefinition } from './types';

// Import all modal schema definitions directly
import { multipleChoiceModalDefinition } from './definitions/multiple-choice.modal';
import { multipleChoiceVarModalDefinition } from './definitions/multiple-choice-var.modal';
import { trueFalseModalDefinition } from './definitions/true-false.modal';
import { fillInGapModalDefinition } from './definitions/fill-in-gap.modal';
import { identifyErrorModalDefinition } from './definitions/identify-error.modal';
import { replaceErrorModalDefinition } from './definitions/replace-error.modal';
import { speakingConversationModalDefinition } from './definitions/speaking-conversation.modal';
import { listeningTranscribeModalDefinition } from './definitions/listening-transcribe.modal';
import { listeningErrorModalDefinition } from './definitions/listening-error.modal';

/**
 * Service responsible for loading and providing access to modal schema definitions
 */
export class ModalSchemaRegistryService {
  private schemas: Map<string, ModalTypeDefinition> = new Map();
  private initialized = false;

  /**
   * Initialize the modal schema registry by loading all definition files
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Add TypeScript definitions directly
      this.schemas.set(multipleChoiceModalDefinition.id, multipleChoiceModalDefinition);
      console.log(`Loaded TS modal schema: ${multipleChoiceModalDefinition.id}`);
      
      this.schemas.set(multipleChoiceVarModalDefinition.id, multipleChoiceVarModalDefinition);
      console.log(`Loaded TS modal schema: ${multipleChoiceVarModalDefinition.id}`);
      
      // Load the new modal types
      this.schemas.set(trueFalseModalDefinition.id, trueFalseModalDefinition);
      console.log(`Loaded TS modal schema: ${trueFalseModalDefinition.id}`);
      
      this.schemas.set(fillInGapModalDefinition.id, fillInGapModalDefinition);
      console.log(`Loaded TS modal schema: ${fillInGapModalDefinition.id}`);
      
      this.schemas.set(identifyErrorModalDefinition.id, identifyErrorModalDefinition);
      console.log(`Loaded TS modal schema: ${identifyErrorModalDefinition.id}`);
      
      this.schemas.set(replaceErrorModalDefinition.id, replaceErrorModalDefinition);
      console.log(`Loaded TS modal schema: ${replaceErrorModalDefinition.id}`);
      
      // Add the speaking conversation modal
      this.schemas.set(speakingConversationModalDefinition.id, speakingConversationModalDefinition);
      console.log(`Loaded TS modal schema: ${speakingConversationModalDefinition.id}`);
      
      // Add the new listening transcribe modal
      this.schemas.set(listeningTranscribeModalDefinition.id, listeningTranscribeModalDefinition);
      console.log(`Loaded TS modal schema: ${listeningTranscribeModalDefinition.id}`);

      // Add the new listening error modal
      this.schemas.set(listeningErrorModalDefinition.id, listeningErrorModalDefinition);
      console.log(`Loaded TS modal schema: ${listeningErrorModalDefinition.id}`);
      
      this.initialized = true;
      console.log(`Modal Schema Registry initialized with ${this.schemas.size} hardcoded schemas`);
    } catch (error) {
      console.error('Failed to initialize Modal Schema Registry:', error);
      this.schemas.clear();
      this.initialized = false;
      throw error;
    }
  }

  /**
   * Get a specific modal schema by ID
   */
  getSchema(id: string): ModalTypeDefinition | undefined {
    if (!this.initialized) {
      console.warn('Modal Schema Registry potentially accessed before initialization.');
      return undefined;
    }
    return this.schemas.get(id);
  }

  /**
   * Get all available modal schemas
   */
  getAllSchemas(): ModalTypeDefinition[] {
    if (!this.initialized) {
      console.warn('Modal Schema Registry potentially accessed before initialization.');
      return [];
    }
    return Array.from(this.schemas.values());
  }
  
  /**
   * Get schemas filtered by interaction type
   */
  getSchemasByInteractionType(interactionType: string): ModalTypeDefinition[] {
    if (!this.initialized) {
      console.warn('Modal Schema Registry potentially accessed before initialization.');
      return [];
    }
    return Array.from(this.schemas.values()).filter(
      schema => schema.interactionType === interactionType
    );
  }
  
  /**
   * Get unique modal families that have at least one schema of the specified interaction type
   */
  getModalFamiliesWithInteractionType(interactionType: string): string[] {
    if (!this.initialized) {
      console.warn('Modal Schema Registry potentially accessed before initialization.');
      return [];
    }
    
    // Get schemas of the specified interaction type
    const schemasOfType = this.getSchemasByInteractionType(interactionType);
    
    // Extract unique modal families
    const families = new Set<string>();
    schemasOfType.forEach(schema => {
      families.add(schema.modalFamily || schema.id); // Use ID as fallback if no family defined
    });
    
    return Array.from(families);
  }
  
  /**
   * Get schemas from a specific family filtered by interaction type
   */
  getSchemasFromFamilyByInteractionType(family: string, interactionType: string): ModalTypeDefinition[] {
    if (!this.initialized) {
      console.warn('Modal Schema Registry potentially accessed before initialization.');
      return [];
    }
    
    return Array.from(this.schemas.values()).filter(
      schema => (schema.modalFamily || schema.id) === family && 
                schema.interactionType === interactionType
    );
  }
}

// Create a singleton instance for use throughout the application
export const modalSchemaRegistryService = new ModalSchemaRegistryService(); 