import { z } from 'zod';
import type {
  DemoConfigurationView,
  DemoWriteRule,
  DemoDailySchedule,
  DemoChatConfiguration,
} from './types.js';

const operation = z.enum(['insert', 'update', 'delete']);
const tableName = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-z][a-z0-9_]*$/u);
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
export const ChatConfiguration: z.ZodType<DemoChatConfiguration> =
  z.strictObject({
    enabled: z.boolean(),
    model: z
      .strictObject({
        modelService: z.string().min(1).max(256),
        model: z.string().min(1).max(256),
      })
      .nullable(),
    tools: z.record(
      z.string().min(1).max(128),
      z.enum(['read', 'mock', 'deny']),
    ),
  });
export const ConfigurationInput: Record<
  'rules' | 'tables' | 'mocks' | 'schedule' | 'chat',
  z.ZodType<{
    expectedRevision: number;
    value:
      | DemoWriteRule[]
      | string[]
      | Record<string, boolean>
      | DemoDailySchedule
      | DemoChatConfiguration;
  }>
> = {
  tables: z.strictObject({
    expectedRevision: z.number().int().nonnegative(),
    value: z.array(tableName).max(100),
  }),
  chat: z.strictObject({
    expectedRevision: z.number().int().nonnegative(),
    value: ChatConfiguration,
  }),
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
  }),
};
export const ConfigurationView: z.ZodType<DemoConfigurationView> = z
  .object({
    busy: z.boolean(),
    revision: z.number(),
    rules: z.array(WriteRule),
    tables: z.array(tableName),
    mocks: z.record(z.string(), z.boolean()),
    schedule: DailySchedule.nullable(),
    chat: ChatConfiguration,
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
    nextRun: z.string().nullable(),
  })
  .meta({ ref: 'DemoModeConfiguration' });
