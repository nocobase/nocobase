/**
 * An issue's design proposal in the browser (`/api/designProposals/:issueId`, `shared/design.ts`): its state, and the two
 * decisions. Queries are under `studio.design`; a decision refreshes the issue, the design state and the inbox.
 */
import { useApiClient } from '@nocobase/app-client';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { DesignState } from '../../../shared/design.js';
import { inboxKeys } from '@nocobase/app-plugin-notification-in-app/client/inbox';

export const designKeys = {
  all: ['studio', 'design'] as const,
  state: (issueId: string, revision?: number) =>
    ['studio', 'design', issueId, revision ?? null] as const,
};

export type DesignDecision = 'approve' | 'requestChanges';

const path = (issueId: string) =>
  `designProposals/${encodeURIComponent(issueId)}`;

/** The issue's design state; `revision` refetches it whenever the issue changes. */
export function useDesignState(
  issueId: string | null,
  revision?: number,
): UseQueryResult<DesignState> {
  const api = useApiClient();
  return useQuery({
    queryKey: designKeys.state(issueId ?? '', revision),
    queryFn: async () =>
      (
        await api.request<{ readonly data: DesignState }>({
          path: path(issueId ?? ''),
        })
      ).data,
    enabled: issueId !== null,
    retry: false,
  });
}

export function useDesignDecision(
  issueId: string,
): UseMutationResult<
  DesignState,
  Error,
  { readonly decision: DesignDecision; readonly comment: string }
> {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ decision, comment }) =>
      (
        await api.request<{ readonly data: DesignState }>({
          path: `${path(issueId)}/${decision}`,
          method: 'POST',
          json: comment ? { comment } : {},
        })
      ).data,
    onSettled: () => {
      for (const queryKey of [
        designKeys.all,
        inboxKeys.all,
        ['pm', 'issue'],
        ['pm', 'issues'],
      ])
        void queryClient.invalidateQueries({ queryKey });
    },
  });
}
