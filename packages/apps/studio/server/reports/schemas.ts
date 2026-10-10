/** The answers of Studio's report routes (`routes.ts`). */
import { z } from 'zod';

import {
  DASHBOARD_PERIODS,
  USAGE_GROUP_BYS,
  type DashboardAttention,
  type DashboardReport,
  type MetricsReport,
  type MetricStatus,
  type UsageReport,
} from '../../shared/reports.js';

const dateTime = () => z.string().meta({ format: 'date-time' });
const count = z.number().int();
const ms = z.number().nullable();
const ratio = z.number().nullable();

const CostsSchema = z
  .record(z.string(), z.number())
  .meta({ ref: 'StudioReportCosts', description: 'Cost per currency.' });

const DashboardFiguresSchema = z
  .object({
    completed: count.meta({
      description: 'Throughput: issues that entered a done status.',
    }),
    cycleTimeP50Ms: ms.meta({
      description:
        'Median started → done, in milliseconds, of the completed issues that were started.',
    }),
    agentShare: ratio.meta({
      description: 'Of the completed issues, the share an agent executes.',
    }),
    costPerIssue: CostsSchema.nullable().meta({
      description:
        'The cost of the usage reported in the period over the issues completed.',
    }),
    runs: count.meta({ description: 'Runs queued in the period.' }),
    successRate: ratio.meta({
      description: 'Completed over completed and failed runs.',
    }),
    reworkRate: ratio.meta({
      description:
        'Agent-executed issues sent back from review or reopened after done, over those completed.',
    }),
    runsPerIssue: ratio.meta({
      description: 'Runs on the agent-executed issues completed, per issue.',
    }),
    interventionRate: ratio.meta({
      description:
        'Of the ended runs on issues, the share during which the agent moved its issue to Blocked.',
    }),
    queueWaitP50Ms: ms.meta({
      description: 'Median queued → claimed of the runs, in milliseconds.',
    }),
  })
  .meta({ ref: 'StudioDashboardFigures' });

export const DashboardReportSchema: z.ZodType<DashboardReport> = z.object({
  days: z.literal(DASHBOARD_PERIODS),
  from: z.string().meta({ description: 'The first day, `YYYY-MM-DD` (UTC).' }),
  to: z.string().meta({ description: 'The last day, `YYYY-MM-DD` (UTC).' }),
  subjects: z.boolean().meta({
    description: 'False without issue figures: the issue figures stay empty.',
  }),
  currency: z.string().meta({ description: 'The currency of `daily.cost`.' }),
  current: DashboardFiguresSchema,
  previous: DashboardFiguresSchema,
  daily: z.array(
    z.object({
      day: z.string(),
      completed: count,
      completedByAgents: count,
      cycleTimeP50Ms: ms,
      cost: z.number(),
      runsCompleted: count,
      runsFailed: count,
      runsCancelled: count,
      runsOpen: count,
    }),
  ),
  buckets: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      completed: count,
      cycleTimeP50Ms: ms,
      agentShare: ratio,
      costPerIssue: z.number().nullable(),
    }),
  ),
  projects: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      total: count,
      done: count,
      completed: count,
      cycleTimeP50Ms: ms,
      blocked: count,
    }),
  ),
});

const attentionIssue = z.object({
  id: z.string(),
  identifier: z.string(),
  title: z.string(),
  since: z.string().meta({
    description:
      'Blocked: the last activity; overdue: the due date (`YYYY-MM-DD`).',
  }),
});

