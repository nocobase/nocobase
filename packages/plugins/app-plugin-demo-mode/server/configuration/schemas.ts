import { z } from 'zod';
import type {
  DemoConfigurationView,
  DemoWriteRule,
  DemoDailySchedule,
} from './types.js';

const operation = z.enum(['insert', 'update', 'delete']);
export const WriteRule: z.ZodType<DemoWriteRule> = z.strictObject({
  capability: z.string().min(1).max(128),
  operation,
  scope: z.string().min(1).max(128),
});
export const DailySchedule: z.ZodType<DemoDailySchedule> = z.strictObject({
  enabled: z.boolean(),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  timezone: z.string().min(1).max(128),
  language: z.string().min(1).max(16),
});
export const ConfigurationInput: Record<
  'rules' | 'mocks' | 'schedule',
  z.ZodType<{
    expectedRevision: number;
    value: DemoWriteRule[] | Record<string, boolean> | DemoDailySchedule;
    replaceLegacy?: boolean;
  }>
> = {
  rules: z.strictObject({
    expectedRevision: z.number().int().nonnegative(),
    value: z.array(WriteRule).max(200),
  }),
  mocks: z.strictObject({
    expectedRevision: z.number().int().nonnegative(),
    value: z.record(z.string().max(128), z.boolean()),
  }),
  schedule: z.strictObject({
    expectedRevision: z.number().int().nonnegative(),
    value: DailySchedule,
    replaceLegacy: z.boolean().optional(),
  }),
};
export const ConfigurationView: z.ZodType<DemoConfigurationView> = z
  .object({
    busy: z.boolean(),
    revision: z.number(),
    rules: z.array(WriteRule),
    mocks: z.record(z.string(), z.boolean()),
    schedule: DailySchedule.nullable(),
    mode: z.enum(['off', 'read-only', 'observe']),
    fixedTables: z.array(z.string()),
    capabilities: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        table: z.string(),
        operations: z.array(operation),
        scopes: z.array(z.object({ id: z.string(), title: z.string() })),
      }),
    ),
    adapters: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        kind: z.enum(['model', 'tool', 'runner']),
        scope: z.string(),
        defaultEnabled: z.boolean().optional(),
      }),
    ),
    legacySchedule: z
      .object({
        cron: z.string(),
        timezone: z.string().optional(),
        language: z.string().optional(),
      })
      .nullable(),
    nextRun: z.string().nullable(),
  })
  .meta({ ref: 'DemoModeConfiguration' });
