import type { RealtimeClient } from '@nocobase/app-client';

import { MAIL_REALTIME_TOPIC } from '../shared/realtime.js';

const FOCUS_REFRESH_INTERVAL_MS = 30_000;

export interface MailFocusTarget {
  addEventListener(type: 'focus', listener: EventListener): void;
  removeEventListener(type: 'focus', listener: EventListener): void;
}

export function subscribeToMailInvalidations(
  realtime: Pick<RealtimeClient, 'watch'>,
  target: MailFocusTarget,
  refresh: () => void,
  onFocus: () => void = refresh,
): () => void {
  // Mounting already loads data. Focus recovery is a fallback, not a reload
  // for every switch between DevTools and the composer.
  let lastFocusRefresh = Date.now();
  const handleFocus = (): void => {
    const now = Date.now();
    if (now - lastFocusRefresh < FOCUS_REFRESH_INTERVAL_MS) return;
    lastFocusRefresh = now;
    onFocus();
  };
  const subscription = realtime.watch<unknown>(MAIL_REALTIME_TOPIC, {
    onReady: refresh,
    onEvent: (event): void => {
      if (isMailChanged(event.payload)) refresh();
    },
  });
  target.addEventListener('focus', handleFocus);

  return (): void => {
    target.removeEventListener('focus', handleFocus);
    subscription.close();
  };
}

function isMailChanged(payload: unknown): boolean {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'kind' in payload &&
    payload.kind === 'mail.changed'
  );
}

export const MAIL_UNREAD_COUNT_CHANGED_EVENT =
  'nocobase:mail-unread-count-changed';
