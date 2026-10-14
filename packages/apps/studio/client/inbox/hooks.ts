/** The inbox's counts and refresh for the navigation and dashboard, over the in-app plugin's hooks and Studio's source. */
import {
  useInboxRefresh as useInAppInboxRefresh,
  useInboxUnreadCount,
} from '@nocobase/app-plugin-notification-in-app/client/inbox';
import type { UseQueryResult } from '@tanstack/react-query';

import { studioInboxSource } from './source.js';

export { usePendingDecisions } from './source.js';

/**
 * Refetches the inbox when it changes: an item arrives, is read or deleted (the in-app plugin's topic, on reconnect
 * and on window focus too), or a decision is resolved (Studio's own topic).
 */
export function useInboxRefresh(): void {
  useInAppInboxRefresh(studioInboxSource.refreshTopics);
}

/** How many of the viewer's in-app items are unread, decisions and notifications alike. */
export function useUnreadCount(): UseQueryResult<number> {
  return useInboxUnreadCount();
}
