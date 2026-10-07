/** Tokens, input validation and the derived status of invitations. */
import { createHash, randomBytes } from 'node:crypto';

import { UserManagementError, type UserInvitationStatus } from '../tokens.js';
import type { InvitationRecord } from './store.js';

/** A link stays valid for seven days; sending it again starts a new period. */
export const INVITATION_TTL_MS: number = 7 * 24 * 60 * 60 * 1000;
export const MAX_INVITATION_EMAILS = 50;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

/** A new token (the link carries it) and the hash that is stored. */
export function mintToken(): { readonly token: string; readonly hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function invalid(message: string): UserManagementError {
  return new UserManagementError('INVALID_INVITATION', message);
}

/** Trimmed, lower-cased, de-duplicated addresses; every one must be valid. */
export function normalizeEmails(value: readonly unknown[]): string[] {
  if (value.length === 0) throw invalid('Enter at least one email address.');
  const emails = new Set<string>();
  for (const item of value) {
    const email = typeof item === 'string' ? item.trim().toLowerCase() : '';
    if (email.length > 255 || !EMAIL.test(email))
      throw invalid(`${String(item)} is not a valid email address.`);
    emails.add(email);
  }
  if (emails.size > MAX_INVITATION_EMAILS)
    throw invalid(`At most ${MAX_INVITATION_EMAILS} addresses at once.`);
  return [...emails];
}

export function statusOf(
  row: InvitationRecord,
  at: Date = new Date(),
): UserInvitationStatus {
  if (row.status !== 'pending') return row.status;
  return new Date(row.expiresAt).getTime() <= at.getTime()
    ? 'expired'
    : 'pending';
}

/** Only a pending, unexpired invitation can be opened or accepted. */
export function requireOpen(
  row: InvitationRecord | undefined,
): InvitationRecord {
  if (!row)
    throw new UserManagementError(
      'INVITATION_NOT_FOUND',
      'This invitation does not exist.',
      404,
    );
  const status = statusOf(row);
  if (status === 'pending') return row;
  throw new UserManagementError(
    status === 'expired'
      ? 'INVITATION_EXPIRED'
      : status === 'accepted'
        ? 'INVITATION_ACCEPTED'
        : 'INVITATION_REVOKED',
    `This invitation has been ${status}.`,
    409,
  );
}
