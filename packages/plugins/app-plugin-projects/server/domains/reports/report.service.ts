/**
 * The issue side of the reports (the agents plugin's Reports page composes it with its runs): raw counts over a date
 * range, limited to the issues the viewer may see (`visibleIssues`) and, when asked, to one project. The caller turns
 * them into rates and percentiles; nothing here knows about runs or prices.
 *
 * Definitions, kept from NocoProject's acceptance metrics:
 *
 * - adoption: the days with an issue created or a comment written; issues created; comments written; the people with
 *   any activity on an issue (the activity log's user actors and comment authors).
 * - aiShare: issues that entered a `done`-category status in the range (by `status_changed` activity), and those of
 *   them whose current executor is of the given kind (an agent), by executor; day by day (the day each last entered
 *   one), and how long each took from being created to that entry (its cycle time).
 * - trust: every exit from `in_review` in the range, those to a `done`-category status (passed) and those back to
 *   `in_progress` (rework); approval requests decided in the range, approved or rejected.
 * - decisions (the human load): approval requests created in the range; those decided (approved or rejected) in it
 *   with how long each took; those still pending that were created before the end; how the decided ones ended.
 *
 * `wip` is not over a range: the live issues now in each status that is neither done nor closed.
 *
 * The flow of a range (`flow`, a lead's dashboard), per issue so the caller can group it by day, project or executor:
 *
 * - completed: each issue that entered a `done`-category status in the range (the last time it did, `doneAt`), with
 *   when it was started (`startedAt`): the first time it entered a `started`-category status, or its creation when it
 *   was created in one (the first status change's `from`); null when it went to done without being started.
 * - returned: each status change in the range that sent work back, from `in_review` or a `done`-category status to an
 *   `unstarted` or `started` one other than `in_review` (review rejected, or a finished issue reopened).
 * - agentBlocks: each move to `blocked` by an agent in the range (an agent principal, or a person's action through an
 *   agent, `via: 'agent'`), with the run that made it when the trace names one: an agent blocks an issue to ask its
 *   owner.
 *
 * Now, not over a range: `projects`, each visible project's live issues by category and those blocked; `attention`,
 * the live issues blocked (status `blocked`) and those overdue (a due date before today, neither done nor closed).
 */
import type {
  DatabaseConnection,
  FilterBuilder,
  FilterNode,
} from '@nocobase/db';

import {
  BUILTIN_STATUSES,
  type WorkflowStatus,
} from '../../../shared/workflows.js';
import type { Viewer } from '../../access/viewer.js';
import { oneOf } from '../../kernel/db.js';
import type { TxRunner } from '../../kernel/tx.js';
import { visibleIssues } from '../issues/issue.access.js';
import { visibleProjectsFilter } from '../projects/project.access.js';
import type { ProjectRecord } from '../projects/project.store.js';
import { listWorkflows } from '../workflows/workflow.store.js';

export interface IssueReportQuery {
  /** Inclusive. */
  readonly from: Date;
  /** Exclusive. */
  readonly to: Date;
  readonly projectId?: string | null;
  /** The executor kind counted as an agent in `aiShare` (`agent`). */
  readonly agentKind: string;
}

export interface IssueReport {
  readonly adoption: {
    /** `YYYY-MM-DD` (UTC) days with an issue created or a comment written. */
    readonly activityDays: readonly string[];
    readonly issuesCreated: number;
    readonly commentsCreated: number;
    /** People with any activity on an issue in the range. */
    readonly memberIds: readonly string[];
  };
  readonly aiShare: {
    readonly deliveredTotal: number;
    readonly deliveredByAgent: number;
    /** Delivered issues by the agent executing them. */
    readonly byAgent: Readonly<Record<string, number>>;
    /** `YYYY-MM-DD` (UTC) → the issues delivered that day, and those of them an agent executes. */
    readonly daily: Readonly<
      Record<string, { readonly total: number; readonly byAgent: number }>
    >;
    /** Created → delivered of each delivered issue, in milliseconds. */
    readonly cycleMs: readonly number[];
  };
  readonly trust: {
    readonly reviewExits: number;
    readonly reviewPassed: number;
    readonly reworked: number;
    readonly approvalsApproved: number;
    readonly approvalsRejected: number;
  };
  readonly decisions: {
    readonly created: number;
    readonly resolved: number;
    readonly open: number;
    /** createdAt → decidedAt of each resolved one, in milliseconds. */
    readonly resolveMs: readonly number[];
    /** Decided in the range, by how they ended (`approved`, `rejected`, `withdrawn`, `stale`). */
    readonly byOutcome: Readonly<Record<string, number>>;
  };
}

