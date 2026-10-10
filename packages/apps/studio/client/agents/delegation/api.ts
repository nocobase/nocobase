/**
 * The issues a conversation delegated, in the browser (`/api/delegations`, `shared/delegations.ts`): one delegation, and
 * stopping or resuming following it. Queries are under `studio.delegations`.
 */
import { useApiClient } from '@nocobase/app-client';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { Delegation } from '../../../shared/delegations.js';

export const delegationKeys = {
  all: ['studio', 'delegations'] as const,
  one: (id: string) => ['studio', 'delegations', id] as const,
};

const path = (id: string) => `delegations/${encodeURIComponent(id)}`;

export function useDelegation(id: string): UseQueryResult<Delegation> {
  const api = useApiClient();
  return useQuery({
    queryKey: delegationKeys.one(id),
    queryFn: async () =>
      (await api.request<{ readonly data: Delegation }>({ path: path(id) }))
        .data,
    retry: false,
    staleTime: 30_000,
  });
}

export function useFollowDelegation(
  id: string,
): UseMutationResult<Delegation, Error, boolean> {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (followed) =>
      (
        await api.request<{ readonly data: Delegation }>({
          path: path(id),
          method: 'PATCH',
          json: { followed },
        })
      ).data,
    onSuccess: (delegation) => {
      queryClient.setQueryData(delegationKeys.one(id), delegation);
    },
  });
}
