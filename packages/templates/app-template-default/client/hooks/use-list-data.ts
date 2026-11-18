import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useDataChange,
  type DataChange,
  type DataScope,
} from './use-data-changes.js';

export interface ListDataOptions<T> {
  keepPreviousData?: boolean;
  /** A covered view keeps its data, defers reads and reads again on return. */
  active?: boolean;
  /**
   * What this view reads. An announced change overlapping one of them updates
   * it: a view declaring exactly one scope takes that scope's confirmed result
   * without a request; every other affected view reads again, now when
   * active, otherwise on return.
   */
  scopes?: readonly DataScope[];
  /**
   * Applies a change's confirmed results to the shown data before the
   * verification read, such as adding a created row or dropping a deleted one.
   * Return `undefined` to keep the data until that read.
   */
  merge?: (current: T, change: DataChange) => T | undefined;
}

/** What a view reading a record shows once a confirmed write removed it. */
function removedError(path: string): ApiClientError {
  return new ApiClientError('The record no longer exists.', {
    status: 404,
    reason: 'RECORD_REMOVED',
    method: 'GET',
    url: path,
  });
}

/** A successful result belongs to one query and refresh generation only. */
export function useListData<T>(
  path: string,
  options: boolean | ListDataOptions<T> = false,
) {
  const {
    keepPreviousData = false,
    active = true,
    scopes,
    merge,
  } = typeof options === 'boolean' ? { keepPreviousData: options } : options;
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
  const reload = useCallback(() => {
    invalidate();
    setRevision((value) => value + 1);
  }, [invalidate]);
  const replaceData = useCallback(
    (data: T) => {
      invalidate();
      setResult({ path, key, data });
    },
    [path, key, invalidate],
  );
  useDataChange(scopes, (change) => {
    const exact =
      scopes?.length === 1 ? change.results?.[scopes[0]] : undefined;
    if (exact !== undefined) {
      // The confirmed server outcome is newer than any read in flight.
      if (exact !== null) replaceData(exact as T);
      else {
        // The record is gone: drop its data now rather than waiting for a
        // read, so neither a slow read nor a failed one can show it again.
        invalidate();
        setResult({ path, key, error: removedError(path) });
      }
      return;
    }
    if (merge) {
      invalidate();
      // Merge into the latest state so changes announced together accumulate.
      setResult((old) => {
        const current = old.path === path && !old.error ? old.data : undefined;
        const merged =
          current === undefined ? undefined : merge(current, change);
        return merged === undefined ? old : { ...old, data: merged };
      });
    }
    reload();
  });
  return {
    path: result.path,
    data: result.path === path || keepPreviousData ? result.data : undefined,
    loading: !active || result.path !== path || result.key !== key,
    error: result.path === path ? result.error : undefined,
    revision,
    reload,
    replaceData,
  };
}
