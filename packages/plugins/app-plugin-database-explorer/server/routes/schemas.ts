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

// Response schemas. They describe what the routes send in the API document at `/api/swagger/docs`; nothing validates a
// response against them.

export const ConnectionSummarySchema: z.ZodType = z
  .object({
    name: z
      .string()
      .meta({ description: 'The connection name used in the URL.' }),
    isDefault: z.boolean().meta({
      description: 'Whether `database.default` names this connection.',
    }),
    dialect: z.string().meta({
      description: 'The database dialect, such as `postgres` or `sqlite`.',
    }),
    driver: z.string().optional(),
    schemaManagement: z.enum(['managed', 'external']).meta({
      description:
        '`managed` connections run migrations; an `external` one is owned elsewhere.',
    }),
    databaseName: z.string().optional().meta({
      description:
        'The logical database or Oracle service the connection targets, never a file path.',
    }),
    schemas: z.array(z.string()).optional(),
    naming: z
      .object({
        underscored: z.boolean().optional(),
        tablePrefix: z.string().optional(),
      })
      .optional(),
    internalTables: z.array(z.string()).optional().meta({
      description:
        'Physical tables the application declared as bookkeeping rather than Collections.',
    }),
  })
  .meta({
    ref: 'DatabaseExplorerConnection',
    description:
      'What a configured connection says about itself. Credentials and host locators are never included.',
  });

export const CollectionEntrySchema: z.ZodType = z
  .object({
    name: z.string(),
    tableName: z.string(),
    schema: z.string(),
    kind: z.enum(['table', 'view', 'materializedView']),
    title: z.string().optional(),
    description: z.string().optional(),
  })
  .meta({ ref: 'DatabaseExplorerCollectionEntry' });

export const CollectionDetailSchema: z.ZodType = z
  .object({
    collection: z
      .object({
        formatVersion: z.literal(1),
        name: z.string(),
        collection: z.record(z.string(), z.unknown()).meta({
          description:
            'The resolved Collection definition: fields, relations, indexes and constraints.',
        }),
        warnings: z.array(z.record(z.string(), z.unknown())).meta({
          description:
            'What the inspection could not report on this dialect, such as foreign keys.',
        }),
      })
      .meta({
        description:
          'The document a committed `database/<connection>/collections/<name>/collection.json` holds, so the two compare field by field.',
      }),
    metadata: z.record(z.string(), z.unknown()).nullable().meta({
      description:
        'The stored supplemental metadata document, or `null` when none is stored.',
    }),
  })
  .meta({ ref: 'DatabaseExplorerCollectionDetail' });

export const PhysicalCollectionDetailSchema: z.ZodType = z
  .object({
    schema: z
      .object({
        formatVersion: z.literal(1),
        name: z.string(),
        physical: z.record(z.string(), z.unknown()).meta({
          description:
            'The physical table or view: columns, indexes, constraints and foreign keys.',
        }),
      })
      .meta({ description: 'The document a committed `schema.json` holds.' }),
  })
  .meta({ ref: 'DatabaseExplorerPhysicalCollection' });
