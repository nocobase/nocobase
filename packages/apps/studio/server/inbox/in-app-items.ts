/**
 * Finding a user's in-app items by their notifications. The in-app plugin's `InAppStore` acts on items by their own id
 * and lists them newest first only, and Studio keeps notification ids, so this reads the plugin's table directly: to
 * replace a merged item, list waiting decisions, and count unread items by Studio's classification across pages.
 *
 * @temporary(nocobase-official) Replace with an in-app store method that finds or updates an item by
 * `(notificationId, userId)` and lists a user's items by notification, or with grouped in-app messages, once the
 * notification plugins offer one.
 */
import { validateNotificationTarget } from '@nocobase/app-plugin-notification';
import type { DatabaseConnection } from '@nocobase/db';

import type { InboxItemRecord } from '../../shared/inbox.js';

const ITEMS = 'notificationInAppItems';

/** Count across all pages; joining the recipient too prevents another user's notice affecting the classification. */
export async function unreadNotifications(
  conn: DatabaseConnection,
  userId: string,
): Promise<number> {
  const row = await conn.query
    .selectFrom(ITEMS)
    .leftJoin('studioInboxNotices', (join) =>
      join
        .onRef(
          'studioInboxNotices.notificationId',
          '=',
          `${ITEMS}.notificationId`,
        )
        .onRef('studioInboxNotices.userId', '=', `${ITEMS}.userId`),
    )
    .select((eb) => [eb.fn.count(`${ITEMS}.id`).as('count')])
    .where(`${ITEMS}.userId`, '=', userId)
    .where(`${ITEMS}.readAt`, 'is', null)
    .where((eb) =>
      eb.or([
        eb('studioInboxNotices.kind', 'is', null),
        eb('studioInboxNotices.kind', '!=', 'decision'),
      ]),
    )
    .executeTakeFirst();
  return Number(row?.count ?? 0);
}

/** The id of `userId`'s in-app item of `notificationId`, or null once it is deleted. */
export async function findInAppItemId(
  conn: DatabaseConnection,
  notificationId: string,
  userId: string,
): Promise<string | null> {
  const row = await conn.query
    .selectFrom(ITEMS)
    .select('id')
    .where('notificationId', '=', notificationId)
    .where('userId', '=', userId)
    .executeTakeFirst();
  return row ? String(row.id) : null;
}

/** A stored date as ISO text. */
const isoText = (value: unknown): string =>
  value instanceof Date ? value.toISOString() : String(value);

/** A stored target, as JSON text or as an object; none when it is not one. */
function targetOf(value: unknown): InboxItemRecord['target'] {
  try {
    const parsed: unknown =
      typeof value === 'string' ? JSON.parse(value) : value;
    return validateNotificationTarget(parsed);
  } catch {
    return undefined;
  }
}

/** `userId`'s in-app items of `notificationIds`, by notification id, as the in-app plugin's API lists them. */
export async function inAppItemsOf(
  conn: DatabaseConnection,
  userId: string,
  notificationIds: readonly string[],
): Promise<Map<string, InboxItemRecord>> {
  const items = new Map<string, InboxItemRecord>();
  if (notificationIds.length === 0) return items;
  const rows = await conn.query
    .selectFrom(ITEMS)
    .select([
      'id',
      'deliveryId',
      'notificationId',
      'title',
      'body',
      'target',
      'readAt',
      'createdAt',
    ])
    .where('userId', '=', userId)
    .where('notificationId', 'in', [...new Set(notificationIds)])
    .execute();
  for (const row of rows) {
    const target = targetOf(row.target);
    items.set(String(row.notificationId), {
      id: String(row.id),
      deliveryId: String(row.deliveryId),
      notificationId: String(row.notificationId),
      title: typeof row.title === 'string' ? row.title : '',
      body: typeof row.body === 'string' ? row.body : '',
      ...(target ? { target } : {}),
      ...(row.readAt ? { readAt: isoText(row.readAt) } : {}),
      createdAt: isoText(row.createdAt),
    });
  }
  return items;
}
