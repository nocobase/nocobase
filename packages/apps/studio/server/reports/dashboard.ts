/**
 * The dashboard's panels, each its own request: delivery (`GET reports/delivery`), the agents' performance
 * (`GET reports/agents`), the projects (`GET reports/projects`) and the exceptions (`GET reports/attention`), over what
 * the person may see. The issue side comes from the projects plugin's reports (`flow`, `projects`, `attention`), the
 * run side from the agents plugin's (`usage`, `runRecords`), the pull requests from Studio's own git tables. Each reads
 * a fixed number of queries whatever the number of issues and runs. Every metric is
 * defined where its field is declared, in `shared/reports.ts`; what is computed here only follows those definitions.
 */
import type {
  Agents,
  ReportCaller,
} from '@nocobase/app-plugin-agents/server/tokens';
import type {
  Costs,
  ReportRun,
} from '@nocobase/app-plugin-agents/shared/reports';
import type {
  AgentBlock,
  IssueFlow,
  Projects,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { DatabaseConnection } from '@nocobase/db';

import {
  ATTENTION_LIMIT,
  BUCKET_DAYS,
  REVIEW_WAIT_DAYS,
  type AgentFigures,
  type AttentionPullRequest,
  type AttentionRun,
  type DashboardAgents,
  type DashboardAttention,
  type DashboardBucket,
  type DashboardDelivery,
  type DashboardPeriod,
  type DashboardProject,
  type DashboardProjects,
  type DashboardRunDay,
  type DeliveryFigures,
} from '../../shared/reports.js';
import { ISSUE_SUBJECT } from '../agents/catalog/triggers.js';
import { AGENT_KIND } from '../agents/tx.js';
import { LINKS, PULL_REQUESTS, REPOS } from '../git/store.js';

const DAY_MS = 24 * 3600 * 1000;

/** How far back the failed runs of the last 24 hours may have been queued: a run can wait and work for a while. */
const FAILED_RUN_LOOKBACK_DAYS = 7;

export interface DashboardDeps {
  readonly agents: Pick<Agents, 'reporting' | 'agents' | 'clock' | 'tx'>;
  readonly projects: () => Pick<Projects, 'reports'> | undefined;
  readonly viewerOf: (userId: string) => Promise<Viewer>;
  readonly connection?: () => DatabaseConnection;
}

/** The nearest-rank median, or null without values. */
export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length / 2) - 1)] ?? null;
}

const ratio = (part: number, whole: number): number | null =>
  whole > 0 ? part / whole : null;

/** Amounts divided by `by`, rounded to a millionth; null without an amount or a divisor. */
export function perItem(amounts: Costs | null, by: number): Costs | null {
  const entries = Object.entries(amounts ?? {});
  if (entries.length === 0 || by <= 0) return null;
  return Object.fromEntries(
    entries.map(([currency, amount]) => [
      currency,
      Math.round((amount / by) * 1e6) / 1e6,
    ]),
  );
}

const ENDED = new Set(['completed', 'failed']);

/**
 * The runs during which their agent moved the issue to Blocked: a block made by the run (its trace names it), or, for a
 * block whose trace names no run, one by the same agent on the run's issue while the run was working.
 */
export function interventions(
  runs: readonly ReportRun[],
  blocks: readonly AgentBlock[],
): Set<string> {
  const byRun = new Set(
    blocks.flatMap((block) => (block.runId ? [block.runId] : [])),
  );
  const loose = blocks.filter((block) => !block.runId);
  const result = new Set<string>();
  for (const run of runs) {
    if (byRun.has(run.id)) {
      result.add(run.id);
      continue;
    }
    const start = Date.parse(run.startedAt ?? run.createdAt);
    const end = run.finishedAt ? Date.parse(run.finishedAt) : Infinity;
    if (
      loose.some(
        (block) =>
          block.issueId === run.subjectId &&
          (block.agentId === null || block.agentId === run.agentId) &&
          Date.parse(block.at) >= start &&
          Date.parse(block.at) <= end,
      )
    )
      result.add(run.id);
  }
  return result;
}

