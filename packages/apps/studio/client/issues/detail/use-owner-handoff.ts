/** An issue's owner handoff as the viewer sees it (`GET /api/issueOwnerHandoffs/:issueId`), shared by its cards. */
import { useApiClient } from '@nocobase/app-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

export const ownerHandoffKey = (issueId: string) =>
  ['studio', 'ownerHandoff', issueId] as const;

export interface HandoffView {
  readonly handoff: {
    readonly waiting: boolean;
    readonly notificationKey: string;
    readonly rejectedAt: string | null;
    readonly ownerUserId: string;
  } | null;
  readonly canDecide: boolean;
  readonly canClaim: boolean;
}

export function useOwnerHandoffView(
  issueId: string,
): UseQueryResult<HandoffView> {
  const api = useApiClient();
  return useQuery({
    queryKey: ownerHandoffKey(issueId),
    queryFn: async () =>
      (
        await api.request<{ data: HandoffView }>({
          path: `issueOwnerHandoffs/${encodeURIComponent(issueId)}`,
        })
      ).data,
    refetchInterval: 15_000,
  });
}

/** The viewer has a handoff to decide on: take it over or reject it, or claim one that was rejected. */
export function handoffWaitsOn(view: HandoffView | undefined): boolean {
  const handoff = view?.handoff;
  if (!view || !handoff?.waiting) return false;
  return handoff.rejectedAt ? view.canClaim : view.canDecide;
}