/** What a report says about one issue; `visible` is false for an issue the viewer may not see (or one deleted). */
export interface IssueFacts {
  readonly id: string;
  readonly identifier: string;
  readonly title: string;
  readonly visible: boolean;
  readonly project: { readonly id: string; readonly name: string } | null;
}

/** The live issues now in one status that is neither done nor closed. */
export interface WipCount {
  readonly key: string;
  readonly name: string;
  readonly category: string;
  readonly count: number;
}

/** An issue completed in the range (`IssueReports.flow`). */
export interface CompletedIssue {
  readonly id: string;
  readonly projectId: string | null;
  /** Its executor now is of the agent kind asked. */
  readonly byAgent: boolean;
  readonly executorId: string | null;
  /** The last time it entered a `done`-category status. */
  readonly doneAt: string;
  /** The first time it entered a `started`-category status (its creation when created in one); null when never. */
  readonly startedAt: string | null;
}

/** Work sent back in the range: from review, or from done, to an unstarted or started status. */
export interface ReturnedIssue {
  readonly id: string;
  readonly projectId: string | null;
  readonly byAgent: boolean;
  readonly at: string;
  readonly from: string;
  readonly to: string;
}

/** A move to `blocked` by an agent: the agent asked the issue's owner. */
export interface AgentBlock {
  readonly issueId: string;
  readonly agentId: string | null;
  /** The run that made the move, when its trace names one. */
  readonly runId: string | null;
  readonly at: string;
}

export interface IssueFlow {
  readonly completed: readonly CompletedIssue[];
  readonly returned: readonly ReturnedIssue[];
  readonly agentBlocks: readonly AgentBlock[];
}

/** A visible project's live issues now. */
export interface ProjectProgress {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  /** Live issues in any status but a `closed`-category one. */
  readonly total: number;
  /** Of them, those in a `done`-category status. */
  readonly done: number;
  /** Of them, those in `blocked`. */
  readonly blocked: number;
}

/** A live issue that needs attention. */
export interface AttentionIssue {
  readonly id: string;
  readonly identifier: string;
  readonly title: string;
  readonly projectId: string | null;
  readonly statusKey: string;
  readonly executorType: string | null;
  readonly executorId: string | null;
  /** `YYYY-MM-DD`, or null. */
  readonly dueDate: string | null;
  /** Its last activity: how long a blocked issue has waited. */
  readonly lastActivityAt: string;
}

export interface AttentionList {
  readonly total: number;
  /** The first `limit`: blocked the longest first, overdue the earliest due first. */
  readonly items: readonly AttentionIssue[];
}

export interface IssueAttention {
  readonly blocked: AttentionList;
  readonly overdue: AttentionList;
}

export interface IssueReports {
  report(viewer: Viewer, query: IssueReportQuery): Promise<IssueReport>;
  /** The visible live issues (of the project, when asked) by open status, in workflow order. */
  wip(viewer: Viewer, projectId?: string | null): Promise<WipCount[]>;
  /** The issues completed, sent back and blocked by agents in the range, one by one. */
  flow(viewer: Viewer, query: IssueReportQuery): Promise<IssueFlow>;
  /** Every project the viewer may see but cancelled ones, with its visible live issues now, by name. */
  projects(viewer: Viewer): Promise<ProjectProgress[]>;
  /** The visible live issues blocked, and those overdue on `today` (`YYYY-MM-DD`), at most `limit` of each. */
  attention(
    viewer: Viewer,
    query: { readonly today: string; readonly limit: number },
  ): Promise<IssueAttention>;
  /** Facts about the issues with these ids; an id that names no issue is left out. */
  describe(
    viewer: Viewer,
    ids: readonly string[],
  ): Promise<Map<string, IssueFacts>>;
}

