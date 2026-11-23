import {
  validateNotificationTarget,
  type NotificationTarget,
} from '@nocobase/app-plugin-notification';
import { randomUUID } from 'node:crypto';
import type { DatabaseManager, Row } from '@nocobase/db';
import type { InAppCategoryCount, InAppItem, InAppMessage } from './types.js';

export interface InAppPageCursor {
  readonly createdAt: string;
  readonly id: string;
}

export interface InAppStore {
  deliver(input: {
    readonly deliveryId: string;
    readonly notificationId: string;
    readonly userId: string;
    readonly message: InAppMessage;
    readonly createdAt: string;
  }): Promise<InAppItem>;
  list(input: {
    readonly userId: string;
    readonly unreadOnly?: boolean;
    /** Only messages of this category key. */
    readonly category?: string;
    readonly limit?: number;
    readonly before?: InAppPageCursor;
  }): Promise<readonly InAppItem[]>;
  countUnread(userId: string): Promise<number>;
  /** Unread messages per category, in one query. */
  countUnreadByCategory(userId: string): Promise<readonly InAppCategoryCount[]>;
  update(input: {
    readonly id: string;
    readonly userId: string;
    readonly action: 'read' | 'unread' | 'delete';
  }): Promise<InAppItem | undefined>;
  markAllRead(userId: string): Promise<number>;
}

