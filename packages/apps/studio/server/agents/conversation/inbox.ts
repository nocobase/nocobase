/**
 * Studio's inbox as agents read it: the in-app items of a person, newest first, with what Studio knows about each (a
 * decision still waiting, the issue it is about). An agent in a conversation reads its person's inbox with `inbox
 * list` (`GET /api/inbox/items`), and a page context may name an item (`inboxItem`).
 */
import type {
  InAppItem,
  InAppStore,
} from '@nocobase/app-plugin-notification-in-app/server';

import type { StudioInbox } from '../../inbox/service.js';

/** One inbox item, as the person sees it. */
export interface InboxEntry {
  readonly id: string;
  /** A decision someone must take, or information. */
  readonly kind: 'decision' | 'info';
  /** What happened, such as `approval_requested`. */
  readonly type: string;
  readonly title: string;
  readonly body: string;
  readonly read: boolean;
  /** A decision still waiting on the person. */
  readonly pending: boolean;
  /** The issue it is about (`PM-12`). */
  readonly issueIdentifier: string | null;
  /** Where it opens in the application. */
  readonly url: string | null;
  readonly createdAt: string;
}

export interface InboxSource {
  /** The person's newest items, newest first; after `before` (an item's `createdAt` and `id`) when given. */
  list(
    userId: string,
    options: {
      readonly limit: number;
      readonly unreadOnly?: boolean;
      readonly before?: { readonly createdAt: string; readonly id: string };
    },
  ): Promise<readonly InboxEntry[]>;
  /** The person's own items among `ids`; others' items and unknown ids are left out. */
  find(
    userId: string,
    ids: readonly string[],
  ): Promise<ReadonlyMap<string, InboxEntry>>;
}

/** Items read to find the ones a page context names: the newest of the person's inbox. */
const FIND_WINDOW = 200;
/** Characters of an item's body an agent reads. */
const BODY_MAX = 500;

function routeOf(item: InAppItem): string | null {
  const target = item.target as { type?: unknown; path?: unknown } | undefined;
  return target?.type === 'route' && typeof target.path === 'string'
    ? target.path
    : null;
}

export function createInboxSource(deps: {
  readonly inbox: Pick<StudioInbox, 'notices'>;
  readonly inApp: () => InAppStore | null;
}): InboxSource {
  async function entries(
    userId: string,
    items: readonly InAppItem[],
  ): Promise<InboxEntry[]> {
    const notices = new Map(
      (
        await deps.inbox.notices(
          userId,
          items.map((item) => item.notificationId),
        )
      ).map((notice) => [notice.notificationId, notice]),
    );
    return items.map((item) => {
      const notice = notices.get(item.notificationId);
      return {
        id: item.id,
        kind: notice?.kind ?? 'info',
        type: notice?.type ?? 'notification',
        title: item.title ?? '',
        body: item.body.slice(0, BODY_MAX),
        read: Boolean(item.readAt),
        pending: notice?.kind === 'decision' && !notice.resolvedAt,
        issueIdentifier:
          notice?.subject?.type === 'issue' ? notice.subject.label : null,
        url: routeOf(item),
        createdAt: item.createdAt,
      };
    });
  }

  return {
    async list(userId, options) {
      const store = deps.inApp();
      if (!store) return [];
      const items = await store.list({
        userId,
        limit: options.limit,
        ...(options.unreadOnly ? { unreadOnly: true } : {}),
        ...(options.before ? { before: options.before } : {}),
      });
      return entries(userId, items);
    },
    async find(userId, ids) {
      const store = deps.inApp();
      if (!store || ids.length === 0) return new Map();
      const wanted = new Set(ids);
      const items = (await store.list({ userId, limit: FIND_WINDOW })).filter(
        (item) => wanted.has(item.id),
      );
      return new Map(
        (await entries(userId, items)).map((entry) => [entry.id, entry]),
      );
    },
  };
}
