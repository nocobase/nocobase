import { z } from 'zod';
import type { JsonObject } from '../../../shared/indexing.js';
import {
  KnowledgeIndexingValidationError,
  type ParsedIndexingSettings,
} from '../../indexing/types.js';

export function parseWith<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new KnowledgeIndexingValidationError(
      result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: 'Invalid indexing value.',
      })),
    );
  return result.data;
}
export const embeddingSchema: z.ZodObject<{
  modelService: z.ZodString;
  model: z.ZodString;
}> = z
  .object({
    modelService: z.string().trim().min(1).max(100),
    model: z.string().trim().min(1).max(200),
  })
  .strict();
export function parseSqliteConfig(value: JsonObject): JsonObject {
  return parseWith(
    z
      .object({
        file: z
          .string()
          .trim()
          .min(1)
          .refine((file) => file !== ':memory:'),
      })
      .strict(),
    value,
  );
}
export function parseSqliteSettings(value: JsonObject): ParsedIndexingSettings {
  const options = parseWith(
    z.object({ embedding: embeddingSchema }).strict(),
    value,
  );
  return {
    options,
    input: {
      kind: 'embedding',
      model: options.embedding,
      encoding: 'kb-chunk-text-v1',
    },
  };
}
