import type { DatabaseConnection } from '@nocobase/db';

export const MEMBERS = 'pmMembers';

interface MemberRecord {
  readonly id: string;
  readonly userId: string;
  readonly preferences: Readonly<Record<string, unknown>> | null;
  readonly joinedAt: Date | string;
  readonly createdAt: Date | string;
  readonly updatedAt: Date | string;
}

const members = (conn: DatabaseConnection) =>
  conn.repository<MemberRecord>(MEMBERS);

export function isMember(
  conn: DatabaseConnection,
  userId: string,
): Promise<boolean> {
  return members(conn).exists({ filter: { userId } });
}

export async function insertMember(
  conn: DatabaseConnection,
  id: string,
  userId: string,
): Promise<void> {
  const now = new Date();
  await members(conn).createOne({
    values: {
      id,
      userId,
      preferences: {},
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    },
  });
}
