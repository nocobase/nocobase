/** Subject-selected identities, refreshed before a queued run can borrow a runner or credentials. */
import type { DatabaseConnection } from '@nocobase/db';
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

type IdentityPlan =
  | { readonly kind: 'keep' }
  | { readonly kind: 'cancel'; readonly detail: string }
  | { readonly kind: 'update'; readonly actorUserId: string };

/** What refreshing would do, read without writing, so a claim poll opens no transaction for current work. */
async function planQueuedIdentity(
  conn: DatabaseConnection,
  deps: TransitionDeps,
  run: RunRecord,
): Promise<IdentityPlan> {
  if (run.commentRootRunId && run.status === 'queued') {
    const root = await findRunRecord(conn, run.commentRootRunId);
    if (!root || !(await currentCommentOwner(conn, deps.subjects, root)))
      return {
        kind: 'cancel',
        detail: 'The comment belongs to an earlier owner assignment.',
      };
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
    return { kind: 'keep' };
  const inputs = await inputsRepo(conn).findMany({
    filter: { runId: run.id },
  });
  const identity = await resolve(conn, {
    subjectId: run.subjectId,
    agentId: run.agentId,
    causedByRunId: run.retryOfRunId ?? undefined,
    commentExecution: run.commentExecution,
    actorUserId: run.actorUserId,
    inputs: inputs.map(toInput),
  });
  if (!identity) return { kind: 'keep' };
  if (!identity.actorUserId)
    return { kind: 'cancel', detail: identity.reason ?? 'noOwner' };
  if (run.commentExecution === 'requester') return { kind: 'keep' };
  if (
    run.actorUserId === identity.actorUserId &&
    run.ownerUserId === identity.actorUserId
  )
    return { kind: 'keep' };
  return { kind: 'update', actorUserId: identity.actorUserId };
}

/** Whether a queued run's identity is current; a claim refreshes it in a transaction only when it is not. */
export async function queuedIdentityCurrent(
  conn: DatabaseConnection,
  deps: TransitionDeps,
  run: RunRecord,
): Promise<boolean> {
  return (await planQueuedIdentity(conn, deps, run)).kind === 'keep';
}

export async function refreshQueuedIdentity(
  unit: Tx,
  deps: TransitionDeps,
  run: RunRecord,
): Promise<RunRecord | null> {
  const plan = await planQueuedIdentity(unit.conn, deps, run);
  if (plan.kind === 'keep') return run;
  if (plan.kind === 'cancel') {
    await finishRun(unit, deps, run, {
      status: 'cancelled',
      reason: null,
      detail: plan.detail,
    });
    return null;
  }
  const values = {
    actorUserId: plan.actorUserId,
    ownerUserId: plan.actorUserId,
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