/** One period's delivery figures from its issue flow (null without the projects plugin) and the cost of its usage. */
export function deliveryFigures(
  flow: IssueFlow | null,
  estimatedCost: Costs | null,
): DeliveryFigures {
  const completed = flow?.completed ?? [];
  const byAgent = completed.filter((issue) => issue.byAgent);
  return {
    completed: completed.length,
    cycleTimeP50Ms: median(completed.flatMap(cycleOf)),
    agentShare: flow ? ratio(byAgent.length, completed.length) : null,
    costPerIssue: perItem(estimatedCost, completed.length),
  };
}

/** Started → completed of a completed issue that was started. */
const cycleOf = (issue: {
  readonly doneAt: string;
  readonly startedAt: string | null;
}): number[] =>
  issue.startedAt
    ? [Math.max(0, Date.parse(issue.doneAt) - Date.parse(issue.startedAt))]
    : [];

/**
 * One period's agent figures from its issue flow (null without the projects plugin), the runs queued in it and the
 * number of runs on the agent-executed issues completed in it.
 */
export function agentFigures(
  flow: IssueFlow | null,
  runs: readonly ReportRun[],
  runsOnAgentIssues: number,
): AgentFigures {
  const byAgent = (flow?.completed ?? []).filter((issue) => issue.byAgent);
  const sentBack = new Set(
    (flow?.returned ?? [])
      .filter((issue) => issue.byAgent)
      .map((issue) => issue.id),
  );
  const completedRuns = runs.filter((run) => run.status === 'completed').length;
  const failedRuns = runs.filter((run) => run.status === 'failed').length;
  const ended = runs.filter(
    (run) => run.subjectKind === ISSUE_SUBJECT && ENDED.has(run.status),
  );
  const intervened = interventions(ended, flow?.agentBlocks ?? []);
  return {
    runs: runs.length,
    successRate: ratio(completedRuns, completedRuns + failedRuns),
    reworkRate: flow ? ratio(sentBack.size, byAgent.length) : null,
    runsPerIssue: flow ? ratio(runsOnAgentIssues, byAgent.length) : null,
    interventionRate: ratio(intervened.size, ended.length),
    queueWaitP50Ms: median(
      runs.flatMap((run) =>
        run.dispatchedAt
          ? [
              Math.max(
                0,
                Date.parse(run.dispatchedAt) - Date.parse(run.createdAt),
              ),
            ]
          : [],
      ),
    ),
  };
}

/** The currency the dashboard shows: the first in use, US dollars without any. */
export function reportCurrency(costs: readonly (Costs | null)[]): string {
  for (const cost of costs) {
    const [currency] = Object.keys(cost ?? {});
    if (currency) return currency;
  }
  return 'USD';
}

/** Every day from `from` to `to` (`YYYY-MM-DD`, both inclusive). */
export function daysOf(from: string, to: string): string[] {
  const days: string[] = [];
  for (
    let at = Date.parse(`${from}T00:00:00Z`);
    at <= Date.parse(`${to}T00:00:00Z`);
    at += DAY_MS
  )
    days.push(new Date(at).toISOString().slice(0, 10));
  return days;
}

/** Every day of the period with the runs queued that day, by how they ended so far. */
export function runDays(
  days: readonly string[],
  runs: readonly ReportRun[],
): DashboardRunDay[] {
  const byDay = new Map(
    days.map((day) => [
      day,
      { runsCompleted: 0, runsFailed: 0, runsCancelled: 0, runsOpen: 0 },
    ]),
  );
  for (const run of runs) {
    const entry = byDay.get(run.createdAt.slice(0, 10));
    if (!entry) continue;
    if (run.status === 'completed') entry.runsCompleted += 1;
    else if (run.status === 'failed') entry.runsFailed += 1;
    else if (run.status === 'cancelled') entry.runsCancelled += 1;
    else entry.runsOpen += 1;
  }
  return days.map((day) => ({
    day,
    ...(byDay.get(day) ?? {
      runsCompleted: 0,
      runsFailed: 0,
      runsCancelled: 0,
      runsOpen: 0,
    }),
  }));
}

/**
 * The period in stretches of `size` days, the last ending on the period's last day (`BUCKET_DAYS`): the issues
 * completed in each and the cost of the usage reported in it (`cost`, by day, in the report's currency).
 */
