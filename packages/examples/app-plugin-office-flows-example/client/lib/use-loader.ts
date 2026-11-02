import {
  createRealtimeRefresh,
  realtimeClientToken,
  useService,
} from '@nocobase/app-client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { OFFICE_FLOWS_TOPIC } from '../../shared/realtime.js';
import { errorMessage } from './api.js';

/** Reads on lifecycle changes, readiness and focus, with reconciliation for edits outside the lifecycle. */
export function useLoader<T>(
  load: (() => Promise<T>) | undefined,
  key: string,
): {
  readonly data: T | undefined;
  readonly error: string;
  readonly reload: () => Promise<void>;
} {
  const realtime = useService(realtimeClientToken);
  const loadRef = useRef(load);
  const reloadRef = useRef<() => Promise<void>>(async () => {});
  const [loaded, setLoaded] = useState<{ key: string; data: T }>();
  const [failure, setFailure] = useState<{ key: string; message: string }>();
  useEffect(() => {
    loadRef.current = load;
  });
  useEffect(() => {
    const waiting = new Set<() => void>();
    const settle = (): void => {
      for (const resolve of waiting) resolve();
      waiting.clear();
    };
    const scheduled = createRealtimeRefresh(
      async (signal) => {
        if (!loadRef.current) return;
        const data = await loadRef.current();
        if (signal.aborted) return;
        setLoaded({ key, data });
        setFailure(undefined);
      },
      {
        refreshIntervalMs: 60_000,
        onError: (error) => setFailure({ key, message: errorMessage(error) }),
        onStateChange: ({ status }) => {
          if (status === 'idle' || status === 'failed' || status === 'closed')
            settle();
        },
      },
    );
    reloadRef.current = () =>
      new Promise<void>((resolve) => {
        waiting.add(resolve);
        scheduled.retry();
      });
    const subscription = realtime.watch(OFFICE_FLOWS_TOPIC, {
      onEvent: scheduled.request,
      onReady: scheduled.retry,
    });
    scheduled.request();
    return () => {
      reloadRef.current = async () => {};
      subscription.close();
      scheduled.close();
    };
  }, [key, realtime]);
  const reload = useCallback(() => reloadRef.current(), []);
  return {
    data: loaded?.key === key ? loaded.data : undefined,
    error: failure?.key === key ? failure.message : '',
    reload,
  };
}
