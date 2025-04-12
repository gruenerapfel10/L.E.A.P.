import { HelperSheet } from '../types';
import { helperSheetRegistry } from './helper-sheet-registry';
import { HelperSheetSchema } from './schemas';
import germanArticles from './definitions/german-articles.json';
import germanAdjectiveDeclension from './definitions/german-adjective-declension.json';
import spanishAdjectiveDeclension from './definitions/spanish-adjective-declension.json';

/**
 * Validates a helper sheet JSON file
 */
function validateHelperSheet(helperSheet: unknown): HelperSheet {
  try {
    return HelperSheetSchema.parse(helperSheet) as HelperSheet;
  } catch (error) {
    console.error(`Error validating helper sheet:`, error);
    throw new Error(`Invalid helper sheet: ${error}`);
  }
}

/**
 * Loads all helper sheets into the registry
 */
export function loadHelperSheets() {
  // Clear existing helper sheets
  helperSheetRegistry.clear();

  // Load and validate all helper sheets
  const helperSheets: unknown[] = [
    germanArticles,
    germanAdjectiveDeclension,
    spanishAdjectiveDeclension,
  ];

  // Register each validated helper sheet
  helperSheets.forEach(sheet => {
    const validatedSheet = validateHelperSheet(sheet);
    helperSheetRegistry.registerHelperSheet(validatedSheet);
  });
} 