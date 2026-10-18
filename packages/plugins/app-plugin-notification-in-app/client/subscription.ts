import {
  createRealtimeRefresh,
  type RealtimeClient,
} from '@nocobase/app-client';

import { IN_APP_NOTIFICATION_REALTIME_TOPIC } from '../shared/realtime.js';

export interface InboxFocusTarget {
  addEventListener(type: 'focus', listener: EventListener): void;
  removeEventListener(type: 'focus', listener: EventListener): void;
}

export function subscribeToInboxInvalidations(
  realtime: Pick<RealtimeClient, 'watch'>,
  target: InboxFocusTarget,
  refresh: (signal: AbortSignal) => void | Promise<unknown>,
): () => void {
  const scheduled = createRealtimeRefresh(refresh);
  const subscription = realtime.watch<unknown>(
    IN_APP_NOTIFICATION_REALTIME_TOPIC,
    {
      onReady: scheduled.request,
      onEvent: (event): void => {
        if (isInboxChanged(event.payload)) scheduled.request();
      },
    },
  );
  target.addEventListener('focus', scheduled.request);

  return (): void => {
    target.removeEventListener('focus', scheduled.request);
    subscription.close();
    scheduled.close();
  };
}

function isInboxChanged(payload: unknown): boolean {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'kind' in payload &&
    payload.kind === 'inbox.changed'
  );
}