export const DashboardAttentionSchema: z.ZodType<DashboardAttention> = z.object(
  {
    subjects: z.boolean(),
    blocked: z.object({ total: count, items: z.array(attentionIssue) }),
    overdue: z.object({ total: count, items: z.array(attentionIssue) }),
    reviewWaits: z.object({
      total: count,
      items: z.array(
        z.object({
          id: z.string(),
          repo: z.string(),
          number: count,
          title: z.string(),
          url: z.string(),
          since: dateTime(),
          issue: z.object({ id: z.string(), identifier: z.string() }),
        }),
      ),
    }),
    failedRuns: z.object({
      total: count,
      items: z.array(
        z.object({
          id: z.string(),
          agentId: z.string(),
          agentName: z.string().nullable(),
          failureReason: z.string().nullable(),
          finishedAt: dateTime(),
          issue: z.object({
            id: z.string(),
            identifier: z.string(),
            title: z.string(),
          }),
        }),
      ),
    }),
  },
);

const status: z.ZodType<MetricStatus> = z.enum(['ok', 'warn', 'n/a']);

export const MetricsReportSchema: z.ZodType<MetricsReport> = z.object({
  from: z.string(),
  to: z.string(),
  projectId: z.string().nullable(),
  generatedAt: dateTime(),
  subjects: z.boolean(),
  adoption: z.object({
    activeWeeks: count,
    activeDays: count,
    issuesCreated: count,
    commentsCreated: count,
    activeMembers: count,
  }),
  aiShare: z.object({
    share: ratio,
    deliveredByAgent: count,
    deliveredTotal: count,
    byAgent: z.array(
      z.object({ agentId: z.string(), name: z.string().nullable(), count }),
    ),
  }),
  trust: z.object({
    reviewPassRate: ratio,
    approvalApproveRate: ratio,
    reworkRate: ratio,
  }),
  reliability: z.object({
    runs: count,
    completedRuns: count,
    failedRuns: count,
    failuresByReason: z.record(z.string(), count),
    claimLatencyP50Ms: ms,
    claimLatencyP95Ms: ms,
    runDurationP50Ms: ms,
    lostRuns: count,
  }),
  cost: z.object({
    inputTokens: count,
    outputTokens: count,
    estimatedCost: CostsSchema.nullable(),
    costPerDeliveredIssue: CostsSchema.nullable(),
    byAgent: z.array(
      z.object({
        agentId: z.string(),
        name: z.string().nullable(),
        cost: CostsSchema.nullable(),
      }),
    ),
    byType: z.array(
      z.object({
        type: z.enum(['online', 'runner']),
        runs: count,
        inputTokens: count,
        outputTokens: count,
        cost: CostsSchema.nullable(),
      }),
    ),
  }),
  humanLoad: z.object({
    decisionsCreated: count,
    decisionsResolved: count,
    decisionResolveP50Ms: ms,
    openDecisions: count,
    byOutcome: z.record(z.string(), count),
    byKind: z.record(z.string(), count),
  }),
  statuses: z.object({
    aiShare: status,
    reviewPassRate: status,
    claimLatencyP50Ms: status,
    lostRuns: status,
    decisionResolveP50Ms: status,
  }),
});

const UsageRowSchema = z
  .object({
    key: z.string(),
    name: z.string().nullable().meta({
      description: 'What a person reads for the key; null when unknown.',
    }),
    runs: count,
    durationMs: z.number(),
    inputTokens: z.number(),
    outputTokens: z.number(),
    cacheReadTokens: z.number(),
    cacheWriteTokens: z.number(),
    reasoningTokens: z.number(),
    cost: CostsSchema.nullable(),
    pricedRuns: count,
  })
  .meta({ ref: 'StudioUsageRow' });

export const UsageReportSchema: z.ZodType<UsageReport> = z.object({
  from: z.string().meta({ format: 'date' }),
  to: z.string().meta({ format: 'date' }),
  groupBy: z.enum(USAGE_GROUP_BYS),
  rows: z.array(UsageRowSchema),
  totals: UsageRowSchema,
  daily: z.array(
    z.object({
      day: z.string().meta({ format: 'date' }),
      inputTokens: z.number(),
      outputTokens: z.number(),
      cacheReadTokens: z.number(),
      cacheWriteTokens: z.number(),
      cost: CostsSchema.nullable(),
    }),
  ),
  unpricedModels: z.array(z.string()),
});