export class MemoryInAppStore implements InAppStore {
  private readonly items = new Map<string, InAppItem>();
  async deliver(input: {
    readonly deliveryId: string;
    readonly notificationId: string;
    readonly userId: string;
    readonly message: InAppMessage;
    readonly createdAt: string;
  }): Promise<InAppItem> {
    const existing = [...this.items.values()].find(
      (item) => item.deliveryId === input.deliveryId,
    );
    if (existing) return existing;
    const item: InAppItem = {
      id: randomUUID(),
      deliveryId: input.deliveryId,
      notificationId: input.notificationId,
      userId: input.userId,
      title: input.message.title,
      body: input.message.body,
      target: validateNotificationTarget(input.message.target),
      ...about(input.message),
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    };
    this.items.set(item.id, item);
    return item;
  }
  async list(input: {
    readonly userId: string;
    readonly unreadOnly?: boolean;
    readonly category?: string;
    readonly limit?: number;
    readonly before?: InAppPageCursor;
  }): Promise<readonly InAppItem[]> {
    return [...this.items.values()]
      .filter(
        (item) =>
          item.userId === input.userId &&
          (!input.unreadOnly || !item.readAt) &&
          (input.category === undefined || item.category === input.category) &&
          (!input.before || isBefore(item, input.before)),
      )
      .sort(compareItemsDescending)
      .slice(0, input.limit ?? 25);
  }
  async countUnread(userId: string): Promise<number> {
    return (
      await this.list({
        userId,
        unreadOnly: true,
        limit: Number.MAX_SAFE_INTEGER,
      })
    ).length;
  }
  async countUnreadByCategory(
    userId: string,
  ): Promise<readonly InAppCategoryCount[]> {
    const counts = new Map<string | undefined, number>();
    for (const item of this.items.values())
      if (item.userId === userId && !item.readAt)
        counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    return [...counts].map(([category, count]) =>
      category === undefined ? { count } : { category, count },
    );
  }
  async update(input: {
    readonly id: string;
    readonly userId: string;
    readonly action: 'read' | 'unread' | 'delete';
  }): Promise<InAppItem | undefined> {
    const item = this.items.get(input.id);
    if (!item || item.userId !== input.userId) return undefined;
    const next: InAppItem = {
      ...item,
      readAt:
        input.action === 'read'
          ? new Date().toISOString()
          : input.action === 'unread'
            ? undefined
            : item.readAt,
      updatedAt: new Date().toISOString(),
    };
    if (input.action === 'delete') this.items.delete(item.id);
    else this.items.set(item.id, next);
    return next;
  }
  async markAllRead(userId: string): Promise<number> {
    let count = 0;
    for (const item of this.items.values())
      if (item.userId === userId && !item.readAt) {
        this.items.set(item.id, {
          ...item,
          readAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        count++;
      }
    return count;
  }
}

interface ItemRow extends Row {
  id: string;
  deliveryId: string;
  notificationId: string;
  userId: string;
  title?: string;
  body: string;
  target?: NotificationTarget | null;
  kind?: string | null;
  category?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export class DatabaseInAppStore implements InAppStore {
  constructor(private readonly database: DatabaseManager) {}
  async deliver(input: {
    readonly deliveryId: string;
    readonly notificationId: string;
    readonly userId: string;
    readonly message: InAppMessage;
    readonly createdAt: string;
  }): Promise<InAppItem> {
    const item: InAppItem = {
      id: randomUUID(),
      deliveryId: input.deliveryId,
      notificationId: input.notificationId,
      userId: input.userId,
      title: input.message.title,
      body: input.message.body,
      target: validateNotificationTarget(input.message.target),
      ...about(input.message),
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    };
    try {
      await this.database
        .query()
        .insertInto<ItemRow>('notificationInAppItems')
        .values(toRow(item))
        .execute();
    } catch (error) {
      const existing = await this.database
        .query()
        .selectFrom<ItemRow>('notificationInAppItems')
        .selectAll()
        .where('deliveryId', '=', input.deliveryId)
        .executeTakeFirst<ItemRow>();
      if (existing) return fromRow(existing);
      throw error;
    }
    return item;
  }
  async list(input: {
    readonly userId: string;
    readonly unreadOnly?: boolean;
    readonly category?: string;
    readonly limit?: number;
    readonly before?: InAppPageCursor;
  }): Promise<readonly InAppItem[]> {
    let query = this.database
      .query()
      .selectFrom<ItemRow>('notificationInAppItems')
      .selectAll()
      .where('userId', '=', input.userId)
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'desc')
      .limit(input.limit ?? 25);
    if (input.unreadOnly) query = query.where('readAt', 'is', null);
    if (input.category !== undefined)
      query = query.where('category', '=', input.category);
    if (input.before)
      query = query.where((builder) =>
        builder.or([
          builder('createdAt', '<', input.before?.createdAt),
          builder.and([
            builder('createdAt', '=', input.before?.createdAt),
            builder('id', '<', input.before?.id),
          ]),
        ]),
      );
    return (await query.execute<ItemRow>()).map(fromRow);
  }
  async countUnread(userId: string): Promise<number> {
    const rows = await this.database
      .query()
      .selectFrom<ItemRow>('notificationInAppItems')
      .select(({ fn }) => [fn.countAll<number>().as('count')])
      .where('userId', '=', userId)
      .where('readAt', 'is', null)
      .executeTakeFirst<{ count: number | string }>();
    return Number(rows?.count ?? 0);
  }
  async countUnreadByCategory(
    userId: string,
  ): Promise<readonly InAppCategoryCount[]> {
    const rows = await this.database
      .query()
      .selectFrom<ItemRow>('notificationInAppItems')
      .select(({ fn }) => ['category', fn.countAll<number>().as('count')])
      .where('userId', '=', userId)
      .where('readAt', 'is', null)
      .groupBy('category')
      .execute<{ category: string | null; count: number | string }>();
    return rows.map(({ category, count }) =>
      category === null
        ? { count: Number(count) }
        : { category, count: Number(count) },
    );
  }
  async update(input: {
    readonly id: string;
    readonly userId: string;
    readonly action: 'read' | 'unread' | 'delete';
  }): Promise<InAppItem | undefined> {
    const now = new Date().toISOString();
    if (input.action === 'delete') {
      const current = await this.database
        .query()
        .selectFrom<ItemRow>('notificationInAppItems')
        .selectAll()
        .where('id', '=', input.id)
        .where('userId', '=', input.userId)
        .executeTakeFirst<ItemRow>();
      if (!current) return undefined;
      const result = await this.database
        .query()
        .deleteFrom('notificationInAppItems')
        .where('id', '=', input.id)
        .where('userId', '=', input.userId)
        .execute();
      return result.deletedCount === 1
        ? { ...fromRow(current), updatedAt: now }
        : undefined;
    }
    const set =
      input.action === 'read'
        ? { readAt: now, updatedAt: now }
        : { readAt: null, updatedAt: now };
    const result = await this.database
      .query()
      .updateTable<ItemRow>('notificationInAppItems')
      .set(set)
      .where('id', '=', input.id)
      .where('userId', '=', input.userId)
      .execute();
    if (result.updatedCount !== 1) return undefined;
    const row = await this.database
      .query()
      .selectFrom<ItemRow>('notificationInAppItems')
      .selectAll()
      .where('id', '=', input.id)
      .executeTakeFirst<ItemRow>();
    return row ? fromRow(row) : undefined;
  }
  async markAllRead(userId: string): Promise<number> {
    const result = await this.database
      .query()
      .updateTable<ItemRow>('notificationInAppItems')
      .set({
        readAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where('userId', '=', userId)
      .where('readAt', 'is', null)
      .execute();
    return result.updatedCount ?? 0;
  }
}

export function createInAppStore(database?: DatabaseManager): InAppStore {
  return database ? new DatabaseInAppStore(database) : new MemoryInAppStore();
}
function fromRow(row: ItemRow): InAppItem {
  return {
    id: row.id,
    deliveryId: row.deliveryId,
    notificationId: row.notificationId,
    userId: row.userId,
    title: row.title,
    body: row.body,
    target: validateNotificationTarget(row.target),
    ...(row.kind ? { kind: row.kind } : {}),
    ...(row.category ? { category: row.category } : {}),
    ...(row.sourceType ? { sourceType: row.sourceType } : {}),
    ...(row.sourceId ? { sourceId: row.sourceId } : {}),
    readAt: row.readAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
function toRow(item: InAppItem): ItemRow {
  return {
    id: item.id,
    deliveryId: item.deliveryId,
    notificationId: item.notificationId,
    userId: item.userId,
    title: item.title,
    body: item.body,
    target: item.target ?? null,
    // Written only when set, so a message without them also fits a table migrated before they existed.
    ...(item.kind ? { kind: item.kind } : {}),
    ...(item.category ? { category: item.category } : {}),
    ...(item.sourceType ? { sourceType: item.sourceType } : {}),
    ...(item.sourceId ? { sourceId: item.sourceId } : {}),
    readAt: item.readAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

/** What a message is about, as the item stores it. */
function about(
  message: InAppMessage,
): Pick<InAppItem, 'kind' | 'category' | 'sourceType' | 'sourceId'> {
  return {
    ...(message.kind ? { kind: message.kind } : {}),
    ...(message.category ? { category: message.category } : {}),
    ...(message.source?.type ? { sourceType: message.source.type } : {}),
    ...(message.source?.id ? { sourceId: message.source.id } : {}),
  };
}

function compareItemsDescending(a: InAppItem, b: InAppItem): number {
  return b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);
}

function isBefore(item: InAppItem, cursor: InAppPageCursor): boolean {
  return (
    item.createdAt < cursor.createdAt ||
    (item.createdAt === cursor.createdAt && item.id < cursor.id)
  );
}
