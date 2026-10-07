import { realtimeClientToken, useService } from '@nocobase/app-client';
import { useEffect, useRef } from 'react';

/**
 * Calls `listener` with each payload published on `topic`, and with `undefined` after a reconnect, since anything
 * published while disconnected was missed. No topic, no subscription.
 */
export function useRealtimeTopic(
  topic: string | null,
  listener: (payload: unknown) => void,
): void {
  const realtime = useService(realtimeClientToken);
  const listenerRef = useRef(listener);
  useEffect(() => {
    listenerRef.current = listener;
  });
  useEffect(() => {
    if (!topic) return undefined;
    const unsubscribe = realtime.subscribe<unknown>(topic, ({ payload }) =>
      listenerRef.current(payload),
    );
    const unsubscribeOpen = realtime.onOpen(() =>
      listenerRef.current(undefined),
    );
    return () => {
      unsubscribe();
      unsubscribeOpen();
    };
  }, [realtime, topic]);
}
