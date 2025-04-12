import { moduleRegistryService } from './module-registry.service';
import { modalSchemaRegistryService } from '../modals/registry.service';

let registriesInitialized = false;
let initializePromise: Promise<void> | null = null;

/**
 * Initializes the learning registries (module and modal schema) reliably once.
 * Returns a promise that resolves when initialization is complete.
 */
export async function initializeLearningRegistries(): Promise<void> {
  if (registriesInitialized) {
    return Promise.resolve();
  }

  // If initialization is already in progress, return the existing promise
  if (initializePromise) {
    return initializePromise;
  }

  // Start initialization
  initializePromise = (async () => {
    try {
      console.log("[Registry Init] Initializing learning registries...");
      await Promise.all([
        moduleRegistryService.initialize(),
        modalSchemaRegistryService.initialize(),
      ]);
      registriesInitialized = true;
      console.log("[Registry Init] Learning registries initialized successfully.");
    } catch (error) {
      console.error("[Registry Init] Failed to initialize learning registries:", error);
      registriesInitialized = false; // Allow retry on failure
      initializePromise = null; // Reset promise on failure
      // Re-throw the error so callers know initialization failed
      throw new Error("Failed to initialize learning registries"); 
    } finally {
      // Ensure promise is cleared once resolved or rejected, *except* on success
      // On success, we keep initializePromise set so subsequent calls don't re-run async
      if (!registriesInitialized) {
         initializePromise = null; 
      }
    }
  })();

  return initializePromise;
} 