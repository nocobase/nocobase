import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import type { InboxBadge } from '@/components/inbox-badge';
import { InboxButton } from '@/components/inbox-button';

import { UserMenu } from './user-menu.js';

/**
 * The header's right side on every page: the inbox, NocoBase's notification button with what waits on the viewer or
 * is unread (`inbox/navigation.ts`), then the account menu.
 */
export function HeaderActions({
  inbox,
}: {
  readonly inbox: InboxBadge;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div className='flex shrink-0 items-center gap-2'>
      <InboxButton
        badge={inbox}
        idPrefix='studio-inbox'
        labels={{
          title: t('inbox.title'),
          pending: (count) => t('inbox.headerPending', { count }),
          unread: (count) => t('inbox.headerUnread', { count }),
          pendingHint: (count) => t('inbox.pendingBadgeHint', { count }),
          unreadHint: (count) => t('inbox.unreadBadgeHint', { count }),
        }}
      />
      <UserMenu />
    </div>
  );
}
