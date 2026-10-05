import { z } from 'zod';

/** Rows a page holds unless the caller asks otherwise, and the most it may ask for. */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

const PageSize = z.coerce
  .number()
  .int()
  .min(1)
  .max(MAX_PAGE_SIZE)
  .default(DEFAULT_PAGE_SIZE);

export const ScheduleParams: z.ZodObject<{ scheduleId: z.ZodString }> =
  z.object({ scheduleId: z.string().min(1) });

export type ScheduleParams = z.infer<typeof ScheduleParams>;

/** The administration table pages by number, so it can show a total. */
export const ScheduleListQuery: z.ZodObject<{
  page: z.ZodDefault<z.ZodCoercedNumber>;
  pageSize: z.ZodDefault<z.ZodCoercedNumber>;
}> = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: PageSize,
});

export type ScheduleListQuery = z.infer<typeof ScheduleListQuery>;

/**
 * The page token is opaque to clients: it encodes how many of the newest occurrences earlier pages already returned.
 * History grows at the head, so an offset can repeat a row a new firing pushed down; it never skips one.
 */
export function encodeOccurrencePageToken(offset: number): string {
  return Buffer.from(`occurrences:${offset}`, 'utf8').toString('base64url');
}

function decodeOccurrencePageToken(token: string): number | undefined {
  const match = /^occurrences:(\d{1,9})$/u.exec(
    Buffer.from(token, 'base64url').toString('utf8'),
  );
  return match ? Number(match[1]) : undefined;
}

/** History is a feed, so it pages by cursor. */
export const OccurrenceListQuery: z.ZodObject<{
  pageSize: z.ZodDefault<z.ZodCoercedNumber>;
  pageToken: z.ZodPipe<
    z.ZodOptional<z.ZodString>,
    z.ZodTransform<number, string | undefined>
  >;
}> = z.object({
  pageSize: PageSize,
  pageToken: z
    .string()
    .optional()
    .transform((token, context): number => {
      if (token === undefined || token === '') return 0;
      const offset = decodeOccurrencePageToken(token);
      if (offset !== undefined) return offset;
      context.addIssue({
        code: 'custom',
        message: 'The page token is not one this server issued.',
      });
      return z.NEVER;
    }),
});

export type OccurrenceListQuery = z.infer<typeof OccurrenceListQuery>;

// Response schemas. They describe what the routes send in the API document at `/api/swagger/docs`; nothing validates a
// response against them.

const targetState = z.enum(['ready', 'disabled', 'missing', 'invalid']);

export const ScheduleSchema: z.ZodType = z
  .object({
    id: z.string(),
    appName: z.string(),
    key: z.string().meta({
      description:
        'The key the Schedule was defined with, unique within the application.',
    }),
    title: z.string(),
    description: z.string().optional(),
    cron: z
      .string()
      .meta({ description: 'The cron expression, evaluated in `timezone`.' }),
    timezone: z
      .string()
      .meta({ description: 'An IANA time zone, such as `Asia/Shanghai`.' }),
    enabled: z.boolean().meta({
      description: 'Whether an administrator has the Schedule switched on.',
    }),
    targetType: z
      .string()
      .meta({ description: 'The registered target type a firing runs.' }),
    lifecycleState: z.enum(['active', 'inactive']).meta({
      description:
        '`inactive` when the application no longer defines the Schedule; `inactiveReason` says why.',
    }),
    inactiveReason: z
      .string()
      .optional()
      .meta({ description: 'Such as `definition_removed`.' }),
    definitionHash: z.string(),
    runCount: z
      .number()
      .int()
      .min(0)
      .meta({ description: 'How many times the Schedule has fired.' }),
    completedCount: z
      .number()
      .int()
      .min(0)
      .meta({ description: 'How many occurrences finished `succeeded`.' }),
    nextRunAt: z.iso.datetime().optional(),
    lastRunAt: z.iso.datetime().optional(),
    scheduleStatus: z.enum(['active', 'paused']).meta({
      description:
        '`active` when the Schedule is enabled and its lifecycle is active; otherwise `paused`.',
    }),
    targetState,
    targetSummary: z.object({
      targetLabel: z.string(),
      description: z.string().optional(),
      href: z.string().optional().meta({
        description: 'An application path to the target, when it has a page.',
      }),
      state: targetState.optional(),
    }),
  })
  .meta({ ref: 'SchedulerSchedule' });

export const SchedulePageMeta: z.ZodType = z
  .object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
  })
  .meta({ ref: 'SchedulerPageMeta' });

export const ScheduleOccurrenceSchema: z.ZodType = z
  .object({
    id: z.string(),
    scheduleId: z.string(),
    status: z.enum([
      'pending',
      'running',
      'waiting',
      'succeeded',
      'failed',
      'skipped',
      'cancelled',
      'timed_out',
      'triggered',
    ]),
    reason: z.string().optional(),
    executionCount: z.number().int().min(0),
    startedAt: z.iso.datetime(),
    acceptedAt: z.iso.datetime().optional(),
    finishedAt: z.iso.datetime().optional(),
    targetReceipt: z.record(z.string(), z.unknown()).optional(),
    resultSummary: z.record(z.string(), z.unknown()).optional(),
    target: z.object({
      type: z.string(),
      reference: z
        .object({ type: z.string(), id: z.string() })
        .optional()
        .meta({
          description:
            'What the target created for this firing, such as a workflow execution.',
        }),
      href: z.string().optional().meta({
        description: 'An application path to `reference`, when it has a page.',
      }),
    }),
  })
  .meta({ ref: 'SchedulerOccurrence' });
