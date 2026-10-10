import { Mail } from 'lucide-react';
import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

import { useMailUnreadCount } from '../hooks/use-mail-unread-count.js';
import { MAIL_PLUGIN_NS } from '../namespace.js';

export { MAIL_UNREAD_COUNT_CHANGED_EVENT } from '../subscription.js';
/** Mail center icon with a current-user unread badge. */
export function MailNavigationIcon(): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const { unreadCount: unread } = useMailUnreadCount();

  return (
    <span className='relative inline-flex size-4 items-center justify-center'>
      <Mail aria-hidden='true' className='size-4' />
      {unread !== undefined && unread > 0 ? (
        <span
          aria-label={t('nav.unread', {
            count: unread,
            defaultValue: '{{count}} unread messages',
          })}
          className='absolute -top-2 -right-2 min-w-4 rounded-full bg-primary px-1 text-center text-[9px] leading-4 font-semibold text-primary-foreground'
        >
          {unread > 99 ? '99+' : unread}
        </span>
      ) : null}
    </span>
  );
}
