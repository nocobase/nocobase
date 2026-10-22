import { z } from 'zod';

import {
  FOUNDATION_STATUSES,
  type FoundationOverview,
  type FoundationCollectionPage,
} from '../../shared/foundation.js';

export const OverviewQuery: z.ZodObject<
  {
    refresh: z.ZodOptional<z.ZodCodec<z.ZodString, z.ZodBoolean>>;
    countRecords: z.ZodOptional<z.ZodCodec<z.ZodString, z.ZodBoolean>>;
  },
  z.core.$strip
> = z.object({
  refresh: z.stringbool().optional().meta({
    description:
      'Collects again instead of answering a result collected within the last 30 seconds.',
  }),
  countRecords: z.stringbool().optional().meta({
    description:
      'Explicitly query every business table for exact row counts. Omitted on ordinary page loads and refreshes.',
  }),
});

export const CollectionsQuery: z.ZodType<{ offset: number; search: string }> =
  z.object({
    offset: z.coerce.number().int().min(0).max(1_000_000).default(0).meta({
      description:
        'Zero-based offset; each page contains at most 50 Collections.',
    }),
    search: z.string().max(200).default('').meta({
      description:
        'Case-insensitive search across all application Collection names and titles.',
    }),
  });
export const CollectionItemSchema: z.ZodType<
  FoundationCollectionPage['items'][number]
> = z
  .object({
    name: z.string(),
    title: z.string().optional(),
    kind: z.string(),
  })
  .meta({ ref: 'FoundationCollection' });

const FactSchema = z
  .object({
    code: z.string().meta({
      description:
        'What was established, such as `applicationCollections`; the page words it.',
    }),
    params: z
      .record(
        z.string(),
        z.union([
          z.string(),
          z.number(),
          z.array(
            z.union([
              z.string(),
              z.object({ key: z.string(), ns: z.string() }).meta({
                description: 'A translation key in the namespace `ns`.',
              }),
            ]),
          ),
        ]),
      )
      .optional()
      .meta({ description: 'The values the wording quotes.' }),
  })
  .meta({ ref: 'FoundationFact' });

const MetricSchema = z
  .object({
    key: z.string(),
    value: z.number().nullable().meta({
      description: 'Null when it could not be read; never a stand-in zero.',
    }),
    unit: z.enum(['count', 'bytes', 'tokens']),
    complete: z.boolean().meta({
      description:
        'False when part of what it adds up could not be read, so the value is a lower bound.',
    }),
  })
  .meta({ ref: 'FoundationMetric' });

const StatusSchema = z.enum(
  FOUNDATION_STATUSES as ['active', 'needsSetup', 'unused'],
);

const CapabilitySchema = z
  .object({
    key: z.string(),
    status: StatusSchema.nullable().meta({
      description:
        '`active`, `needsSetup` or `unused`; null when usage is not recognized or its evidence could not be read.',
    }),
    title: z
      .union([z.string(), z.object({ key: z.string(), ns: z.string() })])
      .optional(),
    description: z.string().optional(),
    reason: z.string().optional().meta({
      description: 'Why it needs setup or is unused, such as `noChannel`.',
    }),
    facts: z.array(FactSchema),
    metrics: z.array(MetricSchema),
    parts: z.array(
      z.object({
        key: z.string(),
        status: StatusSchema,
        reason: z.string().optional(),
      }),
    ),
    packages: z
      .array(z.object({ name: z.string(), version: z.string().nullable() }))
      .meta({
        description:
          'The NocoBase packages that provide it, at the versions the application resolves.',
      }),
    completeness: z.enum(['complete', 'partial', 'failed']),
    issues: z.array(
      z.object({
        code: z.enum([
          'COLLECTOR_FAILED',
          'COLLECTOR_TIMEOUT',
          'SOURCE_UNREADABLE',
        ]),
        source: z.string().optional().meta({
          description: 'The Collection or service that could not be read.',
        }),
      }),
    ),
  })
  .meta({ ref: 'FoundationCapability' });

export const OverviewSchema: z.ZodType<FoundationOverview> = z
  .object({
    capabilities: z.array(CapabilitySchema).meta({
      description:
        'Built-in adapter observations. The visible band uses runtime-specific availableCapabilities.',
    }),
    availableCapabilities: z.array(CapabilitySchema).optional(),
    moduleSources: z
      .object({
        routes: z.array(
          z.object({
            packageName: z.string(),
            routeName: z.string(),
            providers: z.array(z.string()),
            apiProviders: z.array(z.string()).optional(),
            collections: z.array(z.string()).optional(),
            complete: z.boolean(),
          }),
        ),
        complete: z.boolean(),
      })
      .optional()
      .meta({
        description:
          'Read-only static page dependency evidence. It proves integration references, not execution or per-module runtime counts; unavailable sources remain incomplete. No filesystem paths or source code are returned.',
      }),
    inventory: z
      .object({
        entries: z.array(
          z.object({
            name: z.string(),
            displayName: z.string().optional(),
            description: z.string().optional(),
            version: z.string().nullable(),
            installed: z.boolean(),
            kind: z.enum(['core', 'plugin']),
            origin: z.enum(['nocobase', 'unverified']),
            categories: z.array(z.string()),
            registration: z.enum(['observed', 'unknown']),
            evidence: z.array(
              z.enum([
                'manifest',
                'databaseContribution',
                'apiContribution',
                'foundationRuntime',
                'serverRegistration',
                'clientContribution',
              ]),
            ),
          }),
        ),
        serverRegistrationsComplete: z.boolean().optional(),
        complete: z.boolean(),
        unreadable: z.array(z.string()),
      })
      .optional()
      .meta({
        description:
          'Installed provider manifests and observed current runtime contributions. Registration and category mapping do not prove individual package usage. Pro and custom providers without a catalog entry remain unclassified.',
      }),
    checkedAt: z.string().meta({
      description:
        'When the result was collected; a cached one keeps its time.',
    }),
    recordCountCheckedAt: z.string().optional().meta({
      description:
        'When the retained exact business record count was collected, independently of the overview.',
    }),
    durationMs: z.number(),
    connection: z.literal('default').meta({
      description: 'The database connection the statistics read.',
    }),
  })
  .meta({ ref: 'FoundationOverview' });
