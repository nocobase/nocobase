import { watchReadiness } from './realtime-readiness.js';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type {
  RealtimeConnectionState,
  RealtimeErrorEvent,
  RealtimeSubscriptionState,
  RealtimeListener,
  RealtimeWatchOptions,
} from '@nocobase/realtime/client';
import { realtimeClientToken } from './application.js';
import { useService } from './hooks.js';
import {
  createRealtimeRefresh,
  idleRealtimeRefresh,
  isTransientRefreshError,
  type RealtimeRefreshOptions,
  type RealtimeRefreshSnapshot,
} from './realtime-refresh.js';
export {
  createRealtimeRefresh,
  type RealtimeRefresh,
  type RealtimeRefreshOptions,
  type RealtimeRefreshSnapshot,
} from './realtime-refresh.js';

export function useRealtimeConnectionState(): RealtimeConnectionState {
  const realtime = useService(realtimeClientToken);
  return useSyncExternalStore(
    realtime.onStateChange,
    () => realtime.state,
    () => 'idle',
  );
}

export interface UseRealtimeTopicOptions<Payload> extends Omit<
  RealtimeWatchOptions<Payload>,
  'onEvent'
> {
  readonly enabled?: boolean;
}

/** A stable subscription whose callbacksRef always use the latest committed render. */
export function useRealtimeTopic<Payload = unknown>(
  topic: string | null | undefined,
  listener: RealtimeListener<Payload>,
  options: UseRealtimeTopicOptions<Payload> = {},
): void {
  const realtime = useService(realtimeClientToken);
  const callbacksRef = useRef({ listener, options });
  useEffect(() => {
    callbacksRef.current = { listener, options };
  });
  const enabled = options.enabled !== false;
  useEffect(() => {
    if (!topic || !enabled) return;
    const subscription = realtime.watch<Payload>(topic, {
      onEvent: (event) => callbacksRef.current.listener(event),
      onReady: () => callbacksRef.current.options.onReady?.(),
      onError: (error) => callbacksRef.current.options.onError?.(error),
      onStateChange: (state) =>
        callbacksRef.current.options.onStateChange?.(state),
    });
    return () => subscription.close();
  }, [realtime, topic, enabled]);
}

/** Gate initial HTTP snapshots on acknowledgements, with an HTTP fallback for refused or unavailable topics. */
export function useRealtimeReadiness(
  topics: readonly string[],
  onRecovery?: () => void,
): boolean {
  const realtime = useService(realtimeClientToken);
  const identity = [...new Set(topics)].sort().join('\n');
  const recoveryRef = useRef(onRecovery);
  useEffect(() => {
    recoveryRef.current = onRecovery;
  });
  const [prepared, setPrepared] = useState<{
    realtime: typeof realtime;
    identity: string;
  }>();
  useEffect(() => {
    if (!identity) return;
    const barrier = watchReadiness(realtime, identity.split('\n'), {
      onOpen: () => setPrepared({ realtime, identity }),
      onRecovery: () => recoveryRef.current?.(),
    });
    return barrier.close;
  }, [realtime, identity]);
  return (
    identity.length === 0 ||
    (prepared?.realtime === realtime && prepared.identity === identity)
  );
}

export interface UseRealtimeRefreshOptions extends RealtimeRefreshOptions {
  readonly enabled?: boolean;
  readonly onSubscriptionError?: (error: RealtimeErrorEvent) => void;
  readonly onSubscriptionStateChange?: (
    state: RealtimeSubscriptionState,
  ) => void;
}
export interface UseRealtimeRefreshResult extends RealtimeRefreshSnapshot {
  retry(): void;
}
export function useRealtimeRefresh(
  topic: string | null | undefined,
  refresh: (signal: AbortSignal) => void | Promise<unknown>,
  options: UseRealtimeRefreshOptions = {},
): UseRealtimeRefreshResult {
  const realtime = useService(realtimeClientToken);
  const callbacksRef = useRef({ refresh, options });
  const retryRef = useRef<() => void>(() => {});
  const [observed, setObserved] = useState<{
    topic: string;
    snapshot: RealtimeRefreshSnapshot;
  }>();
  useEffect(() => {
    callbacksRef.current = { refresh, options };
  });
  const {
    enabled = true,
    delayMs,
    retries,
    retryDelayMs,
    retryMaxDelayMs,
    refreshIntervalMs,
  } = options;
  useEffect(() => {
    if (!topic || !enabled) return;
    let active = true;
    const scheduled = createRealtimeRefresh(
      (signal) => callbacksRef.current.refresh(signal),
      {
        delayMs,
        retries,
        retryDelayMs,
        retryMaxDelayMs,
        refreshIntervalMs,
        shouldRetry: (error) =>
          callbacksRef.current.options.shouldRetry?.(error) ??
          isTransientRefreshError(error),
        onError: (error) => {
          if (callbacksRef.current.options.onError)
            callbacksRef.current.options.onError(error);
          else console.error('Realtime refresh failed.', error);
        },
        onStateChange: (snapshot) => {
          if (!active) return;
          setObserved({ topic, snapshot });
          callbacksRef.current.options.onStateChange?.(snapshot);
        },
      },
    );
    const subscription = realtime.watch(topic, {
      onEvent: scheduled.request,
      onReady: scheduled.retry,
      onError: (error) =>
        callbacksRef.current.options.onSubscriptionError?.(error),
      onStateChange: (state) =>
        callbacksRef.current.options.onSubscriptionStateChange?.(state),
    });
    retryRef.current = () => {
      subscription.retry();
      scheduled.retry();
    };
    return () => {
      active = false;
      retryRef.current = () => {};
      subscription.close();
      scheduled.close();
    };
  }, [
    realtime,
    topic,
    enabled,
    delayMs,
    retries,
    retryDelayMs,
    retryMaxDelayMs,
    refreshIntervalMs,
  ]);
  const retry = useCallback(() => retryRef.current(), []);
  return {
    ...(enabled && observed && observed.topic === topic
      ? observed.snapshot
      : idleRealtimeRefresh),
    retry,
  };
}
