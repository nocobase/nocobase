import {
  ApiClientError,
  useApiClient,
  type ApiClient,
} from '@nocobase/app-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import {
  FOUNDATION_NAMESPACE,
  type FoundationOverview,
  type FoundationSnapshot,
  type FoundationScanStatus,
} from '../shared/foundation.js';

export async function fetchFoundationOverview(
  api: ApiClient,
): Promise<FoundationSnapshot> {
  const { data } = await api.request<{ readonly data: FoundationSnapshot }>({
    path: `${FOUNDATION_NAMESPACE}/overview`,
  });
  return data;
}

export const FOUNDATION_OVERVIEW_QUERY_KEY = [
  'foundation',
  'overview',
] as const;
const STATUS_KEY = ['foundation', 'scanStatus'] as const;
const active = (status?: FoundationScanStatus) =>
  status?.status === 'queued' || status?.status === 'running';
export type FoundationLoadError = 'forbidden' | 'failed';

export interface FoundationOverviewState {
  readonly overview?: FoundationOverview;
  readonly scan?: FoundationScanStatus;
  readonly error?: FoundationLoadError;
  readonly loading: boolean;
  readonly refresh: () => void;
  readonly countRecords: () => void;
}

export function useFoundationOverview(): FoundationOverviewState {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: FOUNDATION_OVERVIEW_QUERY_KEY,
    queryFn: () => fetchFoundationOverview(api),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
  });
  const submit = useMutation({
    mutationFn: async (action: 'ensureScan' | 'refresh' | 'countRecords') => {
      const { data } = await api.request<{
        readonly data: FoundationScanStatus;
      }>({ method: 'POST', path: `${FOUNDATION_NAMESPACE}/${action}` });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<FoundationSnapshot>(
        FOUNDATION_OVERVIEW_QUERY_KEY,
        (previous) => ({ ...previous, ...data }),
      );
      queryClient.removeQueries({ queryKey: STATUS_KEY });
      if (!active(data))
        void queryClient.invalidateQueries({
          queryKey: FOUNDATION_OVERVIEW_QUERY_KEY,
        });
    },
  });
  const { mutate } = submit;
  useEffect(() => {
    if (query.data?.needsScan && !query.isFetching) mutate('ensureScan');
  }, [query.data?.needsScan, query.isFetching, mutate]);

  const status = useQuery({
    queryKey: [...STATUS_KEY, query.data?.generation],
    queryFn: async () =>
      (
        await api.request<{ readonly data: FoundationScanStatus }>({
          path: `${FOUNDATION_NAMESPACE}/scanStatus`,
        })
      ).data,
    enabled: active(query.data),
    refetchInterval: (state) =>
      active(state.state.data ?? query.data) ? 2000 : false,
    retry: false,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (active(query.data) && status.data && !active(status.data)) {
      void queryClient.invalidateQueries({
        queryKey: FOUNDATION_OVERVIEW_QUERY_KEY,
      });
    }
  }, [query.data, status.data, queryClient]);

  const refresh = useCallback(() => mutate('refresh'), [mutate]);
  const countRecords = useCallback(() => mutate('countRecords'), [mutate]);
  const failures = [query.error, status.error, submit.error];
  const forbidden = failures.some(
    (failure) =>
      failure instanceof ApiClientError &&
      (failure.status === 401 || failure.status === 403),
  );
  const error: FoundationLoadError | undefined = forbidden
    ? 'forbidden'
    : failures.some(Boolean)
      ? 'failed'
      : query.data?.status === 'failed'
        ? 'failed'
        : undefined;
  useEffect(() => {
    if (error === 'forbidden') {
      queryClient.removeQueries({ queryKey: FOUNDATION_OVERVIEW_QUERY_KEY });
      queryClient.removeQueries({ queryKey: STATUS_KEY });
    }
  }, [error, queryClient]);
  return {
    ...(query.data?.overview && error !== 'forbidden'
      ? { overview: query.data.overview }
      : {}),
    ...(query.data && error !== 'forbidden' ? { scan: query.data } : {}),
    ...(error ? { error } : {}),
    loading: query.isFetching || submit.isPending || active(query.data),
    refresh,
    countRecords,
  };
}
