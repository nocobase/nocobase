/** The authorization boundary of a comment's runs; decisions remain in agRunRequests. */
import type { DatabaseConnection } from '@nocobase/db';
import type { Tx } from '../../kernel/tx.js';
import { precondition } from '../../kernel/errors.js';
import type { SubjectRegistry } from './ports.js';
import { findRunRecord, inputsRepo, type RunRecord } from './run.store.js';
import { jsonObject } from '../../kernel/values.js';
import {
  runRequestsRepo,
  toRunRequest,
  type RunRequestRecord,
} from './run-requests.js';

/**
 * The root of a comment's run chain, read without locking: its subject, owner and execution mode never change once
 * written. Decisions and claims protect themselves with guarded updates on the rows they change instead.
 */
export async function findCommentRoot(
  conn: DatabaseConnection,
  rootId: string,
): Promise<RunRecord> {
  const root = await findRunRecord(conn, rootId);
  if (!root || root.commentRootRunId !== rootId)
    throw precondition(
      'RUN_REQUEST_SETTLED',
      'The comment run chain is no longer available.',
    );
  return root;
}

export async function currentCommentOwner(
  conn: DatabaseConnection,
  subjects: SubjectRegistry,
  root: RunRecord,
): Promise<boolean> {
  const binding = subjects.get(root.subjectKind);
  if (!binding?.responsibleUserId || !binding.commentOwnerKey) return false;
  return (
    (await binding.responsibleUserId(conn, root.subjectId)) ===
      root.ownerUserId &&
    (await binding.commentOwnerKey(conn, root.subjectId)) ===
      (root.commentOwnerKey ?? null)
  );
}

/** An agent's mapped execution identity alone never proves that the owner personally initiated a comment. */
export async function commentFromOwner(
  conn: DatabaseConnection,
  root: RunRecord,
  visited: Set<string> = new Set<string>(),
): Promise<boolean> {
  if (visited.has(root.id)) return false;
  visited.add(root.id);
  if (root.requestedByUserId !== root.ownerUserId) return false;
  const inputs = await inputsRepo(conn).findMany({
    filter: { runId: root.id },
    sort: (s) => [s.field('createdAt').asc(), s.field('id').asc()],
  });
  const input =
    inputs.find(
      (input) =>
        input.type === 'comment' &&
        jsonObject(input.payload).commentSourceSnapshot === true,
    ) ?? inputs.find((input) => input.type === 'comment');
  if (!input) return false;
  const payload = jsonObject(input.payload);
  if (payload.commentSourceSnapshot === true)
    return inputs.some(
      (candidate) =>
        candidate.type === 'retry' &&
        candidate.actorKind === 'user' &&
        candidate.actorId === root.ownerUserId &&
        jsonObject(candidate.payload).source === 'api',
    );
  if (
    input.actorKind === 'user' &&
    input.actorId === root.ownerUserId &&
    payload.byAgent !== true
  )
    return true;
  const cause =
    typeof payload.causedByRunId === 'string'
      ? await findRunRecord(conn, payload.causedByRunId)
      : null;
  if (
    !cause ||
    cause.subjectKind !== root.subjectKind ||
    cause.subjectId !== root.subjectId ||
    cause.ownerUserId !== root.ownerUserId ||
    (cause.requestedByUserId ?? cause.actorUserId) !== root.ownerUserId
  )
    return false;
  if (cause.commentRootRunId) {
    const origin = await findRunRecord(conn, cause.commentRootRunId);
    return Boolean(
      origin &&
      origin.id !== root.id &&
      (await commentFromOwner(conn, origin, visited)),
    );
  }
  const causeInputs = await inputsRepo(conn).findMany({
    filter: { runId: cause.id },
  });
  return causeInputs.some((input) => input.type === 'comment')
    ? commentFromOwner(conn, cause, visited)
    : true;
}

export type CommentDecision = 'confirmed' | 'rejected' | 'pending' | null;

/** One indexed read of the chain's personal runner requests; `confirmation` names who released the chain. */
export async function commentDecision(
  conn: DatabaseConnection,
  root: RunRecord,
): Promise<CommentDecision> {
  return (await commentConsent(conn, root)).decision;
}

export async function commentConsent(
  conn: DatabaseConnection,
  root: RunRecord,
): Promise<{
  readonly decision: CommentDecision;
  readonly confirmation: RunRequestRecord | null;
}> {
  const records = await runRequestsRepo(conn).findMany({
    filter: { commentRootRunId: root.id, purpose: 'personalRunner' },
    sort: (s) => [s.field('createdAt').desc(), s.field('id').desc()],
  });
  const confirmation = records.find((r) => r.status === 'confirmed') ?? null;
  if (
    records.some(
      (r) =>
        r.status === 'rejected' ||
        (r.status === 'withdrawn' && r.settledById === root.requestedByUserId),
    )
  )
    return { decision: 'rejected', confirmation };
  if (confirmation) return { decision: 'confirmed', confirmation };
  return {
    decision: records.some((r) => r.status === 'pending') ? 'pending' : null,
    confirmation: null,
  };
}

/** A team claim makes the pending request obsolete, without granting later personal claims. */
export async function withdrawCommentRequests(
  unit: Tx,
  rootId: string,
  now: string,
  runId: string,
): Promise<void> {
  for (const record of await runRequestsRepo(unit.conn).findMany({
    filter: {
      commentRootRunId: rootId,
      commentRunId: runId,
      purpose: 'personalRunner',
      status: 'pending',
    },
  })) {
    const changed = await runRequestsRepo(unit.conn).updateMany({
      filter: { id: record.id, status: 'pending' },
      values: { status: 'withdrawn', updatedAt: now },
    });
    if (changed.updatedCount === 1)
      unit.emit({
        type: 'runRequest.withdrawn',
        request: toRunRequest({
          ...record,
          status: 'withdrawn',
          updatedAt: now,
        }),
      });
  }
}
