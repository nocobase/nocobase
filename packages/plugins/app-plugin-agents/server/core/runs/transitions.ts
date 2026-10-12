/**
 * The moves every part of the runs domain shares: ending a run and sending it back to the queue. Each is a guarded
 * update (it changes the run only while it is still in the state the caller saw), so concurrent callers, such as a
 * runner reporting while the sweeper reclaims, cannot both win.
 */
import type { FailureReason, RunStatus } from '@nocobase/agent-protocol';

import { later, type Clock } from '../../kernel/clock.js';
import type { Tx } from '../../kernel/tx.js';
import type { SubjectRegistry } from './ports.js';
import {
  retryDelayMs,
  WORKSPACE_WAIT_LIMIT_MS,
  workspaceBusyDelayMs,
} from './policy.js';
import { endExecution } from './execution.js';
import {
  ACTIVE,
  findRunRecord,
  runsRepo,
  tokensRepo,
  toExecutions,
  toRun,
  type RunRecord,
} from './run.store.js';

export interface TransitionDeps {
  readonly clock: Clock;
  readonly subjects: SubjectRegistry;
}

export interface FinishOutcome {
  readonly status: 'completed' | 'failed' | 'cancelled';
  readonly reason?: FailureReason | null;
  readonly detail?: string;
  readonly summary?: string;
  readonly sessionId?: string;
  readonly cancelledById?: string;
}

/** Revokes every live token of the run. */
export async function revokeTokens(
  tx: Tx,
  runId: string,
  now: string,
): Promise<void> {
  await tokensRepo(tx.conn).updateMany({
    filter: (f) =>
      f.and([f.string('runId').eq(runId), f.date('revokedAt').empty()]),
    values: { revokedAt: now },
  });
}

/**
 * Ends `run` if it is still in `run.status` (and, when held, still held by the same runner). Returns the ended run,
 * or null when someone else moved it first.
 */
export async function finishRun(
  tx: Tx,
  deps: TransitionDeps,
  run: RunRecord,
  outcome: FinishOutcome,
): Promise<RunRecord | null> {
  const now = deps.clock.now().toISOString();
  const values: Record<string, unknown> = {
    status: outcome.status,
    finishedAt: now,
    leaseExpiresAt: null,
    availableAt: null,
    updatedAt: now,
  };
  if (outcome.reason !== undefined) values.failureReason = outcome.reason;
  if (outcome.detail !== undefined)
    values.failureDetail = outcome.detail.slice(0, 10_000);
  if (outcome.summary !== undefined) values.summary = outcome.summary;
  if (outcome.sessionId !== undefined) values.sessionId = outcome.sessionId;
  if (outcome.cancelledById !== undefined)
    values.cancelledById = outcome.cancelledById;
  const result = await runsRepo(tx.conn).updateMany({
    filter: (f) =>
      f.and([
        f.string('id').eq(run.id),
        f.string('status').eq(run.status),
        ...(run.status === 'queued'
          ? [
              f.number('attempt').eq(Number(run.attempt)),
              run.queueEnteredAt
                ? f.and([
                    f
                      .date('queueEnteredAt')
                      .notBefore(new Date(run.queueEnteredAt)),
                    f
                      .date('queueEnteredAt')
                      .notAfter(new Date(run.queueEnteredAt)),
                  ])
                : f.date('queueEnteredAt').empty(),
              run.availableAt
                ? f.and([
                    f.date('availableAt').notBefore(new Date(run.availableAt)),
                    f.date('availableAt').notAfter(new Date(run.availableAt)),
                  ])
                : f.date('availableAt').empty(),
            ]
          : []),
        run.runnerId === null
          ? f.string('runnerId').eq(null)
          : f.string('runnerId').eq(run.runnerId),
      ]),
    values,
  });
  if (result.updatedCount !== 1) return null;
  await endExecution(tx.conn, run, now, outcome.reason ?? null);
  await revokeTokens(tx, run.id, now);
  const ended = (await findRunRecord(tx.conn, run.id))!;
  tx.emit({ type: 'run.changed', runId: run.id, status: ended.status });
  await deps.subjects
    .get(ended.subjectKind)
    ?.sink?.onRunFinished?.(tx, toRun(ended));
  return ended;
}

