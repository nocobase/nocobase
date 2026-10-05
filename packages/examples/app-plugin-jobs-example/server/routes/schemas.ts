import { z } from 'zod';

export const RuleParams: z.ZodObject<{ ruleName: z.ZodString }> = z.object({
  ruleName: z.string().min(1),
});

/** The body is optional: `start` without one keeps the rule's interval. */
export const StartRuleInput: z.ZodObject<
  { every: z.ZodOptional<z.ZodNumber> },
  z.core.$strict
> = z.strictObject({
  every: z.number().int().positive().optional(),
});

export type StartRuleInput = z.infer<typeof StartRuleInput>;

// Response schemas. Each is annotated with the value it describes, which isolated declarations require of an export,
// and carries a `ref` so the API document names it once and refers to it from every route.

export interface ScheduleRunBody {
  readonly jobId: string;
  readonly scheduledAt: string;
  readonly runAt: string;
  readonly outcome: 'running' | 'succeeded' | 'failed';
  readonly reason?: string | undefined;
}
const ScheduleRun: z.ZodType<ScheduleRunBody> = z
  .object({
    jobId: z.string(),
    scheduledAt: z.iso
      .datetime()
      .meta({ description: 'When the rule was due to fire.' }),
    runAt: z.iso.datetime().meta({ description: 'When the firing ran.' }),
    outcome: z.enum(['running', 'succeeded', 'failed']),
    reason: z
      .string()
      .optional()
      .meta({ description: 'Why a failed firing failed.' }),
  })
  .meta({ ref: 'JobsExampleScheduleRun' });

export interface ScheduleRuleBody {
  readonly name: string;
  readonly builtIn: boolean;
  readonly options: {
    readonly every?: number | undefined;
    readonly cron?: string | undefined;
    readonly limit?: number | undefined;
  };
  readonly state: 'active' | 'ended' | 'stopped';
  readonly nextRunAt?: string | undefined;
  readonly firings: number;
  readonly runs: readonly ScheduleRunBody[];
}
export const ScheduleRule: z.ZodType<ScheduleRuleBody> = z
  .object({
    name: z.string().meta({ description: 'The rule name used in paths.' }),
    builtIn: z.boolean().meta({
      description:
        'A built-in rule is written on every start and cannot be started or stopped.',
    }),
    options: z
      .object({
        every: z
          .number()
          .int()
          .optional()
          .meta({ description: 'Interval in milliseconds.' }),
        cron: z.string().optional(),
        limit: z
          .number()
          .int()
          .optional()
          .meta({ description: 'How many firings the rule makes in all.' }),
      })
      .meta({
        description:
          "What the scheduler holds, or the rule's defaults while it is stopped.",
      }),
    state: z.enum(['active', 'ended', 'stopped']).meta({
      description:
        'An active rule has a next firing; an ended one has spent its limit.',
    }),
    nextRunAt: z.iso.datetime().optional(),
    firings: z
      .number()
      .int()
      .meta({ description: 'Firings this instance ran since it started.' }),
    runs: z
      .array(ScheduleRun)
      .meta({ description: 'Recent firings on this instance.' }),
  })
  .meta({ ref: 'JobsExampleScheduleRule' });

export interface JobTaskBody {
  readonly jobId: string;
  readonly status: 'queued' | 'running' | 'completed' | 'failed';
  readonly progress: number;
  readonly attempt: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly reason?: string | undefined;
}
export const JobTask: z.ZodType<JobTaskBody> = z
  .object({
    jobId: z.string(),
    status: z.enum(['queued', 'running', 'completed', 'failed']),
    progress: z
      .number()
      .min(0)
      .max(100)
      .meta({ description: 'As the latest attempt reported it.' }),
    attempt: z.number().int().meta({
      description: 'The latest execution start observed; 0 before the first.',
    }),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    reason: z.string().optional().meta({
      description: 'Why the task failed or was interrupted.',
    }),
  })
  .meta({ ref: 'JobsExampleTask' });
