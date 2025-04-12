import fs from 'fs';
import path from 'path';
import { HelperSheetSchema } from '../src/lib/learning/helper-sheets/schemas';

const HELPER_SHEETS_DIR = path.join(process.cwd(), 'src/lib/learning/helper-sheets/definitions');

/**
 * Validates all helper sheet JSON files in the definitions directory
 */
async function validateHelperSheets() {
  try {
    // Read all JSON files in the directory
    const files = fs.readdirSync(HELPER_SHEETS_DIR)
      .filter(file => file.endsWith('.json'));

    console.log(`Found ${files.length} helper sheet files to validate...`);

    let hasErrors = false;

    // Validate each file
    for (const file of files) {
      const filePath = path.join(HELPER_SHEETS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      try {
        const json = JSON.parse(content);
        HelperSheetSchema.parse(json);
        console.log(`✅ ${file} is valid`);
      } catch (error) {
        hasErrors = true;
        console.error(`❌ ${file} is invalid:`, error);
      }
    }

    if (hasErrors) {
      process.exit(1);
    } else {
      console.log('All helper sheets are valid!');
    }
  } catch (error) {
    console.error('Error validating helper sheets:', error);
    process.exit(1);
  }
}

validateHelperSheets(); 