import { z } from "zod";
import { SUBJECTS } from "@/lib/constants/subjects";

// Subject validation - using the new comprehensive subject list
const subjectIds = SUBJECTS.map((s) => s.id) as [string, ...string[]];

// Enums as Zod schemas
export const documentTypeSchema = z.enum([
  "book",
  "short_note",
  "paper",
  "jumbled",
]);
export const mediumTypeSchema = z.enum(["sinhala", "english", "tamil"]);
export const subjectTypeSchema = z.enum(subjectIds);
export const happinessLevelSchema = z.enum([
  "helpful",
  "very_helpful",
  "life_saver",
]);

// Document upload schema
export const uploadDocumentSchema = z.object({
  title: z.string().min(1).max(255),
  documentType: documentTypeSchema.optional(),
  subject: subjectTypeSchema.optional(),
  medium: mediumTypeSchema.optional(),
  isFromJumbled: z.boolean().default(false),
});

// Search schema
export const searchSchema = z.object({
  query: z.string().optional(),
  subject: subjectTypeSchema.optional(),
  medium: mediumTypeSchema.optional(),
  documentType: documentTypeSchema.optional(),
  sortBy: z.enum(["popular", "newest", "downloads", "upvotes"]).optional(),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
});

// Comment schema
export const createCommentSchema = z.object({
  documentId: z.string().uuid(),
  happinessLevel: happinessLevelSchema,
  message: z.string().max(500).optional(),
});

// Admin complement schema
export const adminComplementSchema = z.object({
  documentId: z.string().uuid(),
  userId: z.string().uuid(),
  senderDisplayName: z.string().min(1).max(50),
  happinessLevel: happinessLevelSchema,
  message: z.string().min(1).max(500),
});

// Document categorization schema (for admin)
export const categorizeDocumentSchema = z.object({
  documentType: documentTypeSchema,
  subject: subjectTypeSchema,
  medium: mediumTypeSchema,
  title: z.string().min(1).max(255).optional(),
});

// Failed search logging schema
export const logFailedSearchSchema = z.object({
  query: z.string().min(1),
  subject: subjectTypeSchema.optional(),
  medium: mediumTypeSchema.optional(),
  documentType: documentTypeSchema.optional(),
});