interface IssueRow {
  readonly id: string;
  readonly identifier: string;
  readonly title: string;
  readonly projectId: string | null;
  readonly statusKey: string;
  readonly executorType: string | null;
  readonly executorId: string | null;
  readonly createdAt: Date | string;
  readonly deletedAt: Date | string | null;
  readonly dueDate?: Date | string | null;
  readonly lastActivityAt?: Date | string;
}

interface ActivityRow {
  readonly issueId: string;
  readonly actorType: string;
  readonly actorId: string | null;
  readonly action: string;
  readonly details: unknown;
  readonly createdAt: Date | string;
}

interface CommentRow {
  readonly authorType: string;
  readonly authorId: string | null;
  readonly createdAt: Date | string;
}

interface ApprovalRow {
  readonly status: string;
  readonly createdAt: Date | string;
  readonly decidedAt: Date | string | null;
}

const PAGE = 200;

const time = (value: Date | string | null): number | null =>
  value === null ? null : new Date(value).getTime();

const dayOf = (value: Date | string): string =>
  new Date(value).toISOString().slice(0, 10);

function detailsOf(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

/** Every status key of the `done` category, across the workflows. */
async function doneKeys(conn: DatabaseConnection): Promise<Set<string>> {
  const keys = new Set(
    BUILTIN_STATUSES.filter((status) => status.category === 'done').map(
      (status) => status.key,
    ),
  );
  for (const workflow of await listWorkflows(conn))
    for (const state of workflow.definition.states)
      if (state.category === 'done') keys.add(state.key);
  return keys;
}

/** Every status key's categories, across the workflows (a key may mean different things in two of them). */
async function statusCategories(
  conn: DatabaseConnection,
): Promise<Map<string, Set<string>>> {
  const categories = new Map<string, Set<string>>();
  const add = (key: string, category: string) =>
    categories.set(key, (categories.get(key) ?? new Set()).add(category));
  for (const status of BUILTIN_STATUSES) add(status.key, status.category);
  for (const workflow of await listWorkflows(conn))
    for (const state of workflow.definition.states)
      add(state.key, state.category);
  return categories;
}

/** The status agents ask an issue's owner with, and the one work is handed in for review in. */
const BLOCKED_STATUS = 'blocked';
const REVIEW_STATUS = 'in_review';

/** The agent behind an activity: an agent principal, or a person acting through one (`via: 'agent'`). */
function agentOf(
  row: ActivityRow,
  details: Record<string, unknown>,
  agentKind: string,
): { readonly agentId: string | null; readonly runId: string | null } | null {
  const trace = (
    details.trace && typeof details.trace === 'object' ? details.trace : {}
  ) as { agentId?: unknown; runId?: unknown };
  const runId = typeof trace.runId === 'string' ? trace.runId : null;
  if (row.actorType === agentKind) return { agentId: row.actorId, runId };
  if (details.via === 'agent')
    return {
      agentId: typeof trace.agentId === 'string' ? trace.agentId : null,
      runId,
    };
  return null;
}

const isoOf = (value: Date | string): string => new Date(value).toISOString();

/** A date column as `YYYY-MM-DD`, whichever way the driver returns it. */
function dayString(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(value))
    return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

export function createIssueReports(deps: {
  readonly tx: TxRunner;
}): IssueReports {
  /** The issues in the report: visible to the viewer, and in the project when one is asked. */
  const inScope =
    (viewer: Viewer, projectId: string | null | undefined) =>
    (f: FilterBuilder): FilterNode =>
      projectId
        ? f.and([visibleIssues(f, viewer), f.string('projectId').eq(projectId)])
        : visibleIssues(f, viewer);

  const inRange = (
    f: FilterBuilder,
    field: string,
    query: IssueReportQuery,
  ): FilterNode =>
    f.and([
      f.date(field).notBefore(query.from),
      f.date(field).before(query.to),
    ]);

  return {
    async report(viewer, query) {
      const conn = deps.tx.read();
      const scope = inScope(viewer, query.projectId);
      const ofIssue = (f: FilterBuilder) =>
        f.relation('issue').some((issue) => scope(issue));

      const created = await conn.repository<IssueRow>('pmIssues').findMany({
        filter: (f) => f.and([scope(f), inRange(f, 'createdAt', query)]),
      });
      const comments = await conn
        .repository<CommentRow>('pmComments')
        .findMany({
          filter: (f) =>
            f.and([
              ofIssue(f),
              f.date('deletedAt').empty(),
              inRange(f, 'createdAt', query),
            ]),
        });
      const activities = await conn
        .repository<ActivityRow>('pmActivities')
        .findMany({
          filter: (f) => f.and([ofIssue(f), inRange(f, 'createdAt', query)]),
        });

      const members = new Set<string>();
      for (const row of activities)
        if (row.actorType === 'user' && row.actorId) members.add(row.actorId);
      for (const row of comments)
        if (row.authorType === 'user' && row.authorId)
          members.add(row.authorId);

      // Status moves: deliveries, and exits from review.
      const done = await doneKeys(conn);
      // Each delivered issue, with when it last entered a done status.
      const delivered = new Map<string, number>();
      let reviewExits = 0;
      let reviewPassed = 0;
      let reworked = 0;
      for (const row of activities) {
        if (row.action !== 'status_changed') continue;
        const details = detailsOf(row.details);
        const from = typeof details.from === 'string' ? details.from : '';
        const to = typeof details.to === 'string' ? details.to : '';
        if (done.has(to)) {
          const at = time(row.createdAt) ?? 0;
          if (at >= (delivered.get(row.issueId) ?? 0))
            delivered.set(row.issueId, at);
        }
        if (from === 'in_review' && to !== 'in_review') {
          reviewExits += 1;
          if (done.has(to)) reviewPassed += 1;
          if (to === 'in_progress') reworked += 1;
        }
      }
      const byAgent: Record<string, number> = {};
      const daily: Record<string, { total: number; byAgent: number }> = {};
      const cycleMs: number[] = [];
      let deliveredByAgent = 0;
      const deliveredIds = [...delivered.keys()];
      for (let at = 0; at < deliveredIds.length; at += PAGE) {
        const page = deliveredIds.slice(at, at + PAGE);
        const rows = await conn.repository<IssueRow>('pmIssues').findMany({
          filter: (f) => oneOf(f, 'id', page),
        });
        for (const row of rows) {
          const doneAt = delivered.get(row.id) ?? 0;
          const day = new Date(doneAt).toISOString().slice(0, 10);
          const agent = row.executorType === query.agentKind;
          daily[day] = {
            total: (daily[day]?.total ?? 0) + 1,
            byAgent: (daily[day]?.byAgent ?? 0) + (agent ? 1 : 0),
          };
          const createdAt = time(row.createdAt);
          if (createdAt !== null) cycleMs.push(Math.max(0, doneAt - createdAt));
          if (!agent) continue;
          deliveredByAgent += 1;
          if (row.executorId)
            byAgent[row.executorId] = (byAgent[row.executorId] ?? 0) + 1;
        }
      }

      // Approval requests: the decisions people take.
      const approvals = conn.repository<ApprovalRow>('pmApprovalRequests');
      const requested = await approvals.findMany({
        filter: (f) => f.and([ofIssue(f), inRange(f, 'createdAt', query)]),
      });
      const decided = await approvals.findMany({
        filter: (f) =>
          f.and([
            ofIssue(f),
            f.date('decidedAt').notEmpty(),
            inRange(f, 'decidedAt', query),
          ]),
      });
      const open = await approvals.count({
        filter: (f) =>
          f.and([
            ofIssue(f),
            f.string('status').eq('pending'),
            f.date('createdAt').before(query.to),
          ]),
      });
      const byOutcome: Record<string, number> = {};
      const resolveMs: number[] = [];
      let approved = 0;
      let rejected = 0;
      for (const row of decided) {
        byOutcome[row.status] = (byOutcome[row.status] ?? 0) + 1;
        if (row.status === 'approved') approved += 1;
        if (row.status === 'rejected') rejected += 1;
        if (row.status !== 'approved' && row.status !== 'rejected') continue;
        const start = time(row.createdAt);
        const end = time(row.decidedAt);
        if (start !== null && end !== null)
          resolveMs.push(Math.max(0, end - start));
      }

      return {
        adoption: {
          activityDays: [
            ...new Set([
              ...created.map((row) => dayOf(row.createdAt)),
              ...comments.map((row) => dayOf(row.createdAt)),
            ]),
          ].sort(),
          issuesCreated: created.length,
          commentsCreated: comments.length,
          memberIds: [...members].sort(),
        },
        aiShare: {
          deliveredTotal: delivered.size,
          deliveredByAgent,
          byAgent,
          daily,
          cycleMs,
        },
        trust: {
          reviewExits,
          reviewPassed,
          reworked,
          approvalsApproved: approved,
          approvalsRejected: rejected,
        },
        decisions: {
          created: requested.length,
          resolved: resolveMs.length,
          open,
          resolveMs,
          byOutcome,
        },
      };
    },

    async wip(viewer, projectId) {
      const conn = deps.tx.read();
      const scope = inScope(viewer, projectId);
      // A workflow's own name wins over the built-in one, the default workflow's first, so a renamed status reads as
      // renamed; the order stays the built-in statuses' and then the added ones'.
      const named = new Map<string, WorkflowStatus>();
      for (const workflow of await listWorkflows(conn))
        for (const state of workflow.definition.states)
          if (!named.has(state.key)) named.set(state.key, state);
      const statuses = new Map(
        BUILTIN_STATUSES.map(
          (status) => [status.key, named.get(status.key) ?? status] as const,
        ),
      );
      for (const [key, state] of named)
        if (!statuses.has(key)) statuses.set(key, state);
      const groups = await conn.repository<IssueRow>('pmIssues').groupBy({
        by: ['statusKey'],
        aggregate: (aggregate) => ({ count: aggregate.count() }),
        filter: (f) => f.and([scope(f), f.date('deletedAt').empty()]),
      });
      const counts = new Map(
        groups.map((group) => [String(group.statusKey), Number(group.count)]),
      );
      const order = [...statuses.keys()];
      return [...counts]
        .map(([key, count]) => {
          const status = statuses.get(key);
          return {
            key,
            name: status?.name ?? key,
            category: status?.category ?? 'unstarted',
            count,
          };
        })
        .filter((row) => row.category !== 'done' && row.category !== 'closed')
        .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
    },

    async flow(viewer, query) {
      const conn = deps.tx.read();
      const scope = inScope(viewer, query.projectId);
      const categories = await statusCategories(conn);
      const is = (key: string, category: string) =>
        categories.get(key)?.has(category) ?? false;
      const moves = await conn
        .repository<ActivityRow>('pmActivities')
        .findMany({
          filter: (f) =>
            f.and([
              f.relation('issue').some((issue) => scope(issue)),
              f.string('action').eq('status_changed'),
              inRange(f, 'createdAt', query),
            ]),
          sort: (sort) => [sort.field('createdAt').asc()],
        });

      const doneAt = new Map<string, number>();
      const sentBack: {
        issueId: string;
        at: number;
        from: string;
        to: string;
      }[] = [];
      const blocks: AgentBlock[] = [];
      for (const row of moves) {
        const details = detailsOf(row.details);
        const from = typeof details.from === 'string' ? details.from : '';
        const to = typeof details.to === 'string' ? details.to : '';
        const at = time(row.createdAt) ?? 0;
        if (is(to, 'done') && at >= (doneAt.get(row.issueId) ?? 0))
          doneAt.set(row.issueId, at);
        if (
          (from === REVIEW_STATUS || is(from, 'done')) &&
          to !== REVIEW_STATUS &&
          to !== from &&
          (is(to, 'unstarted') || is(to, 'started')) &&
          !is(to, 'done')
        )
          sentBack.push({ issueId: row.issueId, at, from, to });
        if (to === BLOCKED_STATUS) {
          const agent = agentOf(row, details, query.agentKind);
          if (agent)
            blocks.push({
              issueId: row.issueId,
              agentId: agent.agentId,
              runId: agent.runId,
              at: new Date(at).toISOString(),
            });
        }
      }

      // The issues named, and every status change of the completed ones, for when each was started.
      const ids = [
        ...new Set([...doneAt.keys(), ...sentBack.map((move) => move.issueId)]),
      ];
      const issues = new Map<string, IssueRow>();
      const history = new Map<string, ActivityRow[]>();
      const completedIds = [...doneAt.keys()];
      for (let at = 0; at < ids.length; at += PAGE)
        for (const row of await conn.repository<IssueRow>('pmIssues').findMany({
          filter: (f) => oneOf(f, 'id', ids.slice(at, at + PAGE)),
        }))
          issues.set(row.id, row);
      for (let at = 0; at < completedIds.length; at += PAGE)
        for (const row of await conn
          .repository<ActivityRow>('pmActivities')
          .findMany({
            filter: (f) =>
              f.and([
                oneOf(f, 'issueId', completedIds.slice(at, at + PAGE)),
                f.string('action').eq('status_changed'),
              ]),
            sort: (sort) => [sort.field('createdAt').asc()],
          }))
          history.set(row.issueId, [...(history.get(row.issueId) ?? []), row]);

      const startedAt = (issue: IssueRow): string | null => {
        const changes = history.get(issue.id) ?? [];
        const first = detailsOf(changes[0]?.details);
        if (typeof first.from === 'string' && is(first.from, 'started'))
          return isoOf(issue.createdAt);
        for (const change of changes) {
          const to = detailsOf(change.details).to;
          if (typeof to === 'string' && is(to, 'started'))
            return isoOf(change.createdAt);
        }
        return null;
      };
      const byAgent = (issue: IssueRow) =>
        issue.executorType === query.agentKind;

      const completed: CompletedIssue[] = [];
      for (const [id, at] of doneAt) {
        const issue = issues.get(id);
        if (!issue) continue;
        const started = startedAt(issue);
        completed.push({
          id,
          projectId: issue.projectId,
          byAgent: byAgent(issue),
          executorId: issue.executorId,
          doneAt: new Date(at).toISOString(),
          startedAt: started,
        });
      }
      const returned: ReturnedIssue[] = [];
      for (const move of sentBack) {
        const issue = issues.get(move.issueId);
        if (!issue) continue;
        returned.push({
          id: issue.id,
          projectId: issue.projectId,
          byAgent: byAgent(issue),
          at: new Date(move.at).toISOString(),
          from: move.from,
          to: move.to,
        });
      }
      return { completed, returned, agentBlocks: blocks };
    },

    async projects(viewer) {
      const conn = deps.tx.read();
      const categories = await statusCategories(conn);
      const is = (key: string, category: string) =>
        categories.get(key)?.has(category) ?? false;
      const visible = visibleProjectsFilter(viewer);
      const projects = await conn
        .repository<ProjectRecord>('pmProjects')
        .findMany({
          ...(visible ? { filter: visible } : {}),
          sort: (sort) => [sort.field('name').asc(), sort.field('id').asc()],
        });
      const groups = await conn.repository<IssueRow>('pmIssues').groupBy({
        by: ['projectId', 'statusKey'],
        aggregate: (aggregate) => ({ count: aggregate.count() }),
        filter: (f) =>
          f.and([
            visibleIssues(f, viewer),
            f.date('deletedAt').empty(),
            f.string('projectId').ne(null),
          ]),
      });
      const counts = new Map<
        string,
        { total: number; done: number; blocked: number }
      >();
      for (const group of groups) {
        const projectId = String(group.projectId);
        const key = String(group.statusKey);
        const count = Number(group.count);
        if (is(key, 'closed') && !is(key, 'done')) continue;
        const row = counts.get(projectId) ?? { total: 0, done: 0, blocked: 0 };
        row.total += count;
        if (is(key, 'done')) row.done += count;
        if (key === BLOCKED_STATUS) row.blocked += count;
        counts.set(projectId, row);
      }
      return projects
        .filter((project) => project.status !== 'cancelled')
        .map((project) => ({
          id: project.id,
          name: project.name,
          status: project.status,
          ...(counts.get(project.id) ?? { total: 0, done: 0, blocked: 0 }),
        }));
    },

    async attention(viewer, { today, limit }) {
      const conn = deps.tx.read();
      const categories = await statusCategories(conn);
      const open = (key: string) =>
        ![...(categories.get(key) ?? [])].some(
          (category) => category === 'done' || category === 'closed',
        );
      const live = (f: FilterBuilder) =>
        f.and([visibleIssues(f, viewer), f.date('deletedAt').empty()]);
      const item = (row: IssueRow): AttentionIssue => ({
        id: row.id,
        identifier: row.identifier,
        title: row.title,
        projectId: row.projectId,
        statusKey: row.statusKey,
        executorType: row.executorType,
        executorId: row.executorId,
        dueDate: dayString(row.dueDate),
        lastActivityAt: isoOf(row.lastActivityAt ?? row.createdAt),
      });
      const issues = conn.repository<IssueRow>('pmIssues');
      const blockedFilter = (f: FilterBuilder) =>
        f.and([live(f), f.string('statusKey').eq(BLOCKED_STATUS)]);
      const blocked = await issues.findMany({
        filter: blockedFilter,
        sort: (sort) => [
          sort.field('lastActivityAt').asc(),
          sort.field('id').asc(),
        ],
        limit,
      });
      const blockedTotal = await issues.count({ filter: blockedFilter });
      // Due dates are few; the comparison with today is made here, whatever the column's type on the dialect.
      const due = (
        await issues.findMany({
          filter: (f) => f.and([live(f), f.date('dueDate').notEmpty()]),
        })
      )
        .map(item)
        .filter(
          (row) =>
            row.dueDate !== null && row.dueDate < today && open(row.statusKey),
        )
        .sort(
          (a, b) =>
            (a.dueDate ?? '').localeCompare(b.dueDate ?? '') ||
            a.identifier.localeCompare(b.identifier),
        );
      return {
        blocked: { total: blockedTotal, items: blocked.map(item) },
        overdue: { total: due.length, items: due.slice(0, limit) },
      };
    },

    async describe(viewer, ids) {
      const conn = deps.tx.read();
      const wanted = [...new Set(ids.filter(Boolean))];
      const rows: IssueRow[] = [];
      const visible = new Set<string>();
      for (let at = 0; at < wanted.length; at += PAGE) {
        const page = wanted.slice(at, at + PAGE);
        rows.push(
          ...(await conn.repository<IssueRow>('pmIssues').findMany({
            filter: (f) => oneOf(f, 'id', page),
          })),
        );
        for (const row of await conn.repository<IssueRow>('pmIssues').findMany({
          filter: (f) =>
            f.and([oneOf(f, 'id', page), visibleIssues(f, viewer)]),
        }))
          visible.add(row.id);
      }
      const projectIds = [
        ...new Set(rows.map((row) => row.projectId).filter(Boolean)),
      ] as string[];
      const projects = new Map<string, string>();
      for (let at = 0; at < projectIds.length; at += PAGE)
        for (const project of await conn
          .repository<{ id: string; name: string }>('pmProjects')
          .findMany({
            filter: (f) => oneOf(f, 'id', projectIds.slice(at, at + PAGE)),
          }))
          projects.set(project.id, project.name);
      return new Map(
        rows.map((row) => [
          row.id,
          {
            id: row.id,
            identifier: row.identifier,
            title: row.title,
            visible: visible.has(row.id),
            project: row.projectId
              ? {
                  id: row.projectId,
                  name: projects.get(row.projectId) ?? row.projectId,
                }
              : null,
          },
        ]),
      );
    },
  };
}
