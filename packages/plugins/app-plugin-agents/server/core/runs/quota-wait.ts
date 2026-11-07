import type { FailRequest } from '@nocobase/agent-protocol';
import type { Tx } from '../../kernel/tx.js';
import type { TransitionDeps } from './transitions.js';
import { revokeTokens } from './transitions.js';
import { endExecution } from './execution.js';
import { findRunRecord, runsRepo, toRun, type RunRecord } from './run.store.js';

/** Suspend the same run; unknown reset times remain terminal until a person retries. */
export async function waitForQuota(
  tx: Tx,
  deps: TransitionDeps,
  run: RunRecord,
  request: FailRequest,
): Promise<RunRecord | null> {
  const now = deps.clock.now().toISOString();
  const windows =
    request.quota?.windows.filter((window) => window.exhausted) ?? [];
  const reset =
    windows.length && windows.every((window) => window.resetsAt !== null)
      ? windows
          .map((window) => window.resetsAt!)
          .sort()
          .at(-1)!
      : null;
  const availableAt =
    reset && Date.parse(reset) > Date.parse(now) ? reset : null;
  const status = availableAt ? 'queued' : 'failed';
  const result = await runsRepo(tx.conn).updateMany({
    filter: {
      id: run.id,
      status: run.status,
      attempt: run.attempt,
      runnerId: run.runnerId,
    },
    values: {
      status,
      runnerPinId: run.runnerPinId ?? run.runnerId,
      runnerId: null,
      requires: [...new Set([...toRun(run).requires, 'strictSession'])],
      sessionId: request.sessionId ?? run.sessionId,
      freshSession: false,
      availableAt,
      queueEnteredAt: now,
      attempt: Number(run.attempt) + (availableAt ? 1 : 0),
      finishedAt: availableAt ? null : now,
      leaseExpiresAt: null,
      dispatchedAt: null,
      startedAt: null,
      acceptsInput: false,
      failureReason: request.reason,
      failureDetail: request.detail?.slice(0, 10_000) ?? null,
      updatedAt: now,
    },
  });
  if (result.updatedCount !== 1) return null;
  await endExecution(
    tx.conn,
    run,
    now,
    request.reason,
    undefined,
    request.quota,
  );
  await revokeTokens(tx, run.id, now);
  const waiting = (await findRunRecord(tx.conn, run.id))!;
  await deps.subjects
    .get(run.subjectKind)
    ?.sink?.onQuotaWait?.(tx, toRun(waiting));
  tx.emit({ type: 'run.changed', quotaWait: true, runId: run.id, status });
  if (availableAt)
    tx.emit({ type: 'run.requeued', runId: run.id, availableAt });
  return waiting;
}
