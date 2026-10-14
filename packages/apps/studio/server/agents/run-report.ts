/**
 * Every run an agent's comment started leaves a comment by its agent (`work.ts`): once it commits, a run that completed
 * without commenting on its issue since it started answers in the thread of the comment that started it with its final
 * output, and a run that failed for good says there that it failed and why. Ordinary cancellation says nothing; a delegated queue timeout reports its saved cause. The comment
 * goes through the comment triggers like any agent comment, for the person the run acted for, so it wakes the issue's
 * executing agent (the coordinator) and counts toward the workflow's `commentRunLimit`. Once per run: a guard row keyed
 * by the run (`comment-guard.ts`) is written with the comment.
 */
import { redactPatterns } from '@nocobase/agent-protocol';
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type { Run } from '@nocobase/app-plugin-agents/shared/runs';
import type { DatabaseConnection } from '@nocobase/db';
import type { ProjectsTx } from '@nocobase/app-plugin-projects/server/tokens';
import { firstDispatch, managerDispatchInput } from './delegated-queue.js';
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';

import { ISSUE_SUBJECT } from './catalog/triggers.js';
import { guardIdOf, commentGuards } from './comment-guard.js';
import { AGENT_KIND } from './tx.js';
import { jsonObject } from './values.js';

/** The guard row's `statusKey`, which is no status key. */
const REPORT_GUARD = '@report';

/** At most this many characters of a run's output, and of its failure detail, go into the comment. */
export const REPORT_OUTPUT_MAX = 4000;
export const REPORT_DETAIL_MAX = 500;

/** Output that says nothing a reader could use. */
const TRIVIAL = /^(?:done|ok|okay|completed?|finished)[.!]?$/iu;

const bounded = (text: string, max: number) => {
  const clean = redactPatterns(text.trim());
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};

/** What the run's comment says, or null when it says nothing. */
export function reportText(
  run: Pick<Run, 'status' | 'summary' | 'failureReason' | 'failureDetail'>,
): string | null {
  if (run.status === 'completed') {
    const output = run.summary?.trim() ?? '';
    return output && !TRIVIAL.test(output)
      ? bounded(output, REPORT_OUTPUT_MAX)
      : null;
  }
  if (
    run.status === 'cancelled' &&
    run.failureReason === 'delegatedQueueTimeout'
  )
    return bounded(
      run.failureDetail ??
        'The unclaimed delegation was withdrawn after its queue timeout.',
      REPORT_OUTPUT_MAX,
    )
      .replace(/\[@([^\]]+)\]\(mention:\/\/[^)]*\)/giu, '$1')
      .replace(/mention:\/\//giu, 'reference: ')
      .replace(/@/gu, '＠');
  if (run.status !== 'failed') return null;
  const detail = run.failureDetail?.trim();
  return `The run failed (${run.failureReason ?? 'unknown'})${detail ? `: ${bounded(detail, REPORT_DETAIL_MAX)}` : '.'}`;
}

/** Reports each ended run an agent's comment started; returns what stops it. */
export function reportCommentRuns(
  agents: Pick<Agents, 'events' | 'runs'>,
  projects: () => Pick<Projects, 'tx' | 'comments' | 'commentQueries'>,
  onError: (error: unknown) => void,
  authorize?: (conn: DatabaseConnection, run: Run) => Promise<void>,
): () => void {
  let running = false;
  let stopped = false;
  const drain = async () => {
    if (running || stopped) return;
    running = true;
    try {
      await drainRunReports(agents, projects(), new Date(), authorize);
    } catch (error) {
      onError(error);
    } finally {
      running = false;
    }
  };
  const release = agents.events.on('run.changed', (event) => {
    if (['completed', 'failed', 'cancelled'].includes(event.status))
      void drain();
  });
  const timer = setInterval(() => void drain(), 30_000);
  timer.unref();
  void drain();
  return () => {
    stopped = true;
    clearInterval(timer);
    release();
  };
}

export async function reportRun(
  agents: Pick<Agents, 'runs'>,
  projects: Pick<Projects, 'tx' | 'comments' | 'commentQueries'>,
  runId: string,
  outer?: ProjectsTx,
  saved?: ReportPayload,
): Promise<boolean> {
  const detail = saved ?? (await agents.runs.detail(runId));
  const { inputs, ...run } = detail;
  if (run.subject.kind !== ISSUE_SUBJECT) return false;
  const started = inputs
    .map((input) => jsonObject(input.payload))
    .find(
      (payload) =>
        payload.byAgent === true ||
        (run.failureReason === 'delegatedQueueTimeout' &&
          typeof jsonObject(payload.managerDelegation).commentId === 'string'),
    );
  if (!started) return false;
  const content = reportText(run);
  if (!content) return false;
  const issueId = run.subject.id;
  return projects.tx.run(async (tx) => {
    const since = run.startedAt ?? run.createdAt;
    if (run.status === 'completed') {
      const own = (
        await projects.commentQueries.list(tx.conn, issueId, { since })
      ).some(
        (comment) =>
          comment.authorType === AGENT_KIND &&
          comment.authorId === run.agentId &&
          !comment.deleted,
      );
      if (own) return false;
    }
    const id = guardIdOf(issueId, `${REPORT_GUARD}:${run.id}`);
    if (await commentGuards(tx.conn).findOne({ filter: { id } })) return false;
    // A second delivery of the same end waits on this row and then fails, posting nothing.
    await commentGuards(tx.conn).createOne({
      values: {
        id,
        issueId,
        statusKey: REPORT_GUARD,
        resetAt: null,
        pendingToken: null,
        agentId: run.agentId,
        fromStatus: null,
        ruleConfig: null,
      },
    });
    const parentId =
      typeof started.commentId === 'string' ? started.commentId : null;
    const parent = parentId
      ? await tx.conn
          .repository<{ id: string; issueId: string; deletedAt: unknown }>(
            'pmComments',
          )
          .findOne({ filter: { id: parentId, issueId } })
      : null;
    await projects.comments.post(
      { type: AGENT_KIND, id: run.agentId },
      issueId,
      {
        content:
          parentId && (!parent || parent.deletedAt)
            ? `${content}\n\nOriginal dispatch comment ${parentId} is no longer available; reporting at the issue root.`
            : content,
        ...(parent && !parent.deletedAt ? { parentId: parent.id } : {}),
      },
      {
        outer: tx,
        origin: { runId: run.id, report: run.status },
        forUserId: run.actorUserId,
      },
    );
    return true;
  }, outer);
}

interface ReportPayload extends Run {
  readonly inputs: readonly { readonly payload: unknown }[];
}
interface PendingReport {
  readonly id: string;
  readonly status: string;
  readonly payload: unknown;
  readonly attempts: number;
  readonly nextAt: string;
  readonly updatedAt: string;
  readonly lastError: string | null;
}
const reports = (conn: DatabaseConnection) =>
  conn.repository<PendingReport>('studioRunReports');

/** Registers only this transaction's newly ended report; historical runs are never scanned for reports. */
export async function stageRunReport(
  conn: DatabaseConnection,
  run: Run,
): Promise<void> {
  if (run.subject.kind !== ISSUE_SUBJECT || !reportText(run)) return;
  let input =
    (await managerDispatchInput(conn, run.id)) ??
    (await firstDispatch(conn, run.id));
  if (
    run.failureReason !== 'delegatedQueueTimeout' &&
    input &&
    jsonObject(input.payload).byAgent !== true
  ) {
    const inputs = await conn
      .repository<import('./delegated-queue.js').DispatchInput>('agRunInputs')
      .findMany({
        filter: { runId: run.id },
        sort: (s) => [s.field('createdAt').asc(), s.field('id').asc()],
      });
    input =
      inputs.find((item) => jsonObject(item.payload).byAgent === true) ?? null;
  }
  if (
    !input ||
    (run.failureReason !== 'delegatedQueueTimeout' &&
      jsonObject(input.payload).byAgent !== true)
  )
    return;
  const now = new Date().toISOString();
  await reports(conn).createOne({
    values: {
      id: run.id,
      status: 'pending',
      payload: { ...run, inputs: [{ payload: input.payload }] },
      attempts: 0,
      nextAt: now,
      updatedAt: now,
      lastError: null,
    },
  });
}

/** Locks each pending delivery; comment, duplicate guard, retained input and completion mark commit together. */
export async function drainRunReports(
  agents: Pick<Agents, 'runs'>,
  projects: Pick<Projects, 'tx' | 'comments' | 'commentQueries'>,
  now: Date = new Date(),
  authorize?: (conn: DatabaseConnection, run: Run) => Promise<void>,
): Promise<void> {
  const pending = await reports(projects.tx.read()).findMany({
    filter: (f) =>
      f.and([f.string('status').eq('pending'), f.date('nextAt').notAfter(now)]),
    sort: (s) => [s.field('nextAt').asc(), s.field('id').asc()],
    limit: 100,
  });
  for (const candidate of pending) {
    try {
      if (authorize)
        await authorize(
          projects.tx.read(),
          jsonObject(candidate.payload) as unknown as ReportPayload,
        );
      await projects.tx.run(async (tx: ProjectsTx) => {
        const locked = await reports(tx.conn).updateMany({
          filter: { id: candidate.id, status: 'pending' },
          values: { updatedAt: now.toISOString() },
        });
        if (locked.updatedCount !== 1) return;
        const row = await reports(tx.conn).findOne({
          filter: { id: candidate.id },
        });
        if (!row || new Date(row.nextAt).getTime() > now.getTime()) return;
        await reportRun(
          agents,
          projects,
          row.id,
          tx,
          jsonObject(row.payload) as unknown as ReportPayload,
        );
        await reports(tx.conn).updateMany({
          filter: { id: row.id, status: 'pending' },
          values: {
            status: 'done',
            lastError: null,
            updatedAt: now.toISOString(),
          },
        });
      });
    } catch (error) {
      await projects.tx.run(async (tx) => {
        // A competing delivery may already have committed; never overwrite its completed marker.
        const row = await reports(tx.conn).findOne({
          filter: { id: candidate.id, status: 'pending' },
        });
        if (!row) return;
        const attempts = Number(row.attempts) + 1;
        await reports(tx.conn).updateMany({
          filter: { id: row.id, status: 'pending' },
          values: {
            attempts,
            nextAt: new Date(
              now.getTime() +
                Math.min(3600, 30 * 2 ** Math.min(attempts - 1, 7)) * 1000,
            ).toISOString(),
            lastError: bounded(
              error instanceof Error ? error.message : String(error),
              REPORT_DETAIL_MAX,
            ),
            updatedAt: now.toISOString(),
          },
        });
      });
    }
  }
}
