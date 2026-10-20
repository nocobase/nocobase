import { realtimeClientToken, useService } from '@nocobase/app-client';
import { useEffect, useRef } from 'react';

/** Keeps the plugin's payload callback API and refreshes after acknowledged subscriptions. */
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
    if (!topic) return;
    const subscription = realtime.watch(topic, {
      onEvent: ({ payload }) => listenerRef.current(payload),
      onReady: () => listenerRef.current(undefined),
    });
    return () => subscription.close();
  }, [realtime, topic]);
}