export function periodBuckets(
  flow: IssueFlow | null,
  days: readonly string[],
  cost: ReadonlyMap<string, number>,
  size: number,
): DashboardBucket[] {
  const buckets: DashboardBucket[] = [];
  for (let end = days.length; end > 0; end -= size) {
    const stretch = days.slice(Math.max(0, end - size), end);
    const from = stretch[0] ?? '';
    const to = stretch.at(-1) ?? '';
    const done = (flow?.completed ?? []).filter((issue) => {
      const day = issue.doneAt.slice(0, 10);
      return day >= from && day <= to;
    });
    const spent = stretch.reduce((sum, day) => sum + (cost.get(day) ?? 0), 0);
    buckets.unshift({
      from,
      to,
      completed: done.length,
      cycleTimeP50Ms: median(done.flatMap(cycleOf)),
      agentShare: ratio(
        done.filter((issue) => issue.byAgent).length,
        done.length,
      ),
      costPerIssue:
        done.length > 0 && spent > 0
          ? Math.round((spent / done.length) * 1e6) / 1e6
          : null,
    });
  }
  return buckets;
}

/** The last `days` days up to today and the `days` before them, as UTC days. */
function periodsOf(
  deps: DashboardDeps,
  days: DashboardPeriod,
): {
  readonly current: { readonly from: string; readonly to: string };
  readonly previous: { readonly from: string; readonly to: string };
} {
  const today = deps.agents.clock.now().toISOString().slice(0, 10);
  const dayBefore = (count: number) =>
    new Date(Date.parse(`${today}T00:00:00Z`) - count * DAY_MS)
      .toISOString()
      .slice(0, 10);
  return {
    current: { from: dayBefore(days - 1), to: today },
    previous: { from: dayBefore(2 * days - 1), to: dayBefore(days) },
  };
}

/** The issue flow of a period over what the viewer may see; null without the projects plugin. */
async function flowOf(
  deps: DashboardDeps,
  caller: ReportCaller,
  period: { readonly from: string; readonly to: string },
): Promise<IssueFlow | null> {
  const projects = deps.projects();
  if (!projects) return null;
  const range = deps.agents.reporting.range(period);
  return projects.reports.flow(await deps.viewerOf(caller.userId), {
    from: range.start,
    to: range.end,
    agentKind: AGENT_KIND,
  });
}

/** `GET reports/delivery`: issues completed, how fast, the agents' share and the cost per issue, over the period. */
export async function dashboardDelivery(
  deps: DashboardDeps,
  caller: ReportCaller,
  days: DashboardPeriod,
): Promise<DashboardDelivery> {
  const periods = periodsOf(deps, days);
  const period = async (dates: {
    readonly from: string;
    readonly to: string;
  }) => {
    const flow = await flowOf(deps, caller, dates);
    // The usage reported in the period, by day: its total and each day's cost.
    const usage = await deps.agents.reporting.usage(caller, {
      ...dates,
      groupBy: 'day',
    });
    return { flow, usage };
  };
  const current = await period(periods.current);
  const previous = await period(periods.previous);
  const currency = reportCurrency([
    current.usage.totals.cost,
    previous.usage.totals.cost,
  ]);
  return {
    days,
    from: periods.current.from,
    to: periods.current.to,
    subjects: current.flow !== null,
    currency,
    current: deliveryFigures(current.flow, current.usage.totals.cost),
    previous: deliveryFigures(previous.flow, previous.usage.totals.cost),
    buckets: periodBuckets(
      current.flow,
      daysOf(periods.current.from, periods.current.to),
      new Map(
        current.usage.daily.map((point) => [
          point.day,
          point.cost?.[currency] ?? 0,
        ]),
      ),
      BUCKET_DAYS[days],
    ),
  };
}

/** `GET reports/agents`: how the agents' runs went over the period, and the runs queued each day. */
export async function dashboardAgents(
  deps: DashboardDeps,
  caller: ReportCaller,
  days: DashboardPeriod,
): Promise<DashboardAgents> {
  const periods = periodsOf(deps, days);
  const period = async (dates: {
    readonly from: string;
    readonly to: string;
  }) => {
    const flow = await flowOf(deps, caller, dates);
    const range = deps.agents.reporting.range(dates);
    const runs = await deps.agents.reporting.runRecords(caller, {
      start: range.start,
      end: range.end,
      groupId: null,
    });
    const agentIssues = (flow?.completed ?? [])
      .filter((issue) => issue.byAgent)
      .map((issue) => issue.id);
    const onAgentIssues = await deps.agents.reporting.runRecords(caller, {
      subjects: { kind: ISSUE_SUBJECT, ids: agentIssues },
      groupId: null,
    });
    return {
      flow,
      runs,
      figures: agentFigures(flow, runs, onAgentIssues.length),
    };
  };
  const current = await period(periods.current);
  const previous = await period(periods.previous);
  return {
    days,
    from: periods.current.from,
    to: periods.current.to,
    subjects: current.flow !== null,
    current: current.figures,
    previous: previous.figures,
    daily: runDays(
      daysOf(periods.current.from, periods.current.to),
      current.runs,
    ),
  };
}

/** `GET reports/projects`: every project the viewer may see, with what it completed in the period. */
export async function dashboardProjects(
  deps: DashboardDeps,
  caller: ReportCaller,
  days: DashboardPeriod,
): Promise<DashboardProjects> {
  const periods = periodsOf(deps, days);
  const base = {
    days,
    from: periods.current.from,
    to: periods.current.to,
  };
  const projects = deps.projects();
  if (!projects) return { ...base, subjects: false, projects: [] };
  const flow = await flowOf(deps, caller, periods.current);
  const done = new Map<string, number[]>();
  const count = new Map<string, number>();
  for (const issue of flow?.completed ?? []) {
    if (!issue.projectId) continue;
    count.set(issue.projectId, (count.get(issue.projectId) ?? 0) + 1);
    done.set(issue.projectId, [
      ...(done.get(issue.projectId) ?? []),
      ...cycleOf(issue),
    ]);
  }
  const rows: DashboardProject[] = (
    await projects.reports.projects(await deps.viewerOf(caller.userId))
  ).map((project) => ({
    id: project.id,
    name: project.name,
    total: project.total,
    done: project.done,
    completed: count.get(project.id) ?? 0,
    cycleTimeP50Ms: median(done.get(project.id) ?? []),
    blocked: project.blocked,
  }));
  rows.sort(
    (a, b) =>
      b.completed - a.completed ||
      b.total - b.done - (a.total - a.done) ||
      a.name.localeCompare(b.name),
  );
  return { ...base, subjects: true, projects: rows };
}

type Row = Record<string, unknown>;

const text = (value: unknown): string =>
  typeof value === 'string'
    ? value
    : typeof value === 'number'
      ? String(value)
      : '';
const flag = (value: unknown): boolean =>
  value === true || value === 1 || value === '1' || value === 'true';
const instant = (value: unknown): number =>
  value === null || value === undefined || value === ''
    ? NaN
    : new Date(value as string).getTime();

/**
 * The open, non-draft pull requests linked to an issue the viewer may see and open longer than `REVIEW_WAIT_DAYS`, the
 * oldest first. Open means not merged or closed on the host: Studio keeps no review state, and the time it first saw a
 * pull request (`createdAt`) stands for when it was opened.
 */
export async function reviewWaits(
  conn: DatabaseConnection,
  projects: Pick<Projects, 'reports'>,
  viewer: Viewer,
  now: Date,
): Promise<{ total: number; items: AttentionPullRequest[] }> {
  const cutoff = now.getTime() - REVIEW_WAIT_DAYS * DAY_MS;
  const open = (
    await conn.query
      .selectFrom(PULL_REQUESTS)
      .select(['id', 'repoId', 'number', 'title', 'url', 'draft', 'createdAt'])
      .where('state', '=', 'open')
      .execute()
  ).filter((row: Row) => !flag(row.draft) && instant(row.createdAt) < cutoff);
  if (open.length === 0) return { total: 0, items: [] };
  const ids = open.map((row: Row) => text(row.id));
  const links = await conn.query
    .selectFrom(LINKS)
    .select(['issueId', 'pullRequestId', 'createdAt'])
    .where('pullRequestId', 'in', ids)
    .execute();
  const facts = await projects.reports.describe(viewer, [
    ...new Set(links.map((link: Row) => text(link.issueId))),
  ]);
  const repoIds = [...new Set(open.map((row: Row) => text(row.repoId)))];
  const repos = new Map(
    (
      await conn.query
        .selectFrom(REPOS)
        .select(['id', 'repo'])
        .where('id', 'in', repoIds)
        .execute()
    ).map((row: Row) => [text(row.id), text(row.repo)]),
  );
  const items: AttentionPullRequest[] = [];
  for (const row of open) {
    const issue = links
      .filter((link: Row) => text(link.pullRequestId) === text(row.id))
      .sort((a: Row, b: Row) => instant(a.createdAt) - instant(b.createdAt))
      .map((link: Row) => facts.get(text(link.issueId)))
      .find((fact) => fact?.visible);
    if (!issue) continue;
    items.push({
      id: text(row.id),
      repo: repos.get(text(row.repoId)) ?? '',
      number: Number(row.number),
      title: text(row.title),
      url: text(row.url),
      since: new Date(instant(row.createdAt)).toISOString(),
      issue: { id: issue.id, identifier: issue.identifier },
    });
  }
  items.sort((a, b) => a.since.localeCompare(b.since));
  return { total: items.length, items: items.slice(0, ATTENTION_LIMIT) };
}

/**
 * The runs on issues the caller counts that failed in the 24 hours before `now` and were not retried, the newest first.
 */
export function failedRecently(
  runs: readonly ReportRun[],
  now: Date,
): ReportRun[] {
  const retried = new Set(
    runs.flatMap((run) => (run.retryOfRunId ? [run.retryOfRunId] : [])),
  );
  const since = now.getTime() - DAY_MS;
  return runs
    .filter(
      (run) =>
        run.status === 'failed' &&
        run.subjectKind === ISSUE_SUBJECT &&
        run.finishedAt !== null &&
        Date.parse(run.finishedAt) >= since &&
        !retried.has(run.id),
    )
    .sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''));
}

const EMPTY = { total: 0, items: [] } as const;

export async function dashboardAttention(
  deps: DashboardDeps,
  caller: ReportCaller,
): Promise<DashboardAttention> {
  const projects = deps.projects();
  if (!projects)
    return {
      subjects: false,
      blocked: EMPTY,
      overdue: EMPTY,
      reviewWaits: EMPTY,
      failedRuns: EMPTY,
    };
  const now = deps.agents.clock.now();
  const viewer = await deps.viewerOf(caller.userId);
  const issues = await projects.reports.attention(viewer, {
    today: now.toISOString().slice(0, 10),
    limit: ATTENTION_LIMIT,
  });

  const failed = failedRecently(
    await deps.agents.reporting.runRecords(caller, {
      start: new Date(now.getTime() - FAILED_RUN_LOOKBACK_DAYS * DAY_MS),
      groupId: null,
    }),
    now,
  );
  const shown = failed.slice(0, ATTENTION_LIMIT);
  const facts = await projects.reports.describe(
    viewer,
    shown.map((run) => run.subjectId),
  );
  const names = new Map(
    (await deps.agents.agents.directory(deps.agents.tx.read())).map((agent) => [
      agent.id,
      agent.name,
    ]),
  );
  const runs: AttentionRun[] = shown.flatMap((run) => {
    const issue = facts.get(run.subjectId);
    return issue?.visible
      ? [
          {
            id: run.id,
            agentId: run.agentId,
            agentName: names.get(run.agentId) ?? null,
            failureReason: run.failureReason,
            finishedAt: run.finishedAt ?? run.createdAt,
            issue: {
              id: issue.id,
              identifier: issue.identifier,
              title: issue.title,
            },
          },
        ]
      : [];
  });

  return {
    subjects: true,
    blocked: {
      total: issues.blocked.total,
      items: issues.blocked.items.map((issue) => ({
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        since: issue.lastActivityAt,
      })),
    },
    overdue: {
      total: issues.overdue.total,
      items: issues.overdue.items.map((issue) => ({
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        since: issue.dueDate ?? '',
      })),
    },
    reviewWaits: deps.connection
      ? await reviewWaits(deps.connection(), projects, viewer, now)
      : EMPTY,
    failedRuns: { total: failed.length, items: runs },
  };
}
