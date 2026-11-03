import {
  realtimeClientToken,
  useRealtimeReadiness,
  useService,
} from '@nocobase/app-client';
import { useEffect, useRef } from 'react';

/** Keeps the plugin's payload callback API and refreshes after acknowledged subscriptions. */
export function useRealtimeTopic(
  topic: string | null,
  listener: (payload: unknown) => void,
  initialReadAfterReady = false,
): boolean {
  const realtime = useService(realtimeClientToken);
  const listenerRef = useRef(listener);
  useEffect(() => {
    listenerRef.current = listener;
  });
  const ready = useRealtimeReadiness(
    initialReadAfterReady && topic ? [topic] : [],
    initialReadAfterReady ? () => listenerRef.current(undefined) : undefined,
  );
  useEffect(() => {
    if (!topic) return;
    const subscription = realtime.watch(topic, {
      onEvent: ({ payload }) => listenerRef.current(payload),
      ...(initialReadAfterReady
        ? {}
        : { onReady: () => listenerRef.current(undefined) }),
    });
    return () => subscription.close();
  }, [realtime, topic, initialReadAfterReady]);
  return ready;
}
