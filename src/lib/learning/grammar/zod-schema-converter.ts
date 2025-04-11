import { z } from 'zod';
import { Schema, SchemaType } from '@google/generative-ai';
import { isDebugMode } from '@/lib/utils/debug';

const DEBUG_SCHEMA_CONVERTER = isDebugMode('SCHEMA_CONVERTER');

// Helper type mapping from simple types to Google's Schema types
const typeMap: { [key: string]: SchemaType | undefined } = {
  string: SchemaType.STRING,
  number: SchemaType.NUMBER,
  integer: SchemaType.INTEGER,
  boolean: SchemaType.BOOLEAN,
  array: SchemaType.ARRAY,
  object: SchemaType.OBJECT,
};

/**
 * Converts a Zod schema into the Schema object format expected by Google's SDK 
 * for the `responseSchema` field in GenerationConfig.
 * 
 * NOTE: This is a simplified converter and might have limitations with complex Zod features 
 * like deep recursion, unions, intersections, etc., which might not be fully supported 
 * by the Gemini `responseSchema` parameter itself.
 * 
 * @param zodSchema The Zod schema to convert.
 * @returns Schema object compatible with Gemini SDK.
 */
export function convertZodToGoogleSchema(zodSchema: z.ZodType<any, any>): Schema {
  const definition = zodSchema._def;
  const description = zodSchema.description;
  let isNullable = zodSchema.isOptional() || zodSchema.isNullable();

  if (DEBUG_SCHEMA_CONVERTER) {
      console.log(`[Schema Converter Debug] Converting Zod type: ${definition.typeName}`);
  }

  switch (definition.typeName) {
    case z.ZodFirstPartyTypeKind.ZodString:
      return { type: SchemaType.STRING, description, nullable: isNullable };

    case z.ZodFirstPartyTypeKind.ZodNumber:
       // Determine if it should be INTEGER or NUMBER (default to NUMBER)
       const isInt = definition.checks?.some((check: { kind: string }) => check.kind === 'int');
       return { type: isInt ? SchemaType.INTEGER : SchemaType.NUMBER, description, nullable: isNullable };
       
    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return { type: SchemaType.BOOLEAN, description, nullable: isNullable };

    case z.ZodFirstPartyTypeKind.ZodObject:
      const properties: { [k: string]: Schema } = {};
      const requiredProps: string[] = [];
      const shape = definition.shape();
      for (const key in shape) {
        const propSchema = shape[key];
        // Recursively convert property schemas
        properties[key] = convertZodToGoogleSchema(propSchema);
        // Check if the property is required (not optional/nullable in Zod)
        if (!propSchema.isOptional() && !propSchema.isNullable()) {
          requiredProps.push(key);
        }
        // Ensure nested schema nullability is respected if possible
        // Note: Google Schema nullability might apply top-level
         properties[key].nullable = propSchema.isOptional() || propSchema.isNullable();
      }
      return {
        type: SchemaType.OBJECT,
        properties,
        required: requiredProps,
        description,
        nullable: isNullable
      };

    case z.ZodFirstPartyTypeKind.ZodArray:
      const itemSchema = definition.type;
      return {
        type: SchemaType.ARRAY,
        items: convertZodToGoogleSchema(itemSchema), // Convert the item schema
        description,
        nullable: isNullable
      };

    case z.ZodFirstPartyTypeKind.ZodOptional:
    case z.ZodFirstPartyTypeKind.ZodNullable:
        // Recurse on the inner type, the nullability is handled by the `isNullable` flag
        return convertZodToGoogleSchema(definition.innerType);

    case z.ZodFirstPartyTypeKind.ZodLazy: 
        // Handle potentially recursive schemas defined with z.lazy()
        // Recurse on the getter function for the schema
        // NOTE: Deep recursion might still hit limitations in Gemini's schema support.
         if (DEBUG_SCHEMA_CONVERTER) {
             console.log(`[Schema Converter Debug] Handling ZodLazy...`);
         }
        return convertZodToGoogleSchema(definition.getter());

    // TODO: Add handling for other Zod types if needed (Enum, Union, Literal, etc.)
    // These might map to enums or specific string/number formats in Google Schema
    case z.ZodFirstPartyTypeKind.ZodLiteral:
        const literalValue = definition.value;
        // Represent as a plain string. Rely on description/prompt for constraint.
        const literalDesc = `${description} (Literal: ${JSON.stringify(literalValue)})`;
        return { type: SchemaType.STRING, description: literalDesc, nullable: isNullable };

     case z.ZodFirstPartyTypeKind.ZodEnum:
         // Represent as a plain string. Rely on description/prompt for constraint.
         const enumDesc = `${description} (Enum: [${definition.values.join(', ')}])`;
        return { type: SchemaType.STRING, description: enumDesc, nullable: isNullable };
        
     case z.ZodFirstPartyTypeKind.ZodUnion:
         // Simple union handling - potentially map to common type or ignore for now
         // Gemini's Schema might not directly support complex unions easily in responseSchema
         console.warn("ZodUnion conversion is simplified/experimental.");
         // Could try to find a common base type or just fallback
         return { type: SchemaType.STRING, description: `${description} (Union type, fallback)`, nullable: isNullable };

    default:
      console.warn(`Unsupported Zod type: ${definition.typeName}. Defaulting to STRING.`);
      return { type: SchemaType.STRING, description: `${description} (Unsupported type fallback)`, nullable: true }; // Default nullable to true for safety
  }
}

// Remove the old Gemini function calling converter and extractor
// export function zodToJsonSchemaForGemini(...) { ... }
// export function extractJsonFromGeminiResponse(...) { ... }


// Basic load confirmation
console.log("DEBUG: zod-schema-converter.ts loaded (Google Schema direct converter)"); 