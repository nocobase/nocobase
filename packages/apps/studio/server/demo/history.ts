/**
 * The demo's past: work finished over the last two months, so the dashboard has something to measure from the first
 * visit. The rest of the demo is built through the plugins' services as people would; this part cannot be, since no
 * service writes the past. Each finished issue is created and moved to Done through the projects plugin like any other,
 * then its history is written directly: its creation and status changes are dated back (started, handed in for review,
 * sent back now and then, done), its executor is set (no demo runtime is online, so no run could have been started),
 * and the agents' runs on it, with their outcomes and the tokens they used, are added to the agents plugin's tables.
 *
 * On top of that: one run asks its issue's owner by moving it to Blocked, and one of today's open issues has a run that
 * failed a few hours ago. Overdue and blocked issues come with the demo's own issues; the deployment demo opens a pull
 * request that has waited for review for days (`deploy-data.ts`).
 */
import { randomUUID } from 'node:crypto';

import type {
  Projects,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { DatabaseConnection } from '@nocobase/db';

import { ISSUE_SUBJECT } from '../agents/catalog/triggers.js';
import { AGENT_KIND } from '../agents/tx.js';

type Outcome = 'completed' | 'failed' | 'cancelled';

/** A finished piece of work in the demo's past. */
export interface DemoHistoryIssue {
  readonly project: string;
  readonly title: string;
  /** The agent that executed it (a demo agent's name); a person otherwise. */
  readonly agent?: string;
  /** The person who executed it, when no agent did. */
  readonly person?: string;
  /** Days before today it was done. */
  readonly doneDaysAgo: number;
  /** Days from start to done. */
  readonly cycleDays: number;
  /** Sent back from review once before it was done. */
  readonly reworked?: boolean;
  /** The agent's runs on it, in order; a failed run is retried by the next. */
  readonly runs?: readonly Outcome[];
  /** Its agent asked its owner during its first run (moved it to Blocked). */
  readonly asked?: boolean;
}

const STUDIO = 'Studio Platform';
const SITE = 'Website Redesign';
const FRONTEND = 'Frontend Developer';
const REVIEWER = 'Code Reviewer';

export const DEMO_HISTORY: readonly DemoHistoryIssue[] = [
  // The last 30 days.
  {
    project: STUDIO,
    title: 'Filter the issue list by owner',
    agent: FRONTEND,
    doneDaysAgo: 1,
    cycleDays: 1.5,
    runs: ['completed'],
  },
  {
    project: SITE,
    title: 'Lazy-load the images above the fold on the homepage',
    agent: FRONTEND,
    doneDaysAgo: 2,
    cycleDays: 0.8,
    runs: ['completed'],
  },
  {
    project: STUDIO,
    title: 'Show the queue position in the run panel',
    agent: FRONTEND,
    doneDaysAgo: 3,
    cycleDays: 2.5,
    reworked: true,
    runs: ['completed', 'completed'],
  },
  {
    project: STUDIO,
    title: 'Fix the board order getting scrambled after a drag',
    person: 'alex',
    doneDaysAgo: 4,
    cycleDays: 3,
  },
  {
    project: STUDIO,
    title: 'Review the API key permission check change',
    agent: REVIEWER,
    doneDaysAgo: 5,
    cycleDays: 0.5,
    runs: ['completed'],
  },
  {
    project: SITE,
    title: 'Mobile layout for the pricing page',
    agent: FRONTEND,
    doneDaysAgo: 6,
    cycleDays: 2,
    runs: ['failed', 'completed'],
  },
  {
    project: STUDIO,
    title: 'Mark all as read in the notification center',
    agent: FRONTEND,
    doneDaysAgo: 8,
    cycleDays: 1.2,
    runs: ['completed'],
    asked: true,
  },
  {
    project: SITE,
    title: 'Tag filters on the blog list',
    person: 'lisa',
    doneDaysAgo: 9,
    cycleDays: 4,
  },
  {
    project: STUDIO,
    title: 'Validation messages on the project settings form',
    agent: FRONTEND,
    doneDaysAgo: 11,
    cycleDays: 1,
    runs: ['completed'],
  },
  {
    project: STUDIO,
    title: 'Review the database migration scripts',
    agent: REVIEWER,
    doneDaysAgo: 12,
    cycleDays: 0.4,
    runs: ['completed'],
  },
  {
    project: SITE,
    title: 'Language switcher in the footer',
    agent: FRONTEND,
    doneDaysAgo: 14,
    cycleDays: 3,
    reworked: true,
    runs: ['completed', 'cancelled', 'completed'],
  },
  {
    project: STUDIO,
    title: 'Upgrade frontend dependencies and fix type errors',
    person: 'leo',
    doneDaysAgo: 16,
    cycleDays: 2,
  },
  {
    project: STUDIO,
    title: 'Loading skeleton on the issue page',
    agent: FRONTEND,
    doneDaysAgo: 18,
    cycleDays: 1.5,
    runs: ['completed'],
  },
  {
    project: SITE,
    title: 'Add a CAPTCHA to the contact form',
    agent: FRONTEND,
    doneDaysAgo: 20,
    cycleDays: 2.2,
    runs: ['failed', 'completed'],
  },
  {
    project: STUDIO,
    title: 'Review the permission cache invalidation',
    agent: REVIEWER,
    doneDaysAgo: 22,
    cycleDays: 0.6,
    runs: ['completed'],
  },
  {
    project: STUDIO,
    title: 'Fix chart colors in dark mode',
    person: 'chloe',
    doneDaysAgo: 24,
    cycleDays: 1,
  },
  {
    project: SITE,
    title: 'Image gallery on the customer stories page',
    agent: FRONTEND,
    doneDaysAgo: 26,
    cycleDays: 4,
    runs: ['completed', 'completed'],
  },
  {
    project: STUDIO,
    title: 'Export issues to CSV',
    agent: FRONTEND,
    doneDaysAgo: 28,
    cycleDays: 2,
    runs: ['completed'],
  },
  // The 30 days before them, for the comparison.
  {
    project: STUDIO,
    title: 'Remember the username on the sign-in page',
    person: 'zach',
    doneDaysAgo: 33,
    cycleDays: 3,
  },
  {
    project: SITE,
    title: 'New navigation bar',
    agent: FRONTEND,
    doneDaysAgo: 36,
    cycleDays: 5,
    reworked: true,
    runs: ['failed', 'completed', 'completed'],
  },
  {
    project: STUDIO,
    title: 'Review the webhook signature check',
    agent: REVIEWER,
    doneDaysAgo: 40,
    cycleDays: 1,
    runs: ['completed'],
  },
  {
    project: STUDIO,
    title: 'Markdown preview for issue comments',
    person: 'lisa',
    doneDaysAgo: 44,
    cycleDays: 4,
  },
  {
    project: SITE,
    title: 'Redesign the About page',
    agent: FRONTEND,
    doneDaysAgo: 49,
    cycleDays: 3.5,
    runs: ['failed', 'completed'],
  },
  {
    project: STUDIO,
    title: 'Fix due dates shifted by the time zone',
    person: 'alex',
    doneDaysAgo: 55,
    cycleDays: 2,
  },
];

/** The open demo issue whose run failed a few hours ago. */
export const DEMO_FAILED_RUN_ISSUE = 'agent-logs';

const DAY = 24 * 3600 * 1000;
const MINUTE = 60_000;

export interface DemoHistoryContext {
  readonly projects: Pick<Projects, 'issues'>;
  readonly admin: Viewer;
  readonly connection: () => DatabaseConnection;
  readonly now: () => Date;
  readonly projectIds: ReadonlyMap<string, string>;
  readonly agentIds: ReadonlyMap<string, string>;
  readonly userIds: ReadonlyMap<string, string>;
  /** The demo's own issues, by key. */
  readonly issueIds: ReadonlyMap<string, string>;
  readonly created: (kind: string) => void;
  readonly warn: (message: string, error: unknown) => void;
}

/** A status change as the projects plugin records it, dated. */
interface Move {
  readonly from: string;
  readonly to: string;
  readonly at: Date;
  readonly agentId?: string;
  readonly runId?: string;
}

export async function buildDemoHistory(ctx: DemoHistoryContext): Promise<void> {
  const conn = ctx.connection();
  const now = ctx.now().getTime();
  // A couple of hours back, so nothing is dated in the future.
  const today = now - 2 * 3600 * 1000;

  for (const [index, spec] of DEMO_HISTORY.entries()) {
    const projectId = ctx.projectIds.get(spec.project);
    const agentId = spec.agent ? ctx.agentIds.get(spec.agent) : undefined;
    if (!projectId || (spec.agent && !agentId)) continue;
    try {
      const issue = await ctx.projects.issues.create(ctx.admin, {
        title: spec.title,
        description: spec.title,
        statusKey: 'todo',
        projectId,
        start: false,
      });
      await ctx.projects.issues.update(ctx.admin, issue.id, {
        revision: issue.revision,
        statusKey: 'done',
      });
      ctx.created('past issues');

      // When it happened: done `doneDaysAgo` days ago, started `cycleDays` before that, created a day before the start.
      const done = new Date(
        today - spec.doneDaysAgo * DAY - (index % 5) * 37 * MINUTE,
      );
      const started = new Date(done.getTime() - spec.cycleDays * DAY);
      const created = new Date(started.getTime() - DAY);
      const review = new Date(
        done.getTime() - Math.min(spec.cycleDays * DAY * 0.25, 6 * 3600 * 1000),
      );

      // The runs, spread over the time it was worked on.
      const runs: { id: string; outcome: Outcome; start: Date; end: Date }[] =
        [];
      const slots = spec.runs ?? [];
      for (const [at, outcome] of slots.entries()) {
        const begin = new Date(
          started.getTime() +
            ((review.getTime() - started.getTime()) * at) /
              Math.max(1, slots.length),
        );
        runs.push({
          id: randomUUID(),
          outcome,
          start: begin,
          end: new Date(
            begin.getTime() + (12 + ((index * 7 + at * 11) % 30)) * MINUTE,
          ),
        });
      }

      const moves: Move[] = [{ from: 'todo', to: 'in_progress', at: started }];
      if (spec.asked && runs[0]) {
        const asked = new Date(runs[0].start.getTime() + 5 * MINUTE);
        moves.push(
          {
            from: 'in_progress',
            to: 'blocked',
            at: asked,
            agentId,
            runId: runs[0].id,
          },
          {
            from: 'blocked',
            to: 'in_progress',
            at: new Date(asked.getTime() + 3 * 3600 * 1000),
          },
        );
      }
      if (spec.reworked) {
        const first = new Date(
          started.getTime() + (review.getTime() - started.getTime()) / 2,
        );
        moves.push(
          { from: 'in_progress', to: 'in_review', at: first },
          {
            from: 'in_review',
            to: 'in_progress',
            at: new Date(first.getTime() + 2 * 3600 * 1000),
          },
        );
      }
      moves.push(
        { from: 'in_progress', to: 'in_review', at: review },
        { from: 'in_review', to: 'done', at: done },
      );
      moves.sort((a, b) => a.at.getTime() - b.at.getTime());

      await writeHistory(conn, {
        issueId: issue.id,
        adminId: ctx.admin.userId,
        created,
        done,
        moves,
        executor: agentId
          ? { type: AGENT_KIND, id: agentId }
          : spec.person && ctx.userIds.get(spec.person)
            ? { type: 'user', id: ctx.userIds.get(spec.person)! }
            : null,
      });
      if (agentId)
        for (const [at, run] of runs.entries()) {
          await writeRun(conn, {
            id: run.id,
            agentId,
            issueId: issue.id,
            actorUserId: ctx.admin.userId,
            outcome: run.outcome,
            queuedAt: new Date(
              run.start.getTime() - (1 + ((index + at) % 6)) * MINUTE,
            ),
            start: run.start,
            end: run.end,
            retryOf:
              at > 0 && runs[at - 1]?.outcome === 'failed'
                ? runs[at - 1].id
                : null,
            tokens: 250_000 + ((index * 53_000 + at * 91_000) % 600_000),
          });
          ctx.created('past runs');
        }
    } catch (error) {
      ctx.warn(`Past demo work "${spec.title}" was not written`, error);
    }
  }

  // A run on one of today's open issues failed a few hours ago.
  const openIssue = ctx.issueIds.get(DEMO_FAILED_RUN_ISSUE);
  const agentId = ctx.agentIds.get(FRONTEND);
  if (openIssue && agentId)
    try {
      const start = new Date(now - 3 * 3600 * 1000);
      await writeRun(conn, {
        id: randomUUID(),
        agentId,
        issueId: openIssue,
        actorUserId: ctx.admin.userId,
        outcome: 'failed',
        queuedAt: new Date(start.getTime() - 2 * MINUTE),
        start,
        end: new Date(start.getTime() + 9 * MINUTE),
        retryOf: null,
        tokens: 180_000,
      });
      ctx.created('past runs');
    } catch (error) {
      ctx.warn('The demo failed run was not written', error);
    }
}

/** Dates an issue back: its creation, its status changes and its last activity, and sets its executor. */
async function writeHistory(
  conn: DatabaseConnection,
  input: {
    readonly issueId: string;
    readonly adminId: string;
    readonly created: Date;
    readonly done: Date;
    readonly moves: readonly Move[];
    readonly executor: { readonly type: string; readonly id: string } | null;
  },
): Promise<void> {
  const activities = conn.repository('pmActivities');
  await activities.deleteMany({
    filter: { issueId: input.issueId, action: 'status_changed' },
  });
  await activities.updateMany({
    filter: { issueId: input.issueId },
    values: { createdAt: input.created },
  });
  for (const move of input.moves)
    await activities.createOne({
      values: {
        id: randomUUID(),
        issueId: input.issueId,
        actorType: move.agentId ? AGENT_KIND : 'user',
        actorId: move.agentId ?? input.adminId,
        action: 'status_changed',
        details: {
          from: move.from,
          to: move.to,
          ...(move.runId ? { trace: { runId: move.runId } } : {}),
        },
        createdAt: move.at,
      },
    });
  await conn.repository('pmIssues').updateMany({
    filter: { id: input.issueId },
    values: {
      createdAt: input.created,
      updatedAt: input.done,
      lastActivityAt: input.done,
      ...(input.executor
        ? { executorType: input.executor.type, executorId: input.executor.id }
        : {}),
    },
  });
}

/** An agent's run on an issue, ended, with the tokens it used on Claude Code's Sonnet. */
async function writeRun(
  conn: DatabaseConnection,
  run: {
    readonly id: string;
    readonly agentId: string;
    readonly issueId: string;
    readonly actorUserId: string;
    readonly outcome: Outcome;
    readonly queuedAt: Date;
    readonly start: Date;
    readonly end: Date;
    readonly retryOf: string | null;
    readonly tokens: number;
  },
): Promise<void> {
  const cancelled = run.outcome === 'cancelled';
  await conn.repository('agRuns').createOne({
    values: {
      id: run.id,
      agentId: run.agentId,
      agentType: 'runner',
      tool: 'claude',
      model: 'claude-sonnet-4-5',
      runnerId: null,
      status: run.outcome,
      priority: 0,
      attempt: run.retryOf ? 2 : 1,
      maxAttempts: 3,
      retryOfRunId: run.retryOf,
      subjectKind: ISSUE_SUBJECT,
      subjectId: run.issueId,
      threadScope: 'main',
      actorUserId: run.actorUserId,
      ownerUserId: run.actorUserId,
      requires: [],
      acceptsInput: false,
      dispatchedAt: run.start,
      startedAt: run.start,
      finishedAt: run.end,
      lastActivityAt: run.end,
      failureReason: run.outcome === 'failed' ? 'toolProcess' : null,
      failureDetail:
        run.outcome === 'failed' ? 'The tests failed after the change.' : null,
      summary: run.outcome === 'completed' ? 'Done.' : null,
      claimFailures: 0,
      createdAt: run.queuedAt,
      updatedAt: run.end,
    },
  });
  if (cancelled) return;
  await conn.repository('agRunUsage').createOne({
    values: {
      id: randomUUID(),
      runId: run.id,
      tool: 'claude',
      modelService: null,
      model: 'claude-sonnet-4-5',
      inputTokens: run.tokens,
      outputTokens: Math.round(run.tokens / 20),
      cacheReadTokens: run.tokens * 3,
      cacheWriteTokens: 0,
      reasoningTokens: 0,
      createdAt: run.end,
    },
  });
}
