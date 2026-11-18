import { ApiClientError } from '@nocobase/app-client';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

export type ReadState<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly error: unknown }
  | { readonly status: 'ready'; readonly data: T };

/**
 * Reads what `key` names and returns only a result that belongs to it.
 *
 * Each result is stored with the key it was read for, so after a switch the
 * previous selection's data, error or late response is never shown under the
 * new one: until the new read settles the state is `loading`.
 */
export function useRead<T>(
  key: string | null,
  load: () => Promise<T>,
): ReadState<T> & { readonly reload: () => void } {
  const [attempt, setAttempt] = useState(0);
  // The read restarts only when `key` or the attempt changes; the latest loader is read when it does.
  const loadRef = useRef(load);
  useLayoutEffect(() => {
    loadRef.current = load;
  });
  const [result, setResult] = useState<{
    readonly key: string;
    readonly attempt: number;
    readonly state: ReadState<T>;
  }>();
  useEffect(() => {
    if (key === null) return;
    let active = true;
    loadRef.current().then(
      (data) => {
        if (active)
          setResult({ key, attempt, state: { status: 'ready', data } });
      },
      (error: unknown) => {
        if (active)
          setResult({ key, attempt, state: { status: 'error', error } });
      },
    );
    return () => {
      active = false;
    };
  }, [key, attempt]);
  const reload = useCallback(() => setAttempt((value) => value + 1), []);
  const state: ReadState<T> =
    result && result.key === key && result.attempt === attempt
      ? result.state
      : { status: 'loading' };
  return { ...state, reload };
}

export type Failure =
  | 'unauthenticated'
  | 'forbidden'
  | 'connectionNotFound'
  | 'tableNotFound'
  | 'unavailable'
  | 'failed';

/** Maps a failed read to what the person can do about it, using the API's stable reasons rather than its message. */
export function describeFailure(error: unknown): Failure {
  if (!(error instanceof ApiClientError)) return 'failed';
  if (error.status === 401) return 'unauthenticated';
  if (error.status === 403) return 'forbidden';
  if (error.reason === 'CONNECTION_NOT_FOUND') return 'connectionNotFound';
  if (error.reason === 'COLLECTION_NOT_FOUND') return 'tableNotFound';
  if (
    error.reason === 'CONNECTION_UNAVAILABLE' ||
    error.reason === 'CONNECTION_UNREACHABLE' ||
    error.reason === 'DATABASE_UNAVAILABLE'
  )
    return 'unavailable';
  return 'failed';
}

/** Whether trying the same read again can help. */
export function canRetry(failure: Failure): boolean {
  return failure === 'unavailable' || failure === 'failed';
}

/** Whether a media query matches, following changes; true where the environment cannot evaluate one. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== 'function') return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () =>
      typeof window.matchMedia === 'function'
        ? window.matchMedia(query).matches
        : true,
  );
}
