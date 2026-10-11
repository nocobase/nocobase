/**
 * Studio's reports (`routes.ts`, and the CLI's `report` commands): the dashboard page, the acceptance
 * metrics and usage. Usage is the agents plugin's, with Studio's names for its groupings (a project is a
 * run's group, an issue its subject); the acceptance metrics add the agents plugin's run
 * figures (reliability, cost, the days and people runs were for) to the projects plugin's issue figures (adoption,
 * deliveries, review, approval requests), over what the person may see. The dashboard's figures are `dashboard.ts`. The human load counts every decision people
 * take, not only approval requests: plans, deployment requests, merges and failed runs too (`decisions.ts`).
 */
import type {
  Agents,
  ReportCaller,
} from '@nocobase/app-plugin-agents/server/tokens';
import type { Costs } from '@nocobase/app-plugin-agents/shared/reports';
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';
import type { DatabaseConnection } from '@nocobase/db';

import {
  AGENTS_GROUP_BY,
  type DashboardAttention,
  type DashboardPeriod,
  type DashboardReport,
  METRIC_TARGETS,
  USAGE_GROUP_BYS,
  type MetricStatus,
  type MetricTargetKey,
  type MetricsQuery,
  type MetricsReport,
  type UsageQuery,
  type UsageReport,
} from '../../shared/reports.js';
import { dashboardAttention, dashboardReport } from './dashboard.js';
import { decisionFigures } from './decisions.js';
import {
  issueFigures,
  type IssueFigures,
  type ViewerOf,
} from './issue-facts.js';

const DAY_MS = 24 * 3600 * 1000;

export interface StudioReports {
  usage(caller: ReportCaller, query: UsageQuery): Promise<UsageReport>;
  metrics(caller: ReportCaller, query: MetricsQuery): Promise<MetricsReport>;
  /** The last `days` days up to today against the `days` before them, by day and by project (`dashboard.ts`). */
  dashboard(
    caller: ReportCaller,
    days: DashboardPeriod,
  ): Promise<DashboardReport>;
  /** The exceptions now: blocked and overdue issues, pull requests waiting for review, runs that just failed. */
  attention(caller: ReportCaller): Promise<DashboardAttention>;
}

/** The nearest-rank percentile (`p` from 0 to 1), or null without values. */
export function percentile(
  values: readonly number[],
  p: number,
): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(p * sorted.length) - 1),
  );
  return sorted[index] ?? null;
}

export function ratio(part: number, whole: number): number | null {
  return whole > 0 ? part / whole : null;
}

