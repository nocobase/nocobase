import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  useInboxRefresh,
  useInboxUnreadCount,
} from '@nocobase/app-plugin-notification-in-app/client/inbox';
import type { ReactElement } from 'react';

import { inboxBadge, useDocumentTitleBadge } from '#components/inbox-badge';
import { InboxButton } from '#components/inbox-button';

/** The header's link to `/inbox` with the unread count, for a signed-in person only. */
export function InboxHeaderButton(): ReactElement | null {
  const { session, isPending } = useAuthentication();
  if (isPending || !session?.user) return null;
  return <SignedInInboxButton key={session.user.id} />;
}

function SignedInInboxButton(): ReactElement {
  useInboxRefresh();
  const unread = useInboxUnreadCount();
  // Nothing in this application asks the viewer to decide, so the badge counts what is unread.
  const badge = inboxBadge(0, unread.data ?? 0);
  useDocumentTitleBadge(badge?.text ?? null);
  return <InboxButton badge={badge} />;
}
