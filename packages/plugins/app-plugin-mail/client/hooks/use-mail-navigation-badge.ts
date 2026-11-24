import type { AppClientBadge } from '@nocobase/app-client';

import { useMailUnreadCount } from './use-mail-unread-count.js';

/** The unread count beside the Mail navigation entry, from the same request and realtime topic as the page. */
export function useMailNavigationBadge(): AppClientBadge | undefined {
  const { unreadCount } = useMailUnreadCount();
  return unreadCount ? { count: unreadCount } : undefined;
}
