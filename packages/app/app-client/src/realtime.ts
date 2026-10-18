import { useEffect, useRef, useSyncExternalStore } from 'react';
import type {
  RealtimeConnectionState,
  RealtimeListener,
  RealtimeWatchOptions,
} from '@nocobase/realtime/client';
import { realtimeClientToken } from './application.js';
import { useService } from './hooks.js';

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

export interface RealtimeRefreshOptions {
  readonly delayMs?: number;
  readonly onError?: (error: unknown) => void;
}
export interface RealtimeRefresh {
  request(this: void): void;
  close(this: void): void;
}

/** Coalesces bursts, pauses hidden views and preserves one follow-up during an in-flight refresh. */
export function createRealtimeRefresh(
  refresh: (signal: AbortSignal) => void | Promise<unknown>,
  options: RealtimeRefreshOptions = {},
): RealtimeRefresh {
  let dirty = false;
  let running = false;
  let closed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const controller = new AbortController();
  const visible = () =>
    typeof document === 'undefined' || document.visibilityState !== 'hidden';
  const schedule = (): void => {
    if (closed || running || timer || !dirty || !visible()) return;
    timer = setTimeout(() => {
      timer = undefined;
      if (closed || !visible()) return;
      dirty = false;
      running = true;
      void Promise.resolve()
        .then(() => {
          if (!closed) return refresh(controller.signal);
        })
        .catch((error: unknown) => {
          if (closed) return;
          if (options.onError) options.onError(error);
          else console.error('Realtime refresh failed.', error);
        })
        .finally(() => {
          running = false;
          schedule();
        });
    }, options.delayMs ?? 100);
  };
  const wake = (): void => {
    if (visible()) {
      dirty = true;
      schedule();
    }
  };
  if (typeof document !== 'undefined')
    document.addEventListener('visibilitychange', wake);
  return {
    request() {
      dirty = true;
      schedule();
    },
    close() {
      closed = true;
      clearTimeout(timer);
      controller.abort();
      if (typeof document !== 'undefined')
        document.removeEventListener('visibilitychange', wake);
    },
  };
}

export interface UseRealtimeRefreshOptions extends RealtimeRefreshOptions {
  readonly enabled?: boolean;
}
export function useRealtimeRefresh(
  topic: string | null | undefined,
  refresh: (signal: AbortSignal) => void | Promise<unknown>,
  options: UseRealtimeRefreshOptions = {},
): void {
  const realtime = useService(realtimeClientToken);
  const callbacksRef = useRef({ refresh, onError: options.onError });
  useEffect(() => {
    callbacksRef.current = { refresh, onError: options.onError };
  });
  const { enabled = true, delayMs } = options;
  useEffect(() => {
    if (!topic || !enabled) return;
    const scheduled = createRealtimeRefresh(
      (signal) => callbacksRef.current.refresh(signal),
      {
        delayMs,
        onError: (error) => {
          if (callbacksRef.current.onError) callbacksRef.current.onError(error);
          else console.error('Realtime refresh failed.', error);
        },
      },
    );
    const subscription = realtime.watch(topic, {
      onEvent: scheduled.request,
      onReady: scheduled.request,
    });
    return () => {
      subscription.close();
      scheduled.close();
    };
  }, [realtime, topic, enabled, delayMs]);
}
