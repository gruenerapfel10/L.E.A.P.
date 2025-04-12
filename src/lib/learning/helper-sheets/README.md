# Helper Sheet System

The helper sheet system is a floating library of interconnected help resources that can be linked to modules and to each other through prerequisites.

## Structure

Each helper sheet is defined in a JSON file in the `definitions` directory with the following structure:

```typescript
interface HelperSheet {
  id: string;                // Unique identifier
  title_en: string;         // English title
  localization: {           // Translations
    [lang: string]: {
      title: string;
    }
  };
  content: string;          // Markdown content
  prerequisites?: string[]; // IDs of prerequisite helper sheets
  linkedModules?: string[]; // IDs of linked modules
  metadata?: {
    cefrLevel?: string;    // CEFR level (A1, A2, etc.)
    tags?: string[];       // Categorization tags
    lastUpdated?: string;  // Last updated date
  };
}
```

## Adding New Helper Sheets

1. Create a new JSON file in the `definitions` directory
2. Follow the schema defined in `schemas.ts`
3. Run `npm run validate:helper-sheets` to validate
4. Update `loader.ts` to include your new helper sheet

## Linking Helper Sheets

Helper sheets can be linked in two ways:

1. **Prerequisites**: Add helper sheet IDs to the `prerequisites` array
2. **Module Links**: Add module IDs to the `linkedModules` array

## Example

```json
{
  "id": "german-adjective-declension",
  "title_en": "German Adjective Declension",
  "localization": {
    "de": {
      "title": "Deutsche Adjektivdeklination"
    }
  },
  "content": "# German Adjective Declension\n...",
  "prerequisites": ["german-articles"],
  "linkedModules": ["adjective-declension"],
  "metadata": {
    "cefrLevel": "A2",
    "tags": ["grammar", "adjectives", "declension"],
    "lastUpdated": "2024-03-20"
  }
}
```

## Components

- `FloatingHelperSheet.tsx`: Main component for displaying helper sheets
- `registry.ts`: Singleton service for managing helper sheets
- `loader.ts`: Loads and validates helper sheets
- `schemas.ts`: Zod schemas for validation

## Validation

Run `npm run validate:helper-sheets` to validate all helper sheets in the `definitions` directory. 