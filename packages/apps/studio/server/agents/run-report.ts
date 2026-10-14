/** Terminal report outbox: manager delegations combine any automatic reply with one durable step-ended input. */
import { redactPatterns } from '@nocobase/agent-protocol';
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type { Run } from '@nocobase/app-plugin-agents/shared/runs';
import type { DatabaseConnection } from '@nocobase/db';
import type { ProjectsTx } from '@nocobase/app-plugin-projects/server/tokens';
import {
  firstDispatch,
  managerDispatchInput,
  managerDelegation,
} from './delegated-queue.js';
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';

import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import type { AgentWork } from './work.js';
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
  authorize?: (conn: DatabaseConnection, run: Run) => Promise<string | void>,
  work?: AgentWork,
): () => void {
  let running = false;
  let stopped = false;
  let requested = false;
  const drain = async () => {
    if (stopped) return;
    requested = true;
    if (running) return;
    running = true;
    try {
      do {
        requested = false;
        await drainRunReports(agents, projects(), new Date(), authorize, work);
      } while (requested && !stopped);
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
  const detail = saved ?? {
    ...(await agents.runs.detail(runId)),
    stepEnded: Boolean(
      await managerDelegation(projects.tx.read(), await agents.runs.get(runId)),
    ),
  };
  const { inputs, ...run } = detail;
  if (
    run.subject.kind !== ISSUE_SUBJECT ||
    !['completed', 'failed', 'cancelled'].includes(run.status)
  )
    return false;
  const started = inputs
    .map((input) => jsonObject(input.payload))
    .find(
      (payload) =>
        payload.byAgent === true ||
        (run.failureReason === 'delegatedQueueTimeout' &&
          typeof jsonObject(payload.managerDelegation).commentId === 'string'),
    );
  if (!started) return false;
  const content =
    reportText(run) ??
    (detail.stepEnded
      ? `The step ended: ${run.status} (run ${run.id}).`
      : null);
  if (!content) return false;
  const issueId = run.subject.id;
  return projects.tx.run(async (tx) => {
    const since = run.startedAt ?? run.createdAt;
    if (detail.stepEnded) {
      // Read stored provenance, not the viewer-filtered display source or a timestamp match with another run.
      const own = await tx.conn
        .repository<{
          issueId: string;
          authorId: string;
          authorType: string;
          origin: unknown;
          deletedAt: string | null;
        }>('pmComments')
        .findMany({
          filter: (f) =>
            f.and([
              f.string('issueId').eq(issueId),
              f.string('authorId').eq(run.agentId),
              f.string('authorType').eq(AGENT_KIND),
              f.date('deletedAt').empty(),
            ]),
        });
      if (
        own.some(
          (comment) =>
            jsonObject(jsonObject(comment.origin).trace).runId === run.id ||
            jsonObject(comment.origin).runId === run.id,
        )
      )
        return false;
    } else if (run.status === 'completed') {
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
        ...(detail.stepEnded ? { trigger: false } : {}),
        origin: { runId: run.id, report: run.status },
        forUserId: run.actorUserId,
      },
    );
    return true;
  }, outer);
}

interface ReportPayload extends Run {
  readonly inputs: readonly { readonly payload: unknown }[];
  readonly stepEnded?: boolean;
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
  if (
    run.subject.kind !== ISSUE_SUBJECT ||
    !['completed', 'failed', 'cancelled'].includes(run.status)
  )
    return;
  const step = await managerDelegation(conn, run);
  if (!step && !reportText(run)) return;
  let input =
    (await managerDispatchInput(conn, run.id)) ??
    (await firstDispatch(conn, run.id));
  if (
    !step &&
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
    (!step &&
      run.failureReason !== 'delegatedQueueTimeout' &&
      jsonObject(input.payload).byAgent !== true)
  )
    return;
  const now = new Date().toISOString();
  await reports(conn).upsertOne({
    filter: { id: run.id },
    update: { id: run.id },
    create: {
      id: run.id,
      status: 'pending',
      payload: {
        ...run,
        stepEnded: Boolean(step),
        eventKey: `step-ended:${run.id}`,
        inputs: [
          {
            payload: {
              ...jsonObject(input.payload),
              ...(step ? { byAgent: true, commentId: step.commentId } : {}),
            },
          },
        ],
      },
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
  authorize?: (conn: DatabaseConnection, run: Run) => Promise<string | void>,
  work?: AgentWork,
): Promise<void> {
  const pending = await reports(projects.tx.read()).findMany({
    filter: (f) =>
      f.and([f.string('status').eq('pending'), f.date('nextAt').notAfter(now)]),
    sort: (s) => [s.field('nextAt').asc(), s.field('id').asc()],
    limit: 100,
  });
  for (const candidate of pending) {
    try {
      const authorizedOwner = authorize
        ? await authorize(
            projects.tx.read(),
            jsonObject(candidate.payload) as unknown as ReportPayload,
          )
        : undefined;
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
        const payload = jsonObject(row.payload) as unknown as ReportPayload;
        // All step notifications for an issue serialize on its business row before rechecking current ownership.
        if (payload.stepEnded)
          await tx.conn.query
            .updateTable('pmIssues')
            .set({ id: payload.subject.id })
            .where('id', '=', payload.subject.id)
            .execute();
        await reportRun(
          agents,
          projects,
          row.id,
          tx,
          jsonObject(row.payload) as unknown as ReportPayload,
        );
        let delivery: Record<string, unknown> = { outcome: 'reportOnly' };
        if (payload.stepEnded && !work)
          throw new Error(
            'Step notification delivery requires the manager work handler.',
          );
        if (payload.stepEnded && work) {
          const issue = await tx.conn
            .repository<
              import('@nocobase/app-plugin-projects/shared/issues').Issue & {
                executorType: string;
                executorId: string;
                deletedAt: unknown;
              }
            >('pmIssues')
            .findOne({ filter: { id: payload.subject.id } });
          if (
            typeof authorizedOwner === 'string' &&
            issue &&
            issue.ownerUserId !== authorizedOwner
          )
            throw new Error(
              'The issue owner changed during notification authorization; retrying.',
            );
          const already = await tx.conn
            .repository<{ id: string }>('agRuns')
            .findOne({
              filter: (f) =>
                f.and([
                  f.string('subjectKind').eq(ISSUE_SUBJECT),
                  f.string('subjectId').eq(payload.subject.id),
                  f.string('agentId').eq(PROJECT_MANAGER_ID),
                  f.string('status').eq('completed'),
                  f.date('startedAt').notBefore(new Date(payload.finishedAt!)),
                ]),
            });
          delivery = already
            ? {
                outcome: 'skipped',
                reason: 'managerAlreadyCompleted',
                managerRunId: already.id,
              }
            : { outcome: 'skipped', reason: 'issueUnavailable' };
          if (issue && !issue.deletedAt && !already) {
            const agent = await tx.conn
              .repository<{ id: string; name: string }>('agAgents')
              .findOne({ filter: { id: payload.agentId } });
            const attempt = await work.managerSignal(
              tx,
              {
                ...issue,
                executor: { type: issue.executorType, id: issue.executorId },
              },
              'stepEnded',
              `${agent?.name ?? payload.agentId}'s step ended: ${payload.status} (run ${payload.id}). Read the dispatch thread and current runs before handing work on.`,
              {
                runId: payload.id,
                status: payload.status,
                eventKey: `step-ended:${payload.id}`,
              },
            );
            delivery = {
              outcome: attempt.started ? 'delivered' : 'skipped',
              managerRunId: attempt.runId ?? null,
              reason: attempt.skipped ?? null,
            };
            if (
              !attempt.started &&
              ['unavailable', 'waitingOwner', 'denied', 'blocked'].includes(
                attempt.skipped ?? '',
              )
            )
              throw new Error(`Step notification deferred: ${attempt.skipped}`);
          }
        }
        await reports(tx.conn).updateMany({
          filter: { id: row.id, status: 'pending' },
          values: {
            status: delivery.reason === 'limited' ? 'pending' : 'done',
            nextAt: new Date(now.getTime() + 60_000).toISOString(),
            payload: { ...payload, delivery },
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