/** The ISO week (`YYYY-Www`) of a `YYYY-MM-DD` day. */
export function isoWeek(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  const weekday = (date.getUTCDay() + 6) % 7;
  const thursday = new Date(date.getTime() + (3 - weekday) * DAY_MS);
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
  const week = Math.floor((thursday.getTime() - yearStart) / (7 * DAY_MS)) + 1;
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function metricStatus(
  key: MetricTargetKey,
  value: number | null,
): MetricStatus {
  if (value === null) return 'n/a';
  const target = METRIC_TARGETS[key];
  return (target.rule === 'min' ? value >= target.value : value <= target.value)
    ? 'ok'
    : 'warn';
}

/** Amounts divided by `by`, rounded to a millionth; null when there is no amount. */
function divided(amounts: Costs | null, by: number): Costs | null {
  const entries = Object.entries(amounts ?? {});
  if (entries.length === 0) return null;
  return Object.fromEntries(
    entries.map(([currency, amount]) => [
      currency,
      Math.round((amount / by) * 1e6) / 1e6,
    ]),
  );
}

export function createStudioReports(deps: {
  readonly agents: Pick<Agents, 'reporting' | 'agents' | 'clock'>;
  /** The projects plugin's services; undefined without it (then only runs and cost are measured). */
  readonly projects: () => Pick<Projects, 'reports'> | undefined;
  readonly viewerOf: ViewerOf;
  /** Where Studio's inbox and the plans are kept, for the decisions beyond approval requests (`decisions.ts`). */
  readonly connection?: () => DatabaseConnection;
}): StudioReports {
  const { agents } = deps;
  return {
    async usage(caller, query) {
      const groupBy = query.groupBy ?? 'agent';
      if (!USAGE_GROUP_BYS.includes(groupBy))
        throw new Error(`Unknown grouping: ${groupBy}`);
      const report = await agents.reporting.usage(caller, {
        groupBy: AGENTS_GROUP_BY[groupBy],
        ...(query.from ? { from: query.from } : {}),
        ...(query.to ? { to: query.to } : {}),
        ...(query.projectId ? { groupId: query.projectId } : {}),
        ...(query.agentId ? { agentId: query.agentId } : {}),
        ...(query.userId ? { userId: query.userId } : {}),
      });
      return { ...report, groupBy };
    },

    dashboard: (caller, days) => dashboardReport(deps, caller, days),

    attention: (caller) => dashboardAttention(deps, caller),

    async metrics(caller, query) {
      const now = agents.clock.now();
      const range = agents.reporting.range(query);
      const projectId = query.projectId ?? null;
      const projects = deps.projects();

      // The issues' own figures, over the issues the person may see, and the decisions beyond approval requests.
      const viewer = projects ? await deps.viewerOf(caller.userId) : null;
      const parts: IssueFigures[] =
        projects && viewer
          ? [
              await issueFigures(projects, viewer, {
                from: range.start,
                to: range.end,
                projectId,
              }),
            ]
          : [];
      const others =
        projects && viewer && deps.connection
          ? await decisionFigures(deps.connection(), projects, viewer, {
              from: range.start,
              to: range.end,
              projectId,
            })
          : null;
      const sum = (pick: (part: IssueFigures) => number) =>
        parts.reduce((total, part) => total + pick(part), 0);
      const byAgentDelivered = new Map<string, number>();
      const byOutcome: Record<string, number> = {};
      for (const part of parts) {
        for (const [agentId, count] of Object.entries(part.deliveredByAgentId))
          byAgentDelivered.set(
            agentId,
            (byAgentDelivered.get(agentId) ?? 0) + count,
          );
        for (const [outcome, count] of Object.entries(part.decisionsByOutcome))
          byOutcome[outcome] = (byOutcome[outcome] ?? 0) + count;
      }
      for (const [outcome, count] of Object.entries(others?.byOutcome ?? {}))
        byOutcome[outcome] = (byOutcome[outcome] ?? 0) + count;
      const approvalsAsked = sum((part) => part.decisionsCreated);
      const byKind: Record<string, number> = {
        ...(parts.length > 0 ? { approvals: approvalsAsked } : {}),
        ...others?.byKind,
      };

      // The runs started in the range and the usage reported in it.
      const figures = await agents.reporting.runFigures(caller, {
        ...range,
        groupId: projectId,
      });
      const names = new Map(
        (await agents.agents.list({ includeArchived: true })).map((agent) => [
          agent.id,
          agent.name,
        ]),
      );

      const days = new Set<string>([
        ...parts.flatMap((part) => part.activityDays),
        ...figures.activityDays,
      ]);
      const members = new Set<string>([
        ...parts.flatMap((part) => part.memberIds),
        ...figures.actorIds,
      ]);
      const deliveredTotal = sum((part) => part.deliveredTotal);
      const deliveredByAgent = sum((part) => part.deliveredByAgent);
      const reviewExits = sum((part) => part.reviewExits);
      const approved = sum((part) => part.approvalsApproved);
      const resolveMs = [
        ...parts.flatMap((part) => part.decisionResolveMs),
        ...(others?.resolveMs ?? []),
      ];

      const report: Omit<MetricsReport, 'statuses'> = {
        from: range.from,
        to: range.to,
        projectId,
        generatedAt: now.toISOString(),
        subjects: parts.length > 0,
        adoption: {
          activeWeeks: new Set([...days].map(isoWeek)).size,
          activeDays: days.size,
          issuesCreated: sum((part) => part.issuesCreated),
          commentsCreated: sum((part) => part.commentsCreated),
          activeMembers: members.size,
        },
        aiShare: {
          share: ratio(deliveredByAgent, deliveredTotal),
          deliveredByAgent,
          deliveredTotal,
          byAgent: [...byAgentDelivered]
            .map(([agentId, count]) => ({
              agentId,
              name: names.get(agentId) ?? null,
              count,
            }))
            .sort((a, b) => b.count - a.count),
        },
        trust: {
          reviewPassRate: ratio(
            sum((part) => part.reviewPassed),
            reviewExits,
          ),
          approvalApproveRate: ratio(
            approved,
            approved + sum((part) => part.approvalsRejected),
          ),
          reworkRate: ratio(
            sum((part) => part.reworked),
            reviewExits,
          ),
        },
        reliability: {
          runs: figures.runs,
          completedRuns: figures.completedRuns,
          failedRuns: figures.failedRuns,
          failuresByReason: figures.failuresByReason,
          claimLatencyP50Ms: figures.claimLatencyP50Ms,
          claimLatencyP95Ms: figures.claimLatencyP95Ms,
          runDurationP50Ms: figures.runDurationP50Ms,
          lostRuns: figures.lostRuns,
        },
        cost: {
          inputTokens: figures.inputTokens,
          outputTokens: figures.outputTokens,
          estimatedCost: figures.estimatedCost,
          costPerDeliveredIssue:
            deliveredTotal > 0
              ? divided(figures.estimatedCost, deliveredTotal)
              : null,
          byAgent: figures.costByAgent,
          byType: figures.usageByType.map((row) => ({
            type: row.type,
            runs: row.runs,
            inputTokens: row.inputTokens,
            outputTokens: row.outputTokens,
            cost: row.cost,
          })),
        },
        humanLoad: {
          decisionsCreated: approvalsAsked + (others?.created ?? 0),
          decisionsResolved: resolveMs.length,
          decisionResolveP50Ms: percentile(resolveMs, 0.5),
          openDecisions:
            sum((part) => part.decisionsOpen) + (others?.open ?? 0),
          byOutcome,
          byKind,
        },
      };
      return {
        ...report,
        statuses: {
          aiShare: metricStatus('aiShare', report.aiShare.share),
          reviewPassRate: metricStatus(
            'reviewPassRate',
            report.trust.reviewPassRate,
          ),
          claimLatencyP50Ms: metricStatus(
            'claimLatencyP50Ms',
            report.reliability.claimLatencyP50Ms,
          ),
          lostRuns: metricStatus('lostRuns', report.reliability.lostRuns),
          decisionResolveP50Ms: metricStatus(
            'decisionResolveP50Ms',
            report.humanLoad.decisionResolveP50Ms,
          ),
        },
      };
    },
  };
}
