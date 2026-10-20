import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createRealtimeRefresh,
  realtimeClientToken,
  useService,
  type RealtimeRefreshSnapshot,
} from '@nocobase/app-client';
import {
  LIFECYCLE_CHANGES_TOPIC,
  type LifecycleChange,
} from '../../shared/routes.js';

/** Events and acknowledged subscriptions schedule snapshots; periodic reads cover lost events. */
export function useLifecycleChanges(
  lifecycle: string,
  key: string,
  refresh: (signal: AbortSignal) => Promise<void>,
): { readonly error: unknown; readonly retry: () => void } {
  const realtime = useService(realtimeClientToken);
  const callbackRef = useRef(refresh);
  const retryRef = useRef<() => void>(() => {});
  const [observed, setObserved] = useState<{
    key: string;
    snapshot: RealtimeRefreshSnapshot;
  }>();
  useEffect(() => {
    callbackRef.current = refresh;
  });
  useEffect(() => {
    let active = true;
    const scheduled = createRealtimeRefresh(
      (signal) => callbackRef.current(signal),
      {
        refreshIntervalMs: 60_000,
        // LifecycleRequestError preserves HTTP status but is not an ApiClientError.
        shouldRetry: (error) => {
          if (
            typeof error !== 'object' ||
            error === null ||
            !('status' in error) ||
            typeof error.status !== 'number'
          )
            return true;
          return (
            error.status < 400 ||
            error.status >= 500 ||
            error.status === 408 ||
            error.status === 429
          );
        },
        onStateChange: (snapshot) => {
          if (active) setObserved({ key, snapshot });
        },
      },
    );
    const subscription = realtime.watch<LifecycleChange>(
      LIFECYCLE_CHANGES_TOPIC,
      {
        onEvent: ({ payload }) => {
          if (payload.lifecycle === lifecycle) scheduled.request();
        },
        onReady: scheduled.retry,
      },
    );
    scheduled.request();
    retryRef.current = () => {
      subscription.retry();
      scheduled.retry();
    };
    return () => {
      active = false;
      scheduled.request();
      retryRef.current = () => {};
      subscription.close();
      scheduled.close();
    };
  }, [realtime, lifecycle, key]);
  const retry = useCallback(() => retryRef.current(), []);
  return {
    error: observed?.key === key ? observed.snapshot.error : undefined,
    retry,
  };
}

/** Wait for every read before a failed batch may retry, avoiding overlapping requests. */
export async function refreshLifecycleViews(
  reads: readonly Promise<void>[],
): Promise<void> {
  const results = await Promise.allSettled(reads);
  for (const result of results)
    if (result.status === 'rejected') throw result.reason;
}
