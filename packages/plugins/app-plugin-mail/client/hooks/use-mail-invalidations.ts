import { realtimeClientToken, useService } from '@nocobase/app-client';
import { useEffect, useEffectEvent } from 'react';
import { subscribeToMailInvalidations } from '../subscription.js';

/** Coalesces provider events and reconnects without coupling subscriptions to view state. */
export function useMailInvalidations(
  refresh: () => void | boolean,
  onFocus: () => void,
): void {
  const realtime = useService(realtimeClientToken);
  const onChange = useEffectEvent(refresh);
  const onWindowFocus = useEffectEvent(onFocus);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const scheduleRefresh = (): void => {
      if (timer !== undefined) return;
      timer = setTimeout(() => {
        timer = undefined;
        if (onChange() === false) scheduleRefresh();
      }, 100);
    };
    const unsubscribe = subscribeToMailInvalidations(
      realtime,
      window,
      scheduleRefresh,
      () => onWindowFocus(),
    );
    return () => {
      if (timer !== undefined) clearTimeout(timer);
      unsubscribe();
    };
  }, [realtime]);
}
