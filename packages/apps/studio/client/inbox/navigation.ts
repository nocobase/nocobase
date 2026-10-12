import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useRef } from 'react';

import { inboxBadge, useDocumentTitleBadge } from '@/components/inbox-badge';
import type { InboxBadge } from '@/components/inbox-badge';

import { armInboxChime, playInboxChime, useInboxChime } from './chime.js';
import {
  useInboxRefresh,
  usePendingDecisions,
  useUnreadCount,
} from './hooks.js';
import { usePendingFeeds } from './use-registry.js';

/**
 * The application layout owns the inbox subscription and reminders, even while the menu is hidden or replaced by
 * settings navigation. Route navigation only describes static entries, so it receives the badge as presentation data.
 *
 * The amber count is what still needs the viewer's action, not what is unread: a decision that was read but not handled
 * keeps counting until it is resolved. With no decision waiting, a count in the primary color says how many items are
 * still unread; why the two never add up is `inboxBadge`'s. Whichever count shows prefixes the browser tab title
 * (`(3) Studio`), and a rising decision count rings the chime unless the viewer turned it off.
 */
export function useInboxNavigation(): {
  readonly badge: InboxBadge;
  readonly label: string;
  readonly hint: string;
} {
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

  return {
    badge,
    label: !badge
      ? t('inbox.title')
      : t(
          badge.kind === 'decisions'
            ? 'inbox.headerPending'
            : 'inbox.headerUnread',
          { count: badge.count },
        ),
    hint: !badge
      ? t('inbox.title')
      : t(
          badge.kind === 'decisions'
            ? 'inbox.pendingBadgeHint'
            : 'inbox.unreadBadgeHint',
          { count: badge.count },
        ),
  };
}
