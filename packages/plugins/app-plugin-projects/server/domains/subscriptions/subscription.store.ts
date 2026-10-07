/**
 * `pmIssueSubscriptions`: who follows an issue and why. Unsubscribing is sticky: the row stays with
 * `unsubscribedAt`, and only becoming the owner or following by hand follows again.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { SubscriptionReason } from '../../../shared/subscriptions.js';
import { oneOf } from '../../kernel/db.js';

const SUBSCRIPTIONS = 'pmIssueSubscriptions';

export interface SubscriptionRecord {
  readonly id: string;
  readonly issueId: string;
  readonly userId: string;
  readonly reason: SubscriptionReason;
  readonly unsubscribedAt: Date | string | null;
  readonly createdAt: Date | string;
  readonly updatedAt: Date | string;
}

/** Reasons that follow an issue again after the person unsubscribed. */
const RESTORING: readonly SubscriptionReason[] = ['owner', 'manual'];

const rows = (conn: DatabaseConnection) =>
  conn.repository<SubscriptionRecord>(SUBSCRIPTIONS);

async function findRow(
  conn: DatabaseConnection,
  issueId: string,
  userId: string,
): Promise<SubscriptionRecord | undefined> {
  return (
    (await rows(conn).findOne({ filter: { issueId, userId } })) ?? undefined
  );
}

/** Follows the issue for `reason`; returns whether the person follows it now. An existing follow keeps its reason. */
export async function subscribe(
  conn: DatabaseConnection,
  nextId: () => string,
  issueId: string,
  userId: string,
  reason: SubscriptionReason,
): Promise<boolean> {
  const row = await findRow(conn, issueId, userId);
  const now = new Date();
  if (!row) {
    await rows(conn).createOne({
      values: {
        id: nextId(),
        issueId,
        userId,
        reason,
        unsubscribedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    });
    return true;
  }
  if (row.unsubscribedAt === null) return true;
  if (!RESTORING.includes(reason)) return false;
  await rows(conn).updateOne({
    filter: { id: row.id },
    values: { reason, unsubscribedAt: null, updatedAt: now },
  });
  return true;
}

export async function unsubscribe(
  conn: DatabaseConnection,
  nextId: () => string,
  issueId: string,
  userId: string,
): Promise<void> {
  const row = await findRow(conn, issueId, userId);
  const now = new Date();
  if (!row) {
    await rows(conn).createOne({
      values: {
        id: nextId(),
        issueId,
        userId,
        reason: 'manual',
        unsubscribedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });
    return;
  }
  if (row.unsubscribedAt !== null) return;
  await rows(conn).updateOne({
    filter: { id: row.id },
    values: { unsubscribedAt: now, updatedAt: now },
  });
}

/** The people following the issue, in the order they started. */
export async function activeSubscriptions(
  conn: DatabaseConnection,
  issueId: string,
): Promise<SubscriptionRecord[]> {
  return rows(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('issueId').eq(issueId),
        f.date('unsubscribedAt').empty(),
      ]),
    sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
  });
}

/** Of `issueIds`, those the person follows. */
export async function followedAmong(
  conn: DatabaseConnection,
  userId: string,
  issueIds: readonly string[],
): Promise<Set<string>> {
  if (issueIds.length === 0) return new Set();
  const found = await rows(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('userId').eq(userId),
        oneOf(f, 'issueId', [...issueIds]),
        f.date('unsubscribedAt').empty(),
      ]),
  });
  return new Set(found.map((row) => row.issueId));
}
