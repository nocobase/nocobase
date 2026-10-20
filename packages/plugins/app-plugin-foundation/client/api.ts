import {
  ApiClientError,
  useApiClient,
  type ApiClient,
} from '@nocobase/app-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import {
  FOUNDATION_NAMESPACE,
  type FoundationOverview,
} from '../shared/foundation.js';

/** Reads the overview. Every call is a GET; the plugin writes nothing. */
export async function fetchFoundationOverview(
  api: ApiClient,
  options: { readonly refresh?: boolean } = {},
): Promise<FoundationOverview> {
  const { data } = await api.request<{ readonly data: FoundationOverview }>({
    path: `${FOUNDATION_NAMESPACE}/overview`,
    query: options.refresh ? { refresh: 'true' } : {},
  });
  return data;
}

export const FOUNDATION_OVERVIEW_QUERY_KEY = [
  'foundation',
  'overview',
] as const;

export type FoundationLoadError = 'forbidden' | 'failed';

export interface FoundationOverviewState {
  readonly overview?: FoundationOverview;
  readonly error?: FoundationLoadError;
  readonly loading: boolean;
  /** Collects again on the server, bypassing its cache. */
  readonly refresh: () => void;
}

export function useFoundationOverview(): FoundationOverviewState {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: FOUNDATION_OVERVIEW_QUERY_KEY,
    queryFn: () => fetchFoundationOverview(api),
    // A refused or failed overview is answered as it is; the page offers its own retry.
    retry: false,
    refetchOnWindowFocus: false,
  });
  const refresh = useCallback(() => {
    void queryClient
      .fetchQuery({
        queryKey: FOUNDATION_OVERVIEW_QUERY_KEY,
        queryFn: () => fetchFoundationOverview(api, { refresh: true }),
        staleTime: 0,
      })
      .catch(() => undefined);
  }, [api, queryClient]);
  const error: FoundationLoadError | undefined =
    query.error === null
      ? undefined
      : query.error instanceof ApiClientError &&
          (query.error.status === 401 || query.error.status === 403)
        ? 'forbidden'
        : 'failed';
  return {
    ...(query.data === undefined || error === 'forbidden'
      ? {}
      : { overview: query.data }),
    ...(error === undefined ? {} : { error }),
    loading: query.isFetching,
    refresh,
  };
}
