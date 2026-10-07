/**
 * Data access for the pages: requests to `/api/releases` through the application's API client, the signed-in user's
 * permissions (`GET releases/me`), and a small loader hook that keeps the latest answer and its error.
 */
import { useApiClient } from '@nocobase/app-client';
import { useCallback, useEffect, useEffectEvent, useState } from 'react';

import {
  noPermissions,
  type ReleasesPermissions,
} from '../../shared/access.js';
import type { ActorKind } from '../../shared/releases.js';

export interface Me {
  readonly userId: string | null;
  readonly kind: ActorKind;
  readonly permissions: ReleasesPermissions;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type Query = Record<string, string | number | boolean | undefined>;

/** A list answer: its items, and what `meta` says about them (`total`, and `page`/`pageSize` when it pages). */
export interface ListResult<T> {
  readonly items: readonly T[];
  readonly meta: {
    readonly total?: number;
    readonly page?: number;
    readonly pageSize?: number;
  } & Readonly<Record<string, unknown>>;
}

export interface ReleasesApi {
  get<T>(path: string, query?: Query): Promise<T>;
  list<T>(path: string, query?: Query): Promise<ListResult<T>>;
  /** Sends `json` when given; an answer without a body (204) resolves to undefined. */
  send<T>(
    method: Method,
    path: string,
    json?: unknown,
    query?: Record<string, string | undefined>,
  ): Promise<T>;
  upload<T>(
    path: string,
    file: Blob,
    headers?: Record<string, string>,
  ): Promise<T>;
}

export function useReleasesApi(): ReleasesApi {
  const client = useApiClient();
  return {
    async get<T>(path: string, query?: Query) {
      const response = await client.request<{ data: T }>({
        path: `releases/${path}`,
        query,
      });
      return response.data;
    },
    async list<T>(path: string, query?: Query) {
      const response = await client.request<{
        data: readonly T[];
        meta: ListResult<T>['meta'];
      }>({ path: `releases/${path}`, query });
      return { items: response.data, meta: response.meta };
    },
    async send<T>(
      method: Method,
      path: string,
      json?: unknown,
      query?: Record<string, string | undefined>,
    ) {
      const response = await client.request<{ data: T } | undefined>({
        path: `releases/${path}`,
        method,
        query,
        ...(json === undefined ? {} : { json }),
      });
      return response?.data as T;
    },
    async upload<T>(
      path: string,
      file: Blob,
      headers: Record<string, string> = {},
    ) {
      const response = await client.request<{ data: T }>({
        path: `releases/${path}`,
        method: 'POST',
        headers: { 'content-type': 'application/gzip', ...headers },
        body: file,
      });
      return response.data;
    },
  };
}

export interface Loaded<T> {
  readonly data: T | undefined;
  /** The last failure, worded by `lib/errors.ts` where it is shown. */
  readonly error: unknown;
  readonly loading: boolean;
  readonly reload: () => void;
}

/**
 * Loads with `load`, again whenever `key` changes or `reload` is called; answers for an older key are dropped. A reload
 * keeps the previous answer on screen until the new one arrives.
 */
export function useLoad<T>(load: () => Promise<T>, key: string): Loaded<T> {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<{
    readonly token: string;
    readonly data?: T;
    readonly error?: unknown;
  }>({ token: '' });
  const fetchLatest = useEffectEvent(() => load());
  const token = `${key}#${tick}`;
  useEffect(() => {
    let active = true;
    fetchLatest().then(
      (data) => {
        if (active) setState({ token, data });
      },
      (reason: unknown) => {
        if (active)
          setState((previous) => ({
            token,
            data: previous.data,
            error: reason ?? new Error('Request failed.'),
          }));
      },
    );
    return () => {
      active = false;
    };
  }, [token]);
  const reload = useCallback(() => setTick((value) => value + 1), []);
  return {
    data: state.data,
    error: state.error,
    loading: state.token !== token,
    reload,
  };
}

/** The signed-in user's permissions; nothing until they are known. */
export function useMe(): Me {
  const api = useReleasesApi();
  const { data } = useLoad(() => api.get<Me>('me'), 'me');
  return data ?? { userId: null, kind: 'human', permissions: noPermissions() };
}
