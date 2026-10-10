import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useEffect, useRef } from 'react';

import { inboxBadge, useDocumentTitleBadge } from '@/components/inbox-badge';
import { InboxButton } from '@/components/inbox-button';

import { armInboxChime, playInboxChime, useInboxChime } from './chime.js';
import {
  useInboxRefresh,
  usePendingDecisions,
  useUnreadCount,
} from './hooks.js';
import { usePendingFeeds } from './use-registry.js';

/**
 * The header's inbox button (the UI Library's `InboxButton`), with the number of decisions waiting on the viewer.
 *
 * The amber count is what still needs the viewer's action, not what is unread: a decision that was read but not handled
 * keeps counting until it is resolved. With no decision waiting, a count in the primary color says how many items are
 * still unread; why the two never add up is `inboxBadge`'s. Whichever count shows prefixes the browser tab title
 * (`(3) Studio`), and a rising decision count rings the chime unless the viewer turned it off. The header is mounted once
 * per layout, so the button owns both.
 */
export function InboxHeaderButton(): ReactElement {
  const { t } = useTranslation();
  useInboxRefresh();
  const pending = usePendingDecisions();
  const unread = useUnreadCount();
  // What the contributors' feeds have waiting (plans proposed to the viewer) waits for a decision too.
  const plans = usePendingFeeds().reduce(
    (sum, { items }) => sum + items.length,
    0,
  );
  const decisions = pending.data?.decision;
  const count = (decisions ?? 0) + plans;
  const badge = inboxBadge(count, unread.data ?? 0);
  useDocumentTitleBadge(badge?.text ?? null);

  const { enabled: chime } = useInboxChime();
  const previousRef = useRef<number | null>(null);
  useEffect(() => {
    armInboxChime();
  }, []);
  useEffect(() => {
    if (decisions === undefined) return;
    const next = decisions + plans;
    if (chime && previousRef.current !== null && next > previousRef.current)
      playInboxChime();
    previousRef.current = next;
  }, [decisions, plans, chime]);

  return (
    <InboxButton
      badge={badge}
      idPrefix='studio-inbox'
      labels={{
        title: t('inbox.title'),
        pending: (value) => t('inbox.headerPending', { count: value }),
        unread: (value) => t('inbox.headerUnread', { count: value }),
        pendingHint: (value) => t('inbox.pendingBadgeHint', { count: value }),
        unreadHint: (value) => t('inbox.unreadBadgeHint', { count: value }),
      }}
    />
  );
}
