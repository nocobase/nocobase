/**
 * `pmApprovalRequests`: status changes waiting for, or decided by, an approver.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { ApprovalStatus } from '../../../shared/approvals.js';
import type { ApproverRole } from '../../../shared/workflows.js';

export const APPROVAL_REQUESTS = 'pmApprovalRequests';

export interface ApprovalRecord {
  readonly id: string;
  readonly issueId: string;
  readonly fromStatus: string;
  readonly toStatus: string;
  /** A kind's key (`shared/kinds.ts`). */
  readonly requestedByType: string;
  readonly requestedById: string;
  readonly approvers: readonly ApproverRole[] | string;
  readonly approverUserIds: readonly string[] | string;
  readonly status: ApprovalStatus;
  readonly decidedById: string | null;
  readonly decidedAt: Date | string | null;
  readonly comment: string | null;
  readonly createdAt: Date | string;
  readonly updatedAt: Date | string;
}

const requests = (conn: DatabaseConnection) =>
  conn.repository<ApprovalRecord>(APPROVAL_REQUESTS);

export const listOf = <T>(value: readonly T[] | string): readonly T[] =>
  typeof value === 'string' ? (JSON.parse(value) as T[]) : value;

export function findRequest(
  conn: DatabaseConnection,
  id: string,
): Promise<ApprovalRecord | undefined> {
  return requests(conn).findOne({ filter: { id } });
}

/** The issue's pending requests, oldest first (there is at most one). */
export async function pendingOf(
  conn: DatabaseConnection,
  issueId: string,
): Promise<ApprovalRecord[]> {
  return await requests(conn).findMany({
    filter: { issueId, status: 'pending' },
    sort: (sort) => sort.field('createdAt').asc(),
  });
}

/** The pending requests on any of `issueIds`, oldest first. */
export async function pendingOfEach(
  conn: DatabaseConnection,
  issueIds: readonly string[],
): Promise<ApprovalRecord[]> {
  if (issueIds.length === 0) return [];
  return await requests(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('status').eq('pending'),
        f.or(issueIds.map((id) => f.string('issueId').eq(id))),
      ]),
    sort: (sort) => sort.field('createdAt').asc(),
  });
}

/** The issue's decided requests (any status but pending), the most recently decided first, up to `limit`. */
export async function decidedOf(
  conn: DatabaseConnection,
  issueId: string,
  limit: number,
): Promise<ApprovalRecord[]> {
  return await requests(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('issueId').eq(issueId),
        f.string('status').ne('pending'),
      ]),
    sort: (sort) => sort.field('updatedAt').desc(),
    limit,
  });
}

/** Every pending request, newest first, up to `limit`. */
export async function allPending(
  conn: DatabaseConnection,
  limit: number,
): Promise<ApprovalRecord[]> {
  return await requests(conn).findMany({
    filter: { status: 'pending' },
    sort: (sort) => sort.field('createdAt').desc(),
    limit,
  });
}

export async function insertRequest(
  conn: DatabaseConnection,
  row: Omit<ApprovalRecord, 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const now = new Date();
  await requests(conn).createOne({
    values: {
      ...row,
      approvers: [...listOf(row.approvers)],
      approverUserIds: [...listOf(row.approverUserIds)],
      createdAt: now,
      updatedAt: now,
    },
  });
}

/** Moves a pending request on; false when it was no longer pending. */
export async function decideRequest(
  conn: DatabaseConnection,
  id: string,
  values: {
    readonly status: Exclude<ApprovalStatus, 'pending'>;
    readonly decidedById: string | null;
    readonly comment?: string | null;
  },
): Promise<boolean> {
  const now = new Date();
  const result = await requests(conn).updateMany({
    filter: { id, status: 'pending' },
    values: { ...values, decidedAt: now, updatedAt: now },
  });
  return result.updatedCount > 0;
}
