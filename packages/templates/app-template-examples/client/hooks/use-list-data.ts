import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** A successful result belongs to one query and refresh generation only. */
export function useListData<T>(
  path: string,
  options: boolean | { keepPreviousData?: boolean; active?: boolean } = false,
) {
  const { keepPreviousData = false, active = true } =
    typeof options === 'boolean' ? { keepPreviousData: options } : options;
  const api = useApiClient();
  const [revision, setRevision] = useState(0);
  const key = useMemo(
    () => ({ path, revision, active }),
    [path, revision, active],
  );
  const generationRef = useRef(0);
  const controllerRef = useRef<AbortController | undefined>(undefined);
  const [result, setResult] = useState<{
    path: string;
    key?: typeof key;
    data?: T;
    error?: unknown;
  }>({ path });
  useEffect(() => {
    if (!active) return;
    const request = new AbortController();
    controllerRef.current = request;
    const ticket = generationRef.current;
    void api.request<T>({ path, signal: request.signal }).then(
      (data) => {
        if (!request.signal.aborted && ticket === generationRef.current)
          setResult({ path, key, data });
      },
      (error: unknown) => {
        if (request.signal.aborted || ticket !== generationRef.current) return;
        setResult((old) => ({
          ...(old.path === path &&
          !(
            error instanceof ApiClientError &&
            [401, 403, 404].includes(error.status)
          )
            ? old
            : {}),
          path,
          key,
          error,
        }));
      },
    );
    return () => request.abort();
  }, [api, path, key, active]);
  const invalidate = useCallback(() => {
    // Invalidate synchronously, before React commits the next request effect.
    generationRef.current += 1;
    controllerRef.current?.abort();
  }, []);
  return {
    path: result.path,
    data: result.path === path || keepPreviousData ? result.data : undefined,
    loading: !active || result.path !== path || result.key !== key,
    error:
      result.path === path && result.key === key ? result.error : undefined,
    revision,
    reload: useCallback(() => {
      invalidate();
      setRevision((value) => value + 1);
    }, [invalidate]),
    replaceData: useCallback(
      (data: T) => {
        invalidate();
        setResult({ path, key, data });
      },
      [path, key, invalidate],
    ),
  };
}
