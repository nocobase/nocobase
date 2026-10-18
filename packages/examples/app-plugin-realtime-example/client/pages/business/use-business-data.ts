import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ApiClientError,
  useApiClient,
  useRealtimeRefresh,
} from '@nocobase/app-client';

export interface BusinessData<T> {
  readonly data: T | undefined;
  readonly error: unknown;
  readonly loading: boolean;
  reload(this: void, signal?: AbortSignal): Promise<void>;
  setData(
    this: void,
    value: T | ((previous: T | undefined) => T | undefined),
  ): void;
  fail(this: void, error: unknown): void;
}
/** The endpoint is authoritative, including when a task disappears after reassignment. */
export function useBusinessData<T>(
  path: string,
  topic?: string,
): BusinessData<T> {
  const api = useApiClient();
  const [data, setData] = useState<T>();
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(true);
  const activeRef = useRef<AbortController | undefined>(undefined);
  const reload = useCallback(
    async (signal?: AbortSignal) => {
      activeRef.current?.abort();
      const controller = new AbortController();
      activeRef.current = controller;
      const combined = signal
        ? AbortSignal.any([signal, controller.signal])
        : controller.signal;
      setLoading(true);
      setError(undefined);
      try {
        const value = await api.request<T>({ path, signal: combined });
        if (!combined.aborted) setData(value);
      } catch (failure) {
        if (!combined.aborted) {
          setError(failure);
          if (
            failure instanceof ApiClientError &&
            [401, 403, 404].includes(failure.status)
          )
            setData(undefined);
        }
      } finally {
        if (!combined.aborted) setLoading(false);
      }
    },
    [api, path],
  );
  useEffect(() => {
    let disposed = false;
    queueMicrotask(() => {
      if (!disposed) void reload();
    });
    return () => {
      disposed = true;
      activeRef.current?.abort();
    };
  }, [reload]);
  useRealtimeRefresh(topic, reload);
  const acceptData = useCallback(
    (value: T | ((previous: T | undefined) => T | undefined)) => {
      activeRef.current?.abort();
      setData(value);
      setError(undefined);
      setLoading(false);
    },
    [],
  );
  const fail = useCallback((failure: unknown) => {
    activeRef.current?.abort();
    setData(undefined);
    setError(failure);
    setLoading(false);
  }, []);
  return { data, error, loading, reload, setData: acceptData, fail };
}
