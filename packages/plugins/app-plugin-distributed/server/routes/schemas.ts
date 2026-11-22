import { z } from 'zod';

import type {
  DistributedCheckResult,
  DistributedService,
  DistributedStatus,
} from '../../shared/types.js';

// Every object below is `z.object`, which drops keys it does not declare. The route parses its response through
// `DistributedStatusSchema`, so a field a service adds to its description later stays out of the response until it is
// declared here — an allow-list on top of the field-by-field copy in `collectDistributedStatus()`.

const Sharing = z.enum(['local', 'shared', 'unknown']).meta({
  description:
    '`shared` reaches every instance, `local` stays in this process, `unknown` was not declared by the adapter.',
});

const Source = z.enum(['default', 'configured']).meta({
  description:
    '`configured` when the configuration file or the environment sets the value, `default` when the code default applies.',
});

const BackendSchema = z.object({
  name: z.string().meta({ description: 'The configured backend name.' }),
  adapter: z.string(),
  sharing: Sharing,
  registered: z.boolean().meta({
    description: 'Whether a registered plugin provides the adapter.',
  }),
});

const SelectionSchema = z.object({
  consumer: z.string().optional().meta({
    description:
      'Who selected the backend, such as a jobs scope or a queue name; absent when the service cannot tell.',
  }),
  backend: z.string(),
});

export const DistributedServiceSchema: z.ZodType<DistributedService> = z
  .object({
    key: z.enum(['caching', 'concurrency', 'jobs', 'queue', 'realtime']),
    available: z.boolean().meta({
      description: 'Whether this application runs the service.',
    }),
    configPath: z.string().meta({
      description:
        'The configuration path that selects the default backend, such as `queue.default`.',
    }),
    source: Source,
    default: z.string().nullable().meta({
      description:
        'The default backend’s configured name; `null` when the built-in backend runs.',
    }),
    adapter: z.string(),
    sharing: Sharing,
    registered: z.boolean(),
    backends: z.array(BackendSchema).meta({
      description: 'Every configured backend, by name and adapter only.',
    }),
    selections: z.array(SelectionSchema).meta({
      description:
        'Backends other than the default that callers chose by name.',
    }),
  })
  .meta({ ref: 'DistributedService' });

export const DistributedCheckSchema: z.ZodType<DistributedCheckResult> = z
  .object({
    id: z.string().meta({ description: 'Stable check id.' }),
    level: z.enum(['required', 'recommended', 'ok']),
    title: z.string(),
    detail: z.string(),
    params: z
      .record(
        z.string(),
        z.union([z.string(), z.number(), z.array(z.string())]),
      )
      .optional(),
    fix: z
      .object({
        text: z.string(),
        snippet: z.string().optional().meta({
          description:
            'A configuration fragment with placeholders, never a real address or credential.',
        }),
      })
      .optional(),
  })
  .meta({ ref: 'DistributedCheck' });

export const DistributedStatusSchema: z.ZodType<DistributedStatus> = z
  .object({
    mode: z.enum(['single', 'multi']).meta({
      description:
        '`multi` when the configuration shows the intent to run several instances: a shared backend or automatic worker IDs.',
    }),
    services: z.array(DistributedServiceSchema),
    idGeneration: z.object({
      mode: z.enum(['auto', 'manual']),
      workerId: z.number().int().nullable(),
      source: Source,
    }),
    checks: z.array(DistributedCheckSchema),
    extensions: z.record(z.string(), z.unknown()).meta({
      description: 'Data other plugins add, by key.',
    }),
  })
  .meta({ ref: 'DistributedStatus' });
