import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ApiClientError,
  realtimeClientToken,
  useApiClient,
  useService,
  useToaster,
  type RealtimeSubscription,
  type RealtimeSubscriptionState,
  type RealtimeWatchOptions,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';

export function errorKey(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 401) return 'errors.session';
    if (error.status === 403) return 'errors.forbidden';
    if (error.status === 404) return 'errors.expired';
    if (error.status === 429) return 'errors.capacity';
  }
  return 'errors.request';
}

export interface DemoTask {
  readonly pending: boolean;
  readonly error: unknown;
  run(
    operation: (signal: AbortSignal) => Promise<void>,
    successKey?: string | false,
  ): Promise<boolean>;
}

export function useDemoTask(
  getErrorKey: (error: unknown) => string = errorKey,
): DemoTask {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();
  const activeRef = useRef<AbortController | undefined>(undefined);
  const toast = useToaster();
  const { t } = useTranslation();
  useEffect(
    () => () => {
      activeRef.current?.abort();
    },
    [],
  );
  return {
    pending,
    error,
    async run(operation, successKey = 'published') {
      if (activeRef.current && !activeRef.current.signal.aborted) return false;
      const controller = new AbortController();
      activeRef.current = controller;
      setPending(true);
      setError(undefined);
      try {
        await operation(controller.signal);
        if (controller.signal.aborted) return false;
        if (successKey) toast.show({ type: 'success', title: t(successKey) });
        return true;
      } catch (failure) {
        if (!controller.signal.aborted) {
          setError(failure);
          toast.show({ type: 'error', title: t(getErrorKey(failure)) });
        }
        return false;
      } finally {
        if (!controller.signal.aborted) setPending(false);
        if (activeRef.current === controller) activeRef.current = undefined;
      }
    },
  };
}

export interface DemoSnapshot<T> {
  readonly data: T | undefined;
  readonly error: unknown;
  readonly loading: boolean;
  readonly reads: number;
  readonly readAt: string | undefined;
  reload(this: void, signal?: AbortSignal): Promise<void>;
  clear(this: void): void;
}

/** The generation check prevents a pre-revocation read from restoring protected content. */
export function useDemoSnapshot<T>(path: string): DemoSnapshot<T> {
  const api = useApiClient();
  const toast = useToaster();
  const { t } = useTranslation();
  const [data, setData] = useState<T>();
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(false);
  const [reads, setReads] = useState(0);
  const [readAt, setReadAt] = useState<string>();
  const generationRef = useRef(0);
  const controllerRef = useRef<AbortController | undefined>(undefined);
  const cancel = useCallback(() => {
    generationRef.current++;
    controllerRef.current?.abort();
  }, []);
  useEffect(() => cancel, [cancel, path]);
  const reload = useCallback(
    async (signal?: AbortSignal) => {
      cancel();
      if (signal?.aborted) return;
      const current = generationRef.current;
      const request = new AbortController();
      controllerRef.current = request;
      const requestSignal = signal
        ? AbortSignal.any([signal, request.signal])
        : request.signal;
      setLoading(true);
      setError(undefined);
      try {
        const response = await api.request<{ data: T }>({
          path,
          signal: requestSignal,
        });
        if (current !== generationRef.current || requestSignal.aborted) return;
        setData(response.data);
        setReads((value) => value + 1);
        setReadAt(new Date().toLocaleTimeString());
      } catch (failure) {
        if (current !== generationRef.current || requestSignal.aborted) return;
        setError(failure);
        if (
          failure instanceof ApiClientError &&
          [401, 403, 404].includes(failure.status)
        )
          setData(undefined);
        toast.show({
          id: `realtime-demo:${path}`,
          type: 'error',
          title: t(errorKey(failure)),
        });
        // Scheduled refreshes must observe failure; direct UI reloads keep their feedback contract.
        if (signal) throw failure;
      } finally {
        if (current === generationRef.current && !requestSignal.aborted)
          setLoading(false);
      }
    },
    [api, cancel, path, t, toast],
  );
  const clear = useCallback(() => {
    cancel();
    setData(undefined);
    setLoading(false);
    setError(undefined);
  }, [cancel]);
  return { data, error, loading, reads, readAt, reload, clear };
}

export interface DemoWatch {
  readonly state: RealtimeSubscriptionState;
  readonly error: string | undefined;
  readonly events: number;
  readonly ready: number;
  retry(this: void): void;
}

/** Own a watch when the example needs its retry handle; application views can normally use useRealtimeTopic. */
export function useDemoWatch<Payload>(
  topic: string | null,
  options: RealtimeWatchOptions<Payload> = {},
): DemoWatch {
  const realtime = useService(realtimeClientToken);
  const callbacksRef = useRef(options);
  useEffect(() => {
    callbacksRef.current = options;
  });
  const handleRef = useRef<RealtimeSubscription | undefined>(undefined);
  const [state, setState] = useState<RealtimeSubscriptionState>('pending');
  const [error, setError] = useState<string>();
  const [events, setEvents] = useState(0);
  const [ready, setReady] = useState(0);
  useEffect(() => {
    if (!topic) return;
    const watch = realtime.watch<Payload>(topic, {
      onStateChange: (value) => {
        setState(value);
        callbacksRef.current.onStateChange?.(value);
        if (value !== 'error') setError(undefined);
      },
      onError: (failure) => {
        setError(failure.code);
        callbacksRef.current.onError?.(failure);
      },
      onEvent: (event) => {
        setEvents((value) => value + 1);
        callbacksRef.current.onEvent?.(event);
      },
      onReady: () => {
        setReady((value) => value + 1);
        callbacksRef.current.onReady?.();
      },
    });
    handleRef.current = watch;
    queueMicrotask(() => {
      if (handleRef.current === watch) setState(watch.state);
    });
    return () => {
      handleRef.current = undefined;
      watch.close();
    };
  }, [realtime, topic]);
  return {
    state: topic ? state : 'closed',
    error: topic ? error : undefined,
    events,
    ready,
    retry: () => handleRef.current?.retry(),
  };
}
