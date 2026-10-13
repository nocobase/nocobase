/** Subject-selected identities, refreshed before a queued run can borrow a runner or credentials. */
import type { Tx } from '../../kernel/tx.js';
import type { TransitionDeps } from './transitions.js';
import { currentCommentOwner } from './comment-consent.js';
import { finishRun } from './transitions.js';
import {
  inputsRepo,
  findRunRecord,
  runsRepo,
  toInput,
  toExecutions,
  type RunRecord,
} from './run.store.js';

export async function refreshQueuedIdentity(
  unit: Tx,
  deps: TransitionDeps,
  run: RunRecord,
): Promise<RunRecord | null> {
  if (run.commentRootRunId && run.status === 'queued') {
    const root = await findRunRecord(unit.conn, run.commentRootRunId);
    if (!root || !(await currentCommentOwner(unit.conn, deps.subjects, root))) {
      await finishRun(unit, deps, run, {
        status: 'cancelled',
        reason: null,
        detail: 'The comment belongs to an earlier owner assignment.',
      });
      return null;
    }
  }
  const resolve = deps.subjects.get(run.subjectKind)?.actsAs;
  // A run returned to the queue after a lease loss has already fixed its identity.
  if (
    !resolve ||
    run.status !== 'queued' ||
    run.dispatchedAt ||
    Number(run.attempt) > 1 ||
    toExecutions(run).length > 0
  )
    return run;
  const inputs = await inputsRepo(unit.conn).findMany({
    filter: { runId: run.id },
  });
  const identity = await resolve(unit.conn, {
    subjectId: run.subjectId,
    agentId: run.agentId,
    causedByRunId: run.retryOfRunId ?? undefined,
    commentExecution: run.commentExecution,
    actorUserId: run.actorUserId,
    inputs: inputs.map(toInput),
  });
  if (!identity) return run;
  if (!identity.actorUserId) {
    await finishRun(unit, deps, run, {
      status: 'cancelled',
      reason: null,
      detail: identity.reason ?? 'noOwner',
    });
    return null;
  }
  if (run.commentExecution === 'requester') return run;
  if (
    run.actorUserId === identity.actorUserId &&
    run.ownerUserId === identity.actorUserId
  )
    return run;
  const values = {
    actorUserId: identity.actorUserId,
    ownerUserId: identity.actorUserId,
    requestedByUserId: run.requestedByUserId ?? run.actorUserId,
    updatedAt: deps.clock.now().toISOString(),
  };
  const updated = await runsRepo(unit.conn).updateMany({
    filter: { id: run.id, status: 'queued', actorUserId: run.actorUserId },
    values,
  });
  if (updated.updatedCount !== 1) return null;
  unit.emit({ type: 'run.changed', runId: run.id, status: 'queued' });
  return { ...run, ...values };
}
