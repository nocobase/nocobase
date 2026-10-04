import { z } from 'zod';

import { MAX_COLLECTION_PAGE_SIZE } from '../explorer.js';

export const ConnectionParams: z.ZodObject<
  { connection: z.ZodString },
  z.core.$strip
> = z.object({
  connection: z.string().min(1),
});

export const CollectionParams: z.ZodObject<
  { connection: z.ZodString; collection: z.ZodString },
  z.core.$strip
> = z.object({
  connection: z.string().min(1),
  collection: z.string().min(1),
});

export const ListCollectionsQuery: z.ZodObject<
  {
    pageSize: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    pageToken: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = z.object({
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_COLLECTION_PAGE_SIZE)
    .optional(),
  // Opaque: the server issued it as `meta.nextPageToken` and reads it back
  // unchanged, so only an empty one can be refused here.
  pageToken: z.string().min(1).optional(),
});

export type ListCollectionsQueryInput = z.infer<typeof ListCollectionsQuery>;
