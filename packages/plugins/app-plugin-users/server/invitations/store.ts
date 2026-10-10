/** The `userInvitations` table; only this file reads or writes it. */
import type { DatabaseConnection, Repository } from '@nocobase/db';

import type { UserRoleValue } from '../tokens.js';

export interface InvitationRecord {
  readonly id: string;
  readonly email: string;
  readonly tokenHash: string;
  readonly roleScopes: Readonly<Record<string, UserRoleValue>>;
  readonly data: Readonly<Record<string, unknown>>;
  readonly summary: readonly string[];
  readonly status: 'pending' | 'accepted' | 'revoked';
  readonly invitedById: string;
  readonly expiresAt: string;
  readonly sentAt: string | null;
  readonly manualDelivery: boolean;
  readonly verificationSentAt: string | null;
  readonly sendError: string | null;
  readonly acceptedUserId: string | null;
  readonly acceptedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const invitations = (connection: DatabaseConnection) =>
  connection.repository<InvitationRecord>('userInvitations');

export function findInvitation(
  connection: DatabaseConnection,
  filter: { readonly id: string } | { readonly tokenHash: string },
): Promise<InvitationRecord | undefined> {
  return invitations(connection).findOne({ filter });
}

/** Pending invitations, newest first: all of them, one inviter's, or one address's. */
export async function listPending(
  connection: DatabaseConnection,
  by: { readonly invitedById?: string; readonly email?: string } = {},
): Promise<InvitationRecord[]> {
  return await invitations(connection).findMany({
    filter: { status: 'pending', ...by },
    sort: (sort) => [sort.field('createdAt').desc(), sort.field('id').desc()],
  });
}

export async function insertInvitation(
  connection: DatabaseConnection,
  values: InvitationRecord,
): Promise<void> {
  await invitations(connection).createOne({ values });
}

export async function updateInvitation(
  connection: DatabaseConnection,
  id: string,
  values: Partial<Omit<InvitationRecord, 'id' | 'createdAt'>>,
): Promise<void> {
  await invitations(connection).updateOne({
    filter: { id },
    values: { ...values, updatedAt: new Date().toISOString() },
  });
}

/** Atomically reserves one verification email per minute for the current token. */
export async function claimVerificationSend(
  connection: DatabaseConnection,
  row: InvitationRecord,
  now: Date,
): Promise<boolean> {
  const { updatedCount } = await invitations(connection).updateMany({
    filter: (f) =>
      f.and([
        f.string('id').eq(row.id),
        f.string('status').eq('pending'),
        f.string('tokenHash').eq(row.tokenHash),
        f.or([
          f.date('verificationSentAt').empty(),
          f
            .date('verificationSentAt')
            .notAfter(new Date(now.getTime() - 60_000)),
        ]),
      ]),
    values: {
      verificationSentAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  });
  return updatedCount > 0;
}

/** A delayed send must never overwrite the outcome of a rotated or closed invitation. */
export async function recordInvitationDelivery(
  connection: DatabaseConnection,
  row: InvitationRecord,
  error: string | null,
): Promise<void> {
  const now = new Date().toISOString();
  await invitations(connection).updateMany({
    filter: { id: row.id, status: 'pending', tokenHash: row.tokenHash },
    values: {
      sentAt: error ? null : now,
      sendError: error?.slice(0, 1000) ?? null,
      updatedAt: now,
    },
  });
}

/** Marks a pending invitation accepted; false when it no longer is pending. */
export async function claimInvitation(
  connection: DatabaseConnection,
  id: string,
  userId: string,
  tokenHash: string,
): Promise<boolean> {
  const now = new Date().toISOString();
  const { updatedCount } = await invitations(connection).updateMany({
    filter: { id, status: 'pending', tokenHash },
    values: {
      status: 'accepted',
      acceptedUserId: userId,
      acceptedAt: now,
      updatedAt: now,
    },
  });
  return updatedCount > 0;
}

/** Independent mailbox proofs: requesting another email must not invalidate one already delivered. */
export interface InvitationVerificationRecord {
  readonly id: string;
  readonly invitationId: string;
  readonly invitationTokenHash: string;
  readonly tokenHash: string;
  readonly expiresAt: string;
}

export function verifications(
  connection: DatabaseConnection,
): Repository<InvitationVerificationRecord> {
  return connection.repository<InvitationVerificationRecord>(
    'userInvitationVerifications',
  );
}
