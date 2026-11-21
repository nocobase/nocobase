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

const OCCURRENCE_STATUSES = [
  'pending',
  'running',
  'waiting',
  'succeeded',
  'failed',
  'skipped',
  'cancelled',
  'timed_out',
  'triggered',
] as const;

const occurrenceStatus = z.enum(OCCURRENCE_STATUSES);

/** Where the next page of the application-wide history starts: after the last row of this one. */
export function encodeHistoryPageToken(startedAt: string, id: string): string {
  return Buffer.from(
    JSON.stringify(['history', startedAt, id]),
    'utf8',
  ).toString('base64url');
}

function decodeHistoryPageToken(
  token: string,
): { readonly startedAt: string; readonly id: string } | undefined {
  try {
    const value: unknown = JSON.parse(
      Buffer.from(token, 'base64url').toString('utf8'),
    );
    if (
      Array.isArray(value) &&
      value.length === 3 &&
      value[0] === 'history' &&
      typeof value[1] === 'string' &&
      typeof value[2] === 'string' &&
      !Number.isNaN(Date.parse(value[1]))
    )
      return { startedAt: value[1], id: value[2] };
  } catch {
    // Falls through to the validation issue below.
  }
  return undefined;
}

/**
 * The history of every Schedule, filtered and paged by cursor. A repeated `status` keeps occurrences in any of them;
 * `from` and `to` bound `startedAt`, `from` inclusive and `to` exclusive.
 */
export interface HistoryListQueryValue {
  readonly scheduleId?: string;
  readonly status?: (typeof OCCURRENCE_STATUSES)[number][];
  readonly from?: string;
  readonly to?: string;
  readonly pageSize: number;
  readonly pageToken?: { readonly startedAt: string; readonly id: string };
}

export const HistoryListQuery: z.ZodType<
  HistoryListQueryValue,
  Record<string, unknown>
> = z.object({
  scheduleId: z.string().min(1).optional().meta({
    description: 'Only the occurrences of this Schedule.',
  }),
  status: z
    .preprocess(
      (value) =>
        value === undefined || Array.isArray(value) ? value : [value],
      z.array(occurrenceStatus).optional(),
    )
    .meta({
      description:
        'Only occurrences in one of these states; repeat the parameter for several.',
    }),
  from: z.iso.datetime({ offset: true }).optional().meta({
    description: 'Only occurrences started at or after this time.',
  }),
  to: z.iso.datetime({ offset: true }).optional().meta({
    description: 'Only occurrences started before this time.',
  }),
  pageSize: PageSize,
  pageToken: z
    .string()
    .optional()
    .transform((token, context) => {
      if (token === undefined || token === '') return undefined;
      const cursor = decodeHistoryPageToken(token);
      if (cursor) return cursor;
      context.addIssue({
        code: 'custom',
        message: 'The page token is not one this server issued.',
      });
      return z.NEVER;
    }),
});

// Response schemas. They describe what the routes send in the API document at `/api/swagger/docs`; nothing validates a
// response against them.

const targetState = z.enum(['ready', 'disabled', 'missing', 'invalid']);

const lastRun = z
  .object({
    status: occurrenceStatus,
    reason: z.string().optional(),
    finishedAt: z.iso.datetime().optional(),
  })
  .meta({
    ref: 'SchedulerLastRun',
    description: "The outcome of the Schedule's latest firing.",
  });

const scheduleFields = {
  id: z.string(),
  appName: z.string(),
  key: z.string().meta({
    description:
      'The key the Schedule was defined with, unique within the application.',
  }),
  sourceType: z.string().meta({
    description:
      'Where the definition comes from: `code` for a Schedule `defineSchedule` declares.',
  }),
  title: z.string(),
  description: z.string().optional(),
  cron: z
    .string()
    .meta({ description: 'The cron expression, evaluated in `timezone`.' }),
  timezone: z
    .string()
    .meta({ description: 'An IANA time zone, such as `Asia/Shanghai`.' }),
  from: z.iso
    .datetime()
    .optional()
    .meta({ description: 'The first moment the Schedule may fire.' }),
  to: z.iso.datetime().optional().meta({
    description: 'The moment after which the Schedule no longer fires.',
  }),
  limit: z
    .number()
    .int()
    .min(1)
    .optional()
    .meta({ description: 'How many firings the Schedule has in all.' }),
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
  lastRun: lastRun.optional(),
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
};

export const ScheduleSchema: z.ZodType = z
  .object(scheduleFields)
  .meta({ ref: 'SchedulerSchedule' });

export const ScheduleDetailSchema: z.ZodType = z
  .object({
    ...scheduleFields,
    upcomingRuns: z.array(z.iso.datetime()).meta({
      description:
        'The next firings, at most three, within the window and limit; empty while the Schedule is paused.',
    }),
  })
  .meta({ ref: 'SchedulerScheduleDetail' });

const configSource = z.enum(['environment', 'config', 'default']);

const removedFromCode = z.object({
  id: z.string(),
  key: z.string(),
  title: z.string(),
  lastRunAt: z.iso.datetime().optional(),
  lastRun: lastRun.optional(),
});

export const SchedulerJobsSchema: z.ZodType = z
  .object({
    configuration: z.string().nullable().meta({
      description:
        'The `jobs.backends` entry the Schedules run on; `null` for the built-in memory configuration.',
    }),
    selectedBy: z.enum(['scheduler.jobs', 'jobs.default', 'built-in']),
    adapter: z.string(),
    pluginRegistered: z.boolean(),
    multiInstance: z.boolean().meta({
      description: 'Whether more than one instance may run the Schedules.',
    }),
    persistencePath: z.string().optional().meta({
      description: 'Where the memory adapter writes its rules on shutdown.',
    }),
    concurrency: z.number().int().min(1),
    attempts: z.number().int().min(1),
    namespace: z.string().optional(),
    connection: z.string().optional().meta({
      description:
        'The backend address, `host:port` or a URL; credentials are never included.',
    }),
    sources: z.object({
      configuration: configSource,
      adapter: configSource,
      concurrency: configSource,
      attempts: configSource,
      namespace: configSource.optional(),
      connection: configSource.optional(),
    }),
    removedFromCode: z.array(removedFromCode).meta({
      description:
        'Schedules the database still holds as active that no definition this instance loaded declares; `scheduler sync --finalize` deactivates them.',
    }),
  })
  .meta({ ref: 'SchedulerJobs' });

export const SchedulePageMeta: z.ZodType = z
  .object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
    jobs: SchedulerJobsSchema.optional().meta({
      description:
        'The jobs configuration the Schedules run on, for the administration page.',
    }),
  })
  .meta({ ref: 'SchedulerPageMeta' });

export const ScheduleOccurrenceSchema: z.ZodType = z
  .object({
    id: z.string(),
    scheduleId: z.string(),
    status: occurrenceStatus,
    reason: z.string().optional(),
    executionCount: z.number().int().min(0),
    startedAt: z.iso.datetime(),
    scheduledAt: z.iso.datetime().optional().meta({
      description:
        'The firing time the occurrence was planned for; absent on older records.',
    }),
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
            'What the target created for this firing, such as a run it started.',
        }),
      href: z.string().optional().meta({
        description: 'An application path to `reference`, when it has a page.',
      }),
    }),
  })
  .meta({ ref: 'SchedulerOccurrence' });

export const HistoryPageMeta: z.ZodType = z.object({
  nextPageToken: z.string().optional().meta({
    description:
      'Pass back unchanged as `pageToken` for the next page; absent on the last page.',
  }),
});
