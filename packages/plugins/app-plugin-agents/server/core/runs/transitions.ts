/**
 * The moves every part of the runs domain shares: ending a run and sending it back to the queue. Each is a guarded
 * update (it changes the run only while it is still in the state the caller saw), so concurrent callers, such as a
 * runner reporting while the sweeper reclaims, cannot both win.
 */
import type { FailureReason, RunStatus } from '@nocobase/agent-protocol';

import { later, type Clock } from '../../kernel/clock.js';
import type { Tx } from '../../kernel/tx.js';
import type { SubjectRegistry } from './ports.js';
import { retryDelayMs } from './policy.js';
import {
  ACTIVE,
  findRunRecord,
  runsRepo,
  tokensRepo,
  toRun,
  type RunRecord,
} from './run.store.js';

export interface TransitionDeps {
  readonly clock: Clock;
  readonly subjects: SubjectRegistry;
}

export interface FinishOutcome {
  readonly status: 'completed' | 'failed' | 'cancelled';
  readonly reason?: FailureReason;
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
        run.runnerId === null
          ? f.string('runnerId').eq(null)
          : f.string('runnerId').eq(run.runnerId),
      ]),
    values,
  });
  if (result.updatedCount !== 1) return null;
  await revokeTokens(tx, run.id, now);
  const ended = (await findRunRecord(tx.conn, run.id))!;
  tx.emit({ type: 'run.changed', runId: run.id, status: ended.status });
  await deps.subjects
    .get(ended.subjectKind)
    ?.sink?.onRunFinished?.(tx, toRun(ended));
  return ended;
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
  if (Number(run.attempt) >= Number(run.maxAttempts)) {
    const ended = await finishRun(tx, deps, run, {
      status: 'failed',
      reason,
      ...(detail === undefined ? {} : { detail }),
    });
    return { status: ended?.status ?? run.status, run: ended };
  }
  const now = deps.clock.now();
  const nowText = now.toISOString();
  const delay = retryDelayMs(reason, Number(run.attempt));
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
      teamOnlyVariables: null,
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
  await revokeTokens(tx, run.id, nowText);
  tx.emit({ type: 'run.changed', runId: run.id, status: 'queued' });
  tx.emit({ type: 'run.requeued', runId: run.id, availableAt });
  return {
    status: 'queued',
    retryAt: availableAt ?? nowText,
    run: (await findRunRecord(tx.conn, run.id)) ?? null,
  };
}