interface WorkspaceWaits {
  /** Attempts that found the subject's working directory held by another live run, the current one included. */
  readonly total: number;
  /** Those among the latest attempts, without another failure between them. */
  readonly trailing: number;
  /** When the first of the trailing ones was dispatched. */
  readonly since: string | null;
}

/**
 * The run's attempts that only waited for its working directory (`workspaceBusy`). They are not counted against
 * `maxAttempts`: nothing was tried, another run was still working there. The current attempt is still open in the
 * history (its reason is written when it ends), so it counts as one when the run is now reporting `workspaceBusy`.
 */
function workspaceWaits(run: RunRecord, reporting: boolean): WorkspaceWaits {
  const executions = toExecutions(run.executionHistory);
  const current = executions.find(
    (item) => item.attempt === Number(run.attempt) && item.finishedAt === null,
  );
  const ended = executions.filter((item) => item !== current);
  let total = ended.filter(
    (item) => item.failureReason === 'workspaceBusy',
  ).length;
  let trailing = 0;
  let since: string | null = null;
  if (reporting) {
    total += 1;
    trailing = 1;
    since = current?.dispatchedAt ?? run.dispatchedAt ?? null;
    for (let i = ended.length - 1; i >= 0; i -= 1) {
      const item = ended[i];
      if (item.failureReason !== 'workspaceBusy') break;
      trailing += 1;
      since = item.dispatchedAt;
    }
  }
  return { total, trailing, since };
}

export interface RequeueOutcome {
  readonly status: RunStatus;
  /** When the next attempt may start; absent when the run ended instead. */
  readonly retryAt?: string;
  readonly run: RunRecord | null;
}

/**
 * Takes a held run back from its runner after a retryable failure: it goes back to the queue while attempts remain,
 * and fails with `reason` otherwise.
 */
export async function requeueRun(
  tx: Tx,
  deps: TransitionDeps,
  run: RunRecord,
  reason: FailureReason,
  detail?: string,
): Promise<RequeueOutcome> {
  const now = deps.clock.now();
  const waits = workspaceWaits(run, reason === 'workspaceBusy');
  const exhausted =
    reason === 'workspaceBusy'
      ? waits.since !== null &&
        now.getTime() - Date.parse(waits.since) >= WORKSPACE_WAIT_LIMIT_MS
      : Number(run.attempt) - waits.total >= Number(run.maxAttempts);
  if (exhausted) {
    const ended = await finishRun(tx, deps, run, {
      status: 'failed',
      reason,
      ...(detail === undefined ? {} : { detail }),
    });
    return { status: ended?.status ?? run.status, run: ended };
  }
  const nowText = now.toISOString();
  const delay =
    reason === 'workspaceBusy'
      ? workspaceBusyDelayMs(waits.trailing)
      : retryDelayMs(reason, Number(run.attempt) - waits.total);
  const availableAt = delay > 0 ? later(now, delay) : null;
  const result = await runsRepo(tx.conn).updateMany({
    filter: (f) =>
      f.and([
        f.string('id').eq(run.id),
        f.or(ACTIVE.map((status) => f.string('status').eq(status))),
        run.runnerId === null
          ? f.string('runnerId').eq(null)
          : f.string('runnerId').eq(run.runnerId),
      ]),
    values: {
      status: 'queued',
      queueEnteredAt: nowText,
      teamOnlyVariables: null,
      gitCredentialUrls: null,
      runnerId: null,
      attempt: Number(run.attempt) + 1,
      availableAt,
      leaseExpiresAt: null,
      dispatchedAt: null,
      startedAt: null,
      acceptsInput: false,
      claimFailures: 0,
      failureReason: reason,
      failureDetail: detail === undefined ? null : detail.slice(0, 10_000),
      updatedAt: nowText,
    },
  });
  if (result.updatedCount !== 1) return { status: run.status, run: null };
  await endExecution(tx.conn, run, nowText, reason);
  await revokeTokens(tx, run.id, nowText);
  tx.emit({ type: 'run.changed', runId: run.id, status: 'queued' });
  tx.emit({ type: 'run.requeued', runId: run.id, availableAt });
  return {
    status: 'queued',
    retryAt: availableAt ?? nowText,
    run: (await findRunRecord(tx.conn, run.id)) ?? null,
  };
}
