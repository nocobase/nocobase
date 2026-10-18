import { ApiClientError } from '@nocobase/api-client';

export interface RealtimeRefreshSnapshot {
  readonly status:
    'idle' | 'pending' | 'refreshing' | 'retrying' | 'failed' | 'closed';
  readonly stale: boolean;
  readonly failures: number;
  readonly error?: unknown;
  readonly lastSuccessfulRefresh?: number;
}
export interface RealtimeRefreshOptions {
  readonly delayMs?: number;
  readonly retries?: number;
  readonly retryDelayMs?: number;
  readonly retryMaxDelayMs?: number;
  readonly shouldRetry?: (error: unknown) => boolean;
  readonly onError?: (error: unknown) => void;
  readonly onStateChange?: (snapshot: RealtimeRefreshSnapshot) => void;
}
export interface RealtimeRefresh {
  readonly snapshot: RealtimeRefreshSnapshot;
  request(this: void): void;
  retry(this: void): void;
  close(this: void): void;
}
export const idleRealtimeRefresh: RealtimeRefreshSnapshot = {
  status: 'idle',
  stale: false,
  failures: 0,
};

/** Coalesces events, preserves trailing reads and retries transient failures without another event. */
export function createRealtimeRefresh(
  refresh: (signal: AbortSignal) => void | Promise<unknown>,
  options: RealtimeRefreshOptions = {},
): RealtimeRefresh {
  let dirty = false;
  let running = false;
  let closed = false;
  let blocked = false;
  let retryAt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let snapshot = idleRealtimeRefresh;
  const controller = new AbortController();
  const visible = () =>
    typeof document === 'undefined' || document.visibilityState !== 'hidden';
  const retryable = options.shouldRetry ?? isTransientRefreshError;
  const update = (next: Partial<RealtimeRefreshSnapshot>): void => {
    snapshot = { ...snapshot, ...next };
    notify(() => options.onStateChange?.(snapshot));
  };
  const schedule = (): void => {
    if (
      closed ||
      running ||
      timer !== undefined ||
      !dirty ||
      blocked ||
      !visible()
    )
      return;
    timer = setTimeout(
      () => {
        timer = undefined;
        if (closed || !visible()) return;
        dirty = false;
        running = true;
        update({ status: 'refreshing', stale: true });
        void Promise.resolve()
          .then(() => {
            if (!closed) return refresh(controller.signal);
          })
          .then(() => {
            if (closed) return;
            retryAt = 0;
            update({
              status: dirty ? 'pending' : 'idle',
              stale: dirty,
              failures: 0,
              error: undefined,
              lastSuccessfulRefresh: Date.now(),
            });
          })
          .catch((error: unknown) => {
            if (closed) return;
            dirty = true;
            const failures = snapshot.failures + 1;
            blocked = failures > (options.retries ?? 3) || !retryable(error);
            const ceiling = Math.min(
              options.retryMaxDelayMs ?? 30_000,
              (options.retryDelayMs ?? 1_000) * 2 ** Math.min(failures - 1, 20),
            );
            retryAt =
              Date.now() +
              Math.max(1, Math.floor(ceiling * (0.5 + Math.random() * 0.5)));
            update({
              status: blocked ? 'failed' : 'retrying',
              stale: true,
              failures,
              error,
            });
            notify(() => {
              if (options.onError) options.onError(error);
              else console.error('Realtime refresh failed.', error);
            });
          })
          .finally(() => {
            running = false;
            schedule();
          });
      },
      Math.max(options.delayMs ?? 100, retryAt - Date.now()),
    );
  };
  const request = (): void => {
    if (closed) return;
    dirty = true;
    update({
      stale: true,
      status: snapshot.status === 'idle' ? 'pending' : snapshot.status,
    });
    schedule();
  };
  const retry = (): void => {
    if (closed) return;
    blocked = false;
    retryAt = 0;
    clearTimeout(timer);
    timer = undefined;
    update({
      failures: 0,
      error: undefined,
      status: running ? 'refreshing' : 'pending',
    });
    request();
  };
  const wake = (): void => {
    if (!visible()) return;
    if (blocked && retryable(snapshot.error)) retry();
    else request();
  };
  if (typeof document !== 'undefined')
    document.addEventListener('visibilitychange', wake);
  if (typeof window !== 'undefined') window.addEventListener('online', wake);
  return {
    get snapshot() {
      return snapshot;
    },
    request,
    retry,
    close() {
      if (closed) return;
      closed = true;
      clearTimeout(timer);
      controller.abort();
      if (typeof document !== 'undefined')
        document.removeEventListener('visibilitychange', wake);
      if (typeof window !== 'undefined')
        window.removeEventListener('online', wake);
      update({ status: 'closed' });
    },
  };
}
export function isTransientRefreshError(error: unknown): boolean {
  return (
    !(error instanceof ApiClientError) ||
    error.status < 400 ||
    error.status >= 500 ||
    error.status === 408 ||
    error.status === 429
  );
}
function notify(callback: () => void): void {
  try {
    callback();
  } catch (error) {
    console.error('Realtime refresh listener failed.', error);
  }
}
