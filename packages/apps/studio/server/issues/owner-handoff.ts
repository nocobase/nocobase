/** One current handoff per issue; this is not an execution authorization or a request history. */
import { randomUUID } from 'node:crypto';

import type { DatabaseConnection } from '@nocobase/db';

import { studioError } from '../http/errors.js';

export const OWNER_HANDOFFS = 'studioIssueOwnerHandoffs';

export interface OwnerHandoff {
  readonly issueId: string;
  readonly waiting: boolean;
  readonly ownerUserId: string;
  readonly previousOwnerUserId: string;
  readonly transferredByUserId: string;
  /** Correlates an inbox item with the current transfer, including a transfer back to the same owner. */
  readonly notificationKey: string;
  readonly transferredAt: string;
  readonly rejectedAt: string | null;
}

export async function readOwnerHandoff(
  conn: DatabaseConnection,
  issueId: string,
): Promise<OwnerHandoff | null> {
  return (
    (await conn.repository<OwnerHandoff>(OWNER_HANDOFFS).findOne({
      filter: { issueId },
    })) ?? null
  );
}

/** Write in the owner change's transaction, before any wake or synchronous cancellation callback. */
export async function recordOwnerHandoff(
  conn: DatabaseConnection,
  change: {
    readonly issueId: string;
    readonly ownerUserId: string;
    readonly previousOwnerUserId: string;
    readonly transferredByUserId: string;
    /** Null for a run or an automatic change, even when it acts for the target owner. */
    readonly authenticatedPersonUserId: string | null;
  },
): Promise<OwnerHandoff> {
  const handoff: OwnerHandoff = {
    issueId: change.issueId,
    ownerUserId: change.ownerUserId,
    previousOwnerUserId: change.previousOwnerUserId,
    transferredByUserId: change.transferredByUserId,
    waiting: change.authenticatedPersonUserId !== change.ownerUserId,
    notificationKey: randomUUID(),
    transferredAt: new Date().toISOString(),
    rejectedAt: null,
  };
  await conn.repository(OWNER_HANDOFFS).upsertOne({
    filter: { issueId: change.issueId },
    create: { ...handoff },
    update: { ...handoff },
  });
  return handoff;
}

/** A stale row never grants consent for a different current owner. */
export async function ownerHandoffWaiting(
  conn: DatabaseConnection,
  issue: { readonly id: string; readonly ownerUserId: string },
): Promise<boolean> {
  const handoff = await readOwnerHandoff(conn, issue.id);
  return (
    handoff !== null &&
    (handoff.waiting || handoff.ownerUserId !== issue.ownerUserId)
  );
}

/**
 * The caller has already checked issue access in this transaction. A route must pass the actual human identity,
 * never a run's mapped userId. Decisions, activities and manager wakes belong to the same caller transaction.
 */
export async function decideOwnerHandoff(
  conn: DatabaseConnection,
  input: {
    readonly issue: { readonly id: string; readonly ownerUserId: string };
    readonly authenticatedPersonUserId: string | null;
    readonly notificationKey: string;
    readonly decision: 'accept' | 'reject';
  },
): Promise<OwnerHandoff> {
  const { issue } = input;
  if (
    !input.authenticatedPersonUserId ||
    input.authenticatedPersonUserId !== issue.ownerUserId
  )
    throw studioError(
      'PERMISSION_DENIED',
      'ISSUE_OWNER_HANDOFF_REQUIRED',
      'Only the current issue owner may accept or reject this handoff in person.',
    );
  const current = await readOwnerHandoff(conn, issue.id);
  if (
    !current?.waiting ||
    current.rejectedAt !== null ||
    current.ownerUserId !== issue.ownerUserId ||
    current.notificationKey !== input.notificationKey
  )
    throw studioError(
      'ABORTED',
      'ISSUE_OWNER_HANDOFF_STALE',
      'This handoff is no longer awaiting a decision. Refresh the issue.',
    );
  const next: OwnerHandoff = {
    ...current,
    waiting: input.decision === 'reject',
    rejectedAt: input.decision === 'reject' ? new Date().toISOString() : null,
  };
  const updated = await conn.repository(OWNER_HANDOFFS).updateMany({
    filter: (f) =>
      f.and([
        f.string('issueId').eq(issue.id),
        f.string('ownerUserId').eq(issue.ownerUserId),
        f.string('notificationKey').eq(input.notificationKey),
        f.boolean('waiting').isTrue(),
        f.date('rejectedAt').empty(),
      ]),
    values: { waiting: next.waiting, rejectedAt: next.rejectedAt },
  });
  if (updated.updatedCount !== 1)
    throw studioError(
      'ABORTED',
      'ISSUE_OWNER_HANDOFF_STALE',
      'This handoff is no longer awaiting a decision. Refresh the issue.',
    );
  return next;
}

/** Rejection informs both people, once each, without resuming any work. */
export function ownerHandoffRejectionRecipients(
  handoff: OwnerHandoff,
): string[] {
  return [
    ...new Set([handoff.previousOwnerUserId, handoff.transferredByUserId]),
  ];
}
