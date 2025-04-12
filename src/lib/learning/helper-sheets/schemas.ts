import { z } from 'zod';

// Helper schema for Localization (reused)
const HelperSheetLocalizationSchema = z.record(z.string(), z.object({
  title: z.string(),
  content: z.string(), // Added content validation
}));

// Metadata schema
const HelperSheetMetadataSchema = z.object({
  cefrLevel: z.string().optional(),
  tags: z.array(z.string()).optional(),
  lastUpdated: z.string().optional(), // Consider z.date() if parsing dates
});

// Main HelperSheet Schema
export const HelperSheetSchema = z.object({
  id: z.string(),
  title_en: z.string(),
  content: z.string(), // English content
  localization: HelperSheetLocalizationSchema,
  prerequisites: z.array(z.string()).optional(),
  linkedModules: z.array(z.string()).optional(),
  metadata: HelperSheetMetadataSchema.optional(),
});

// Type inference
export type ZodHelperSheet = z.infer<typeof HelperSheetSchema>;

console.log("DEBUG: Helper Sheet Zod Schema loaded"); 