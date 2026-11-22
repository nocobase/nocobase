import { randomUUID } from 'node:crypto';

import type { DatabaseManager, Row } from '@nocobase/db';

/** A person's choice for one channel type of one notification kind. A kind they never changed has no row. */
export interface NotificationPreferenceRecord {
  readonly userId: string;
  readonly kind: string;
  readonly channelType: string;
  readonly enabled: boolean;
}

export interface NotificationPreferenceStore {
  /** Every choice `userId` made. */
  listForUser(userId: string): Promise<readonly NotificationPreferenceRecord[]>;
  /** The choices `userIds` made for `kind`, in one query. */
  listForKind(
    kind: string,
    userIds: readonly string[],
  ): Promise<readonly NotificationPreferenceRecord[]>;
  /** Records `userId`'s choices, replacing earlier ones for the same kind and channel type. */
  save(
    userId: string,
    items: readonly Omit<NotificationPreferenceRecord, 'userId'>[],
  ): Promise<void>;
}

interface PreferenceRow extends Row {
  id: string;
  userId: string;
  kind: string;
  channelType: string;
  enabled: boolean | number;
  createdAt: string;
  updatedAt: string;
}

/** The query `IN` list stays well below every dialect's parameter limit. */
const USER_BATCH_SIZE = 500;

export class DatabaseNotificationPreferenceStore implements NotificationPreferenceStore {
  constructor(private readonly database: DatabaseManager) {}

  async listForUser(
    userId: string,
  ): Promise<readonly NotificationPreferenceRecord[]> {
    const rows = await this.database
      .query()
      .selectFrom<PreferenceRow>('notificationPreferences')
      .selectAll()
      .where('userId', '=', userId)
      .execute<PreferenceRow>();
    return rows.map(fromRow);
  }

  async listForKind(
    kind: string,
    userIds: readonly string[],
  ): Promise<readonly NotificationPreferenceRecord[]> {
    const records: NotificationPreferenceRecord[] = [];
    for (let index = 0; index < userIds.length; index += USER_BATCH_SIZE) {
      const rows = await this.database
        .query()
        .selectFrom<PreferenceRow>('notificationPreferences')
        .selectAll()
        .where('kind', '=', kind)
        .where('userId', 'in', userIds.slice(index, index + USER_BATCH_SIZE))
        .execute<PreferenceRow>();
      records.push(...rows.map(fromRow));
    }
    return records;
  }

  async save(
    userId: string,
    items: readonly Omit<NotificationPreferenceRecord, 'userId'>[],
  ): Promise<void> {
    if (!items.length) return;
    const now = new Date().toISOString();
    await this.database.transaction(async (connection): Promise<void> => {
      for (const item of items) {
        const updated = await connection.query
          .updateTable<PreferenceRow>('notificationPreferences')
          .set({ enabled: item.enabled, updatedAt: now })
          .where('userId', '=', userId)
          .where('kind', '=', item.kind)
          .where('channelType', '=', item.channelType)
          .execute();
        if ((updated.updatedCount ?? 0) > 0) continue;
        await connection.query
          .insertInto<PreferenceRow>('notificationPreferences')
          .values({
            id: randomUUID(),
            userId,
            kind: item.kind,
            channelType: item.channelType,
            enabled: item.enabled,
            createdAt: now,
            updatedAt: now,
          })
          .execute();
      }
    });
  }
}

function fromRow(row: PreferenceRow): NotificationPreferenceRecord {
  return {
    userId: row.userId,
    kind: row.kind,
    channelType: row.channelType,
    enabled: row.enabled === true || row.enabled === 1,
  };
}
