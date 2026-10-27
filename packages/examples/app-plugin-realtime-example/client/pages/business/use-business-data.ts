import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ApiClientError,
  createRealtimeRefresh,
  realtimeClientToken,
  useApiClient,
  useService,
} from '@nocobase/app-client';

export interface BusinessData<T> {
  readonly data: T | undefined;
  readonly error: unknown;
  readonly loading: boolean;
  reload(this: void): Promise<void>;
  setData(
    this: void,
    value: T | ((previous: T | undefined) => T | undefined),
  ): void;
  fail(this: void, error: unknown): void;
}
interface Snapshot<T> {
  path: string;
  data?: T;
  error?: unknown;
  loading: boolean;
}

/** One scheduler owns initial, manual and event reads, including transient retries. */
export function useBusinessData<T>(
  path: string,
  topic?: string,
): BusinessData<T> {
  const api = useApiClient();
  const realtime = useService(realtimeClientToken);
  const [snapshot, setSnapshot] = useState<Snapshot<T>>({
    path,
    loading: true,
  });
  const activeRef = useRef<AbortController | undefined>(undefined);
  const reloadRef = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    const waiting = new Set<() => void>();
    const settle = (): void => {
      for (const resolve of waiting) resolve();
      waiting.clear();
    };
    const scheduled = createRealtimeRefresh(
      async (signal) => {
        const controller = new AbortController();
        activeRef.current = controller;
        const combined = AbortSignal.any([signal, controller.signal]);
        setSnapshot((current) => ({
          path,
          data: current.path === path ? current.data : undefined,
          loading: true,
        }));
        try {
          const data = await api.request<T>({ path, signal: combined });
          if (!combined.aborted) setSnapshot({ path, data, loading: false });
        } catch (error) {
          if (combined.aborted) return;
          const forbidden =
            error instanceof ApiClientError &&
            [401, 403, 404].includes(error.status);
          setSnapshot((current) => ({
            path,
            data: forbidden ? undefined : current.data,
            error,
            loading: false,
          }));
          throw error;
        }
      },
      {
        refreshIntervalMs: topic ? 60_000 : undefined,
        onStateChange: ({ status }) => {
          if (
            status === 'retrying' ||
            status === 'idle' ||
            status === 'failed' ||
            status === 'closed'
          )
            settle();
        },
      },
    );
    reloadRef.current = () =>
      new Promise<void>((resolve) => {
        waiting.add(resolve);
        scheduled.retry();
      });
    const watch = topic
      ? realtime.watch(topic, {
          onEvent: scheduled.request,
          onReady: scheduled.retry,
        })
      : undefined;
    scheduled.request();
    return () => {
      reloadRef.current = async () => {};
      watch?.close();
      scheduled.close();
    };
  }, [api, path, realtime, topic]);
  const reload = useCallback(() => reloadRef.current(), []);
  const acceptData = useCallback(
    (value: T | ((previous: T | undefined) => T | undefined)) => {
      activeRef.current?.abort();
      setSnapshot((current) => ({
        path,
        data:
          typeof value === 'function'
            ? (value as (previous: T | undefined) => T | undefined)(
                current.path === path ? current.data : undefined,
              )
            : value,
        loading: false,
      }));
    },
    [path],
  );
  const fail = useCallback(
    (error: unknown) => {
      activeRef.current?.abort();
      setSnapshot({ path, error, loading: false });
    },
    [path],
  );
  return {
    data: snapshot.path === path ? snapshot.data : undefined,
    error: snapshot.path === path ? snapshot.error : undefined,
    loading: snapshot.path !== path || snapshot.loading,
    reload,
    setData: acceptData,
    fail,
  };
}
