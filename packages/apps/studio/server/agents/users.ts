/**
 * Which accounts can no longer act, for the agents plugin's people directory: a runner whose owner's account is
 * disabled or deleted stops authenticating until it is enabled again.
 *
 * Thin stand-in: the authentication plugin's `UserAdministrationService` reads one user at a time, so this reads its
 * `user` collection directly, as the projects plugin's user directory does.
 */
import type { DatabaseConnection } from '@nocobase/db';

interface UserRow {
  readonly id: string;
  readonly disabledAt: string | null;
  readonly deletedAt: string | null;
}

/** Of `ids`, the accounts that are disabled or deleted; an id with no account is not known to be either. */
export async function inactiveUsers(
  conn: DatabaseConnection,
  ids: readonly string[],
): Promise<ReadonlySet<string>> {
  if (ids.length === 0) return new Set();
  const rows = await conn.repository<UserRow>('user').findMany({
    filter: (f) => f.or(ids.map((id) => f.string('id').eq(id))),
  });
  return new Set(
    rows
      .filter((row) => row.disabledAt || row.deletedAt)
      .map((row) => String(row.id)),
  );
}
