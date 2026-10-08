import { Mail } from 'lucide-react';
import { realtimeClientToken, useService } from '@nocobase/app-client';
import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

import { useMailClient } from '../runtime.js';
import { MAIL_PLUGIN_NS } from '../namespace.js';
import { subscribeToMailInvalidations } from '../subscription.js';

const REFRESH_INTERVAL_MS = 60_000;
export { MAIL_UNREAD_COUNT_CHANGED_EVENT } from '../subscription.js';
import { MAIL_UNREAD_COUNT_CHANGED_EVENT } from '../subscription.js';

/** Mail center icon with a current-user unread badge. */
export function MailNavigationIcon(): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const mail = useMailClient();
  const realtime = useService(realtimeClientToken);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    let pending = false;
    let inFlight = false;
    let debounce: number | undefined;
    const refresh = (): void => {
      if (!active || inFlight) return;
      pending = false;
      inFlight = true;
      void mail
        .getUnreadCount()
        .then((count) => {
          if (active && !pending) setUnread(count);
        })
        .catch(() => undefined)
        .finally(() => {
          inFlight = false;
          if (active && pending) schedule();
        });
    };
    const schedule = (): void => {
      pending = true;
      window.clearTimeout(debounce);
      debounce = window.setTimeout(refresh, 100);
    };
    refresh();
    const unsubscribeRealtime = subscribeToMailInvalidations(
      realtime,
      window,
      schedule,
    );
    const timer = window.setInterval(schedule, REFRESH_INTERVAL_MS);
    window.addEventListener(MAIL_UNREAD_COUNT_CHANGED_EVENT, schedule);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.clearTimeout(debounce);
      unsubscribeRealtime();
      window.removeEventListener(MAIL_UNREAD_COUNT_CHANGED_EVENT, schedule);
    };
  }, [mail, realtime]);

  return (
    <span className='relative inline-flex size-4 items-center justify-center'>
      <Mail aria-hidden='true' className='size-4' />
      {unread > 0 ? (
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
