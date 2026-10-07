/**
 * Ending a job and sending it back to the queue. Each is a guarded update (it changes the job only while it is in the
 * state the caller saw, held by the same runner), so a runner reporting while the sweeper reclaims cannot both win.
 * The kind's `onDone` runs in the ending's transaction.
 */
import {
  isRetryableJobFailure,
  type JobFailureReason,
  type JobResult,
  type JobStatus,
} from '@nocobase/agent-protocol';

import { later, type Clock } from '../kernel/clock.js';
import type { Tx } from '../kernel/tx.js';
import { asJson } from '../kernel/values.js';
import {
  ACTIVE_JOB,
  findJobRecord,
  jobsRepo,
  toJob,
  type JobRecord,
} from './job.store.js';
import type { JobKindRegistry } from './registry.js';

export interface JobTransitionDeps {
  readonly clock: Clock;
  readonly kinds: JobKindRegistry;
}

export interface JobOutcome {
  readonly status: 'completed' | 'failed' | 'cancelled';
  readonly reason?: JobFailureReason;
  readonly detail?: string;
  readonly result?: JobResult;
  readonly exitCode?: number;
  readonly sha?: string;
  readonly cancelledById?: string;
}

/** How long a job waits before its next attempt after `reason`. */
export function jobRetryDelayMs(
  reason: JobFailureReason,
  attempt: number,
): number {
  if (reason === 'runnerOffline' || reason === 'leaseExpired') return 0;
  return Math.min(5 * 60_000, 15_000 * 2 ** Math.max(0, attempt - 1));
}

/** Ends `job` if it is still where the caller saw it. Returns the ended job, or null when someone moved it first. */
export async function finishJob(
  tx: Tx,
  deps: JobTransitionDeps,
  job: JobRecord,
  outcome: JobOutcome,
): Promise<JobRecord | null> {
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
  if (outcome.status === 'completed') {
    values.failureReason = null;
    values.failureDetail = null;
  }
  if (outcome.result !== undefined) values.result = asJson(outcome.result);
  if (outcome.exitCode !== undefined) values.exitCode = outcome.exitCode;
  if (outcome.sha !== undefined) values.sha = outcome.sha;
  if (outcome.cancelledById !== undefined)
    values.cancelledById = outcome.cancelledById;
  const result = await jobsRepo(tx.conn).updateMany({
    filter: (f) =>
      f.and([
        f.string('id').eq(job.id),
        f.string('status').eq(job.status),
        job.runnerId === null
          ? f.string('runnerId').eq(null)
          : f.string('runnerId').eq(job.runnerId),
      ]),
    values,
  });
  if (result.updatedCount !== 1) return null;
  const ended = (await findJobRecord(tx.conn, job.id))!;
  tx.emit({ type: 'job.changed', jobId: job.id, status: ended.status });
  await deps.kinds.get(ended.kind)?.onDone?.(tx, toJob(ended));
  return ended;
}

export interface JobRequeueOutcome {
  readonly status: JobStatus;
  readonly retryAt?: string;
  readonly job: JobRecord | null;
}

/**
 * Takes a held job back after a failure: back to the queue while the reason is retryable and attempts remain, and
 * failed with `reason` otherwise.
 */
export async function requeueJob(
  tx: Tx,
  deps: JobTransitionDeps,
  job: JobRecord,
  reason: JobFailureReason,
  detail?: string,
  facts: { readonly exitCode?: number; readonly sha?: string } = {},
): Promise<JobRequeueOutcome> {
  if (
    !isRetryableJobFailure(reason) ||
    job.cancelRequestedAt !== null ||
    Number(job.attempt) >= Number(job.maxAttempts)
  ) {
    const cancelled = job.cancelRequestedAt !== null;
    const ended = await finishJob(tx, deps, job, {
      status: cancelled ? 'cancelled' : 'failed',
      reason: cancelled ? 'cancelled' : reason,
      ...(detail === undefined ? {} : { detail }),
      ...facts,
    });
    return { status: ended?.status ?? job.status, job: ended };
  }
  const now = deps.clock.now();
  const nowText = now.toISOString();
  const delay = jobRetryDelayMs(reason, Number(job.attempt));
  const availableAt = delay > 0 ? later(now, delay) : null;
  const result = await jobsRepo(tx.conn).updateMany({
    filter: (f) =>
      f.and([
        f.string('id').eq(job.id),
        f.or(ACTIVE_JOB.map((status) => f.string('status').eq(status))),
        job.runnerId === null
          ? f.string('runnerId').eq(null)
          : f.string('runnerId').eq(job.runnerId),
      ]),
    values: {
      status: 'queued',
      runnerId: null,
      attempt: Number(job.attempt) + 1,
      availableAt,
      leaseExpiresAt: null,
      dispatchedAt: null,
      startedAt: null,
      claimFailures: 0,
      failureReason: reason,
      failureDetail: detail === undefined ? null : detail.slice(0, 10_000),
      updatedAt: nowText,
    },
  });
  if (result.updatedCount !== 1) return { status: job.status, job: null };
  tx.emit({ type: 'job.changed', jobId: job.id, status: 'queued' });
  tx.emit({ type: 'job.queued', jobId: job.id, availableAt });
  return {
    status: 'queued',
    retryAt: availableAt ?? nowText,
    job: await findJobRecord(tx.conn, job.id),
  };
}
