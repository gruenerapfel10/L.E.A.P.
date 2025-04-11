import { promises as fs } from 'fs';
import path from 'path';
import { ModalSchemaDefinition } from './types';

/**
 * Service responsible for loading and providing access to modal schema definitions
 */
export class ModalSchemaRegistryService {
  private schemas: Map<string, ModalSchemaDefinition> = new Map();
  private initialized = false;

  /**
   * Initialize the modal schema registry by loading all definition files
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Path to modal schema definitions directory
      const definitionsDir = path.join(process.cwd(), 'src/lib/learning/modals/definitions');
      const files = await fs.readdir(definitionsDir);
      
      // Load all JSON files in the definitions directory
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(definitionsDir, file);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const schemaDefinition = JSON.parse(fileContent) as ModalSchemaDefinition;
          
          this.schemas.set(schemaDefinition.id, schemaDefinition);
          console.log(`Loaded modal schema: ${schemaDefinition.id}`);
        }
      }
      
      this.initialized = true;
      console.log(`Modal Schema Registry initialized with ${this.schemas.size} schemas`);
    } catch (error) {
      console.error('Failed to initialize Modal Schema Registry:', error);
      throw error;
    }
  }

  /**
   * Get a specific modal schema by ID
   */
  getSchema(id: string): ModalSchemaDefinition | undefined {
    if (!this.initialized) {
      throw new Error('Modal Schema Registry not initialized. Call initialize() first.');
    }
    return this.schemas.get(id);
  }

  /**
   * Get all available modal schemas
   */
  getAllSchemas(): ModalSchemaDefinition[] {
    if (!this.initialized) {
      throw new Error('Modal Schema Registry not initialized. Call initialize() first.');
    }
    return Array.from(this.schemas.values());
  }
}

// Create a singleton instance for use throughout the application
export const modalSchemaRegistryService = new ModalSchemaRegistryService(); 