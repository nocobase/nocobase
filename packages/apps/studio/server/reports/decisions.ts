/**
 * The human load of the metrics beyond the projects plugin's approval requests: the other decisions people take in
 * Studio, read from where each is kept.
 *
 * - Inbox decisions (`studioInboxNotices`, kind `decision`): a deployment request (source `releases`), a pull request
 *   waiting to be merged (`git`), an agent run that failed for good (`projects`, `run_failed_final`), and any other
 *   decision a contributor sends. A decision sent to several people is one decision, created when it was first sent
 *   and taken when it was resolved. Approval requests also reach the inbox (source `projects`, keyed by the request);
 *   they are left out here, as the projects plugin counts them.
 * - Operation plans (`pmPlans`) waiting for their decider: taken once executed, voided, expired or failed.
 *
 * A decision about an issue counts when the person may see the issue, and in a project's report when the issue is in
 * it. One about no issue (a deployment request, a plan proposed outside an issue) counts only in the report of every
 * project. Like the rest of the metrics these are counts, never what the decisions were about.
 */
import type {
  Projects,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { DatabaseConnection, Row } from '@nocobase/db';

import { RUN_FAILED_FINAL } from '../agents/notices.js';
import { PROJECTS_SOURCE } from '../inbox/projects.js';

/** The kinds of decision the metrics name; `approvals` are the projects plugin's. */
export type DecisionKind =
  'approvals' | 'plans' | 'deployRequests' | 'merges' | 'failedRuns' | 'other';

export interface DecisionFigures {
  readonly created: number;
  readonly open: number;
  /** createdAt → resolvedAt of each decision taken in the range, in milliseconds. */
  readonly resolveMs: readonly number[];
  /** How the decisions taken in the range ended, in each contributor's words. */
  readonly byOutcome: Readonly<Record<string, number>>;
  /** The decisions asked in the range, by kind. */
  readonly byKind: Readonly<Partial<Record<DecisionKind, number>>>;
}

/** Plan statuses that still wait for the decider. */
const WAITING_PLAN = new Set(['pending', 'executing']);

interface Decision {
  readonly kind: DecisionKind;
  readonly createdAt: number;
  readonly resolvedAt: number | null;
  readonly outcome: string | null;
  readonly issueId: string | null;
}

const time = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const date =
    value instanceof Date
      ? value
      : typeof value === 'string' || typeof value === 'number'
        ? new Date(value)
        : null;
  if (!date) return null;
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const text = (value: unknown): string | null =>
  typeof value === 'string' && value !== '' ? value : null;

function kindOfNotice(source: string, type: string): DecisionKind {
  if (source === 'releases') return 'deployRequests';
  if (source === 'git') return 'merges';
  if (source === PROJECTS_SOURCE && type === RUN_FAILED_FINAL)
    return 'failedRuns';
  return 'other';
}

async function inboxDecisions(
  conn: DatabaseConnection,
  to: Date,
): Promise<Decision[]> {
  const rows = await conn.query
    .selectFrom('studioInboxNotices')
    .select([
      'notificationId',
      'source',
      'type',
      'decisionKey',
      'subjectType',
      'subjectId',
      'resolvedAt',
      'outcome',
      'createdAt',
    ])
    .where('kind', '=', 'decision')
    .where('createdAt', '<', to.toISOString())
    .execute<Row>();
  // One decision per contributor key, whoever it was sent to.
  const grouped = new Map<string, Row[]>();
  for (const row of rows) {
    const key = `${String(row.source)}\u0000${text(row.decisionKey) ?? String(row.notificationId)}`;
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }
  // Approval requests are the projects plugin's figures.
  const projectKeys = [...grouped.values()]
    .map((list) => list[0])
    .filter((row) => row.source === PROJECTS_SOURCE && text(row.decisionKey))
    .map((row) => String(row.decisionKey));
  const approvals = new Set<string>();
  for (let at = 0; at < projectKeys.length; at += 500)
    for (const row of await conn.query
      .selectFrom('pmApprovalRequests')
      .select('id')
      .where('id', 'in', projectKeys.slice(at, at + 500))
      .execute<Row>())
      approvals.add(String(row.id));
  const decisions: Decision[] = [];
  for (const list of grouped.values()) {
    const first = list[0];
    if (
      first.source === PROJECTS_SOURCE &&
      approvals.has(String(first.decisionKey))
    )
      continue;
    const created = Math.min(
      ...list.map((row) => time(row.createdAt) ?? Number.POSITIVE_INFINITY),
    );
    const resolved = list
      .map((row) => ({ at: time(row.resolvedAt), outcome: text(row.outcome) }))
      .filter((row): row is { at: number; outcome: string | null } =>
        Number.isFinite(row.at),
      )
      .sort((a, b) => a.at - b.at)[0];
    decisions.push({
      kind: kindOfNotice(String(first.source), String(first.type)),
      createdAt: created,
      resolvedAt: resolved?.at ?? null,
      outcome: resolved?.outcome ?? null,
      issueId: first.subjectType === 'issue' ? text(first.subjectId) : null,
    });
  }
  return decisions;
}

async function planDecisions(
  conn: DatabaseConnection,
  to: Date,
): Promise<Decision[]> {
  const rows = await conn.query
    .selectFrom('pmPlans')
    .select(['status', 'sourceIssueId', 'createdAt', 'executedAt', 'updatedAt'])
    .where('createdAt', '<', to.toISOString())
    .execute<Row>();
  return rows.map((row) => {
    const status = String(row.status);
    const waiting = WAITING_PLAN.has(status);
    return {
      kind: 'plans',
      createdAt: time(row.createdAt) ?? 0,
      resolvedAt: waiting
        ? null
        : (time(row.executedAt) ?? time(row.updatedAt)),
      outcome: waiting ? null : status,
      issueId: text(row.sourceIssueId),
    };
  });
}

/** The decisions other than approval requests, over `range` and what `viewer` may see. */
export async function decisionFigures(
  conn: DatabaseConnection,
  projects: Pick<Projects, 'reports'>,
  viewer: Viewer,
  range: {
    readonly from: Date;
    readonly to: Date;
    readonly projectId: string | null;
  },
): Promise<DecisionFigures> {
  const all = [
    ...(await inboxDecisions(conn, range.to)),
    ...(await planDecisions(conn, range.to)),
  ];
  const issueIds = [
    ...new Set(all.flatMap((decision) => decision.issueId ?? [])),
  ];
  const facts =
    issueIds.length === 0
      ? null
      : await projects.reports.describe(viewer, issueIds);
  const counted = all.filter((decision) => {
    if (!decision.issueId) return range.projectId === null;
    const issue = facts?.get(decision.issueId);
    if (!issue?.visible) return false;
    return range.projectId === null || issue.project?.id === range.projectId;
  });
  const from = range.from.getTime();
  const to = range.to.getTime();
  const byOutcome: Record<string, number> = {};
  const byKind: Partial<Record<DecisionKind, number>> = {};
  const resolveMs: number[] = [];
  let created = 0;
  let open = 0;
  for (const decision of counted) {
    if (decision.createdAt >= from && decision.createdAt < to) {
      created += 1;
      byKind[decision.kind] = (byKind[decision.kind] ?? 0) + 1;
    }
    if (decision.resolvedAt === null || decision.resolvedAt >= to) {
      open += 1;
      continue;
    }
    if (decision.resolvedAt < from) continue;
    resolveMs.push(Math.max(0, decision.resolvedAt - decision.createdAt));
    if (decision.outcome)
      byOutcome[decision.outcome] = (byOutcome[decision.outcome] ?? 0) + 1;
  }
  return { created, open, resolveMs, byOutcome, byKind };
}
