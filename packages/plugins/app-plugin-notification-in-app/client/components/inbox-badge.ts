import type { AppClientBadge } from '@nocobase/app-client';
import { NamespaceScope } from '@nocobase/i18n/client';
import {
  createElement,
  useMemo,
  type ComponentType,
  type ReactElement,
} from 'react';

import { IN_APP_NOTIFICATION_CLIENT_NAMESPACE } from '../i18n.js';
import { useInboxRefresh, useInboxUnreadCount } from '../inbox/index.js';
import { useInboxSource } from '../inbox-page/extensions.js';
import { useInboxPending } from '../inbox-page/source.js';
import { InboxButton, type InboxButtonOptions } from './inbox-button.js';

/** What waits on the viewer, summed over the registered pending sources' categories. */
export function usePendingTotal(): number {
  const source = useInboxSource();
  const pending = useInboxPending(source).data;
  return useMemo(
    () =>
      Object.values(pending ?? {}).reduce(
        (sum, count) => sum + (Number.isFinite(count) && count > 0 ? count : 0),
        0,
      ),
    [pending],
  );
}

/**
 * The header badge: what waits on the viewer (`attention`) when anything does, else the unread count. It also keeps
 * every inbox query fresh over realtime, since it runs for as long as the person is signed in.
 */
export function useInboxBadge(): AppClientBadge | undefined {
  const source = useInboxSource();
  useInboxRefresh(source.refreshTopics);
  const pending = usePendingTotal();
  const unread = useInboxUnreadCount().data ?? 0;
  if (pending > 0) return { count: pending, tone: 'attention' };
  return unread > 0 ? { count: unread } : undefined;
}

/** Builds the header's inbox button for an inbox page at `path`, in the plugin's translation namespace. */
export function createInboxButton(options: InboxButtonOptions): ComponentType {
  function InboxHeaderButton(): ReactElement {
    return createElement(
      NamespaceScope,
      { ns: IN_APP_NOTIFICATION_CLIENT_NAMESPACE },
      createElement(InboxButton, options),
    );
  }
  return InboxHeaderButton;
}
