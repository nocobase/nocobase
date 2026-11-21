import { z } from 'zod';

import type { ConfigInspectorSnapshot } from '../../shared/snapshot.js';

const source = z
  .enum(['file', 'environment', 'default', 'unknown'])
  .meta({ description: 'Where the running value came from.' });

export const snapshotSchema: z.ZodType<ConfigInspectorSnapshot> = z
  .object({
    file: z.object({
      path: z.string().nullable().meta({
        description: 'The configuration file, relative to the deployment root.',
      }),
      exists: z.boolean(),
      text: z
        .string()
        .meta({ description: 'The file with credentials masked.' }),
    }),
    example: z
      .string()
      .nullable()
      .meta({ description: 'config.example.yml with credentials masked.' }),
    loadedAt: z.string().nullable(),
    reloads: z.number().int(),
    settings: z.array(
      z.object({
        path: z.string(),
        value: z.string().meta({ description: 'The running value, redacted.' }),
        source,
        secret: z.boolean(),
        customized: z.boolean(),
        variable: z.string().optional(),
        fileValue: z.string().optional(),
        firstStartOnly: z.boolean().optional(),
      }),
    ),
    variables: z.array(
      z.object({
        name: z.string(),
        path: z.string(),
        description: z.string().optional(),
        secret: z.boolean(),
        firstStartOnly: z.boolean(),
        set: z.boolean(),
        value: z.string().nullable(),
      }),
    ),
    sections: z.array(
      z.object({
        key: z.string(),
        comment: z.string().optional(),
        inExample: z.boolean(),
      }),
    ),
  })
  .meta({ ref: 'ConfigInspectorSnapshot' });
