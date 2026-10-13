/**
 * "My follow-ups" in the browser (`/api/followUps`, `server/follow-ups/routes.ts`). The overview's key is under the
 * projects plugin's issues, so every issue change the server announces reads it again; it also reads again every
 * `OVERVIEW_POLL_MS`, as what an issue waits for moves with runs and checks too.
 */
import { useApiClient } from '@nocobase/app-client';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useCallback } from 'react';

import type { FollowingView, FollowUpsView } from '../../shared/follow-ups.js';
import { followUpsKeys } from './model.js';

const OVERVIEW_POLL_MS = 30_000;

export function useFollowUps(): UseQueryResult<FollowUpsView> {
  const api = useApiClient();
  return useQuery({
    queryKey: followUpsKeys.overview,
    queryFn: async ({ signal }) =>
      (
        await api.request<{ data: FollowUpsView }>({
          path: 'followUps',
          signal,
        })
      ).data,
    placeholderData: (previous) => previous,
    refetchInterval: OVERVIEW_POLL_MS,
  });
}

/**
 * Follows or stops following one issue (`POST followUps/issues/:issueId/follow|unfollow`), shown at once and read back
 * from the server once saved; the server keeps the limit, so two tabs cannot overwrite each other's list.
 */
export function useFollowIssue(
  onError: (error: unknown) => void,
): UseMutationResult<
  FollowingView,
  unknown,
  { readonly issueId: string; readonly follow: boolean },
  { previous?: FollowUpsView }
> {
  const api = useApiClient();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ issueId, follow }) =>
      (
        await api.request<{ data: FollowingView }>({
          method: 'POST',
          path: `followUps/issues/${encodeURIComponent(issueId)}/${follow ? 'follow' : 'unfollow'}`,
        })
      ).data,
    onMutate: async ({ issueId, follow }) => {
      await client.cancelQueries({ queryKey: followUpsKeys.overview });
      const previous = client.getQueryData<FollowUpsView>(
        followUpsKeys.overview,
      );
      if (previous) {
        const following = follow
          ? previous.following.includes(issueId)
            ? previous.following
            : [...previous.following, issueId]
          : previous.following.filter((id) => id !== issueId);
        client.setQueryData<FollowUpsView>(followUpsKeys.overview, {
          ...previous,
          following,
          followingStored: true,
          issues: previous.issues.map((issue) =>
            issue.id === issueId ? { ...issue, followed: follow } : issue,
          ),
        });
      }
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous)
        client.setQueryData(followUpsKeys.overview, context.previous);
      onError(error);
    },
    onSettled: () =>
      client.invalidateQueries({ queryKey: followUpsKeys.overview }),
  });
}

/** Records that the viewer looked at an issue now, then reads the unread counts again. */
export function useMarkSeen(): (issueId: string) => void {
  const api = useApiClient();
  const client = useQueryClient();
  return useCallback(
    (issueId: string) => {
      api
        .request({
          method: 'POST',
          path: `followUps/issues/${encodeURIComponent(issueId)}/markSeen`,
        })
        .then(
          () => client.invalidateQueries({ queryKey: followUpsKeys.overview }),
          // Only the unread count is lost; the next look records it again.
          () => undefined,
        );
    },
    [api, client],
  );
}
