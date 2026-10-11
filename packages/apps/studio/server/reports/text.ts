/**
 * Studio's reports as the CLI words them (`routes.ts`): `report usage` (what runs used and cost, grouped by agent,
 * person, project, issue, day, model or tool) and `report metrics` (adoption, the share of deliveries agents made,
 * review and approval rates, run reliability and duration, cost, and the decisions people take), in `meta.message`.
 *
 * Both perform `studio.reports/read` (`REPORTS_READ`): a person holds it with the reports grant, and a run when its
 * agent is configured with it and the person who woke it holds the grant. As on the pages, every run counts for someone
 * who may read agents, and otherwise only their own, on issues they see.
 */
import type { MetricsReport, UsageReport } from '../../shared/reports.js';
import { REPORTS_READ_ACTION } from '../agents/capabilities.js';
import type {
  ActionSource,
  ReaderGrantsOf,
} from '../agents/commands/permissions.js';

export const REPORTS_READ: string = REPORTS_READ_ACTION;

/** The report action an identity may run commands for, for the command gate. */
export function reportActionsOf(grantsOf: ReaderGrantsOf): ActionSource {
  return async (identity) => {
    if (!(await grantsOf(identity)).reports) return new Set();
    if (identity.kind === 'user') return new Set([REPORTS_READ]);
    const configured = new Set(identity.agent?.actions ?? []);
    return new Set([REPORTS_READ].filter((key) => configured.has(key)));
  };
}

const percent = (value: number | null): string =>
  value === null ? 'n/a' : `${Math.round(value * 100)}%`;

const duration = (ms: number | null): string => {
  if (ms === null) return 'n/a';
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
};

const money = (costs: Readonly<Record<string, number>> | null): string =>
  costs && Object.keys(costs).length > 0
    ? Object.entries(costs)
        .map(([currency, amount]) => `${amount.toFixed(2)} ${currency}`)
        .join(' + ')
    : 'n/a';

/** The report as a few lines a person or an agent reads first; `--json` has everything. */
export function metricsText(report: MetricsReport): string {
  const { adoption, aiShare, trust, reliability, cost, humanLoad } = report;
  return [
    `Metrics ${report.from} to ${report.to}${report.projectId ? ` (project ${report.projectId})` : ''}`,
    `Adoption: ${adoption.activeDays} active days in ${adoption.activeWeeks} weeks, ${adoption.activeMembers} people, ${adoption.issuesCreated} issues and ${adoption.commentsCreated} comments created.`,
    `Delivered: ${aiShare.deliveredTotal} issues, ${aiShare.deliveredByAgent} by agents (AI share ${percent(aiShare.share)}).`,
    `Review: ${percent(trust.reviewPassRate)} passed, ${percent(trust.reworkRate)} sent back; approvals ${percent(trust.approvalApproveRate)} approved.`,
    `Runs: ${reliability.runs} started, ${reliability.completedRuns} completed, ${reliability.failedRuns} failed, ${reliability.lostRuns} lost; median wait ${duration(reliability.claimLatencyP50Ms)}, median run ${duration(reliability.runDurationP50Ms)}.`,
    `Cost: ${money(cost.estimatedCost)} (${cost.inputTokens} input and ${cost.outputTokens} output tokens), ${money(cost.costPerDeliveredIssue)} per delivered issue.`,
    `Decisions: ${humanLoad.decisionsCreated} asked, ${humanLoad.decisionsResolved} decided (median ${duration(humanLoad.decisionResolveP50Ms)}), ${humanLoad.openDecisions} open.`,
  ].join('\n');
}

export function usageText(report: UsageReport): string {
  const { totals } = report;
  return [
    `Usage ${report.from} to ${report.to} by ${report.groupBy}: ${totals.runs} runs, ${totals.inputTokens} input and ${totals.outputTokens} output tokens, ${money(totals.cost)}.`,
    ...report.rows
      .slice(0, 20)
      .map(
        (row) =>
          `- ${row.name ?? row.key}: ${row.runs} runs, ${row.inputTokens + row.outputTokens} tokens, ${money(row.cost)}`,
      ),
    ...(report.rows.length > 20
      ? [`(${report.rows.length - 20} more rows in --json)`]
      : []),
    ...(report.unpricedModels.length > 0
      ? [`Models without a price: ${report.unpricedModels.join(', ')}.`]
      : []),
  ].join('\n');
}
