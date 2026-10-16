/**
 * What the viewer follows, in the browser (`/api/followUps/following`, `follow`, `unfollow` and `markSeen`,
 * `server/follow-ups/routes.ts`): the follow star's read and change, and the task lists' follow group, whose unread
 * counts drop as a task is looked at.
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

import type {
  FollowingState,
  FollowingView,
} from '../../../shared/follow-ups.js';
import type { TaskGroups } from '../../../shared/task-groups.js';
import { taskGroupKeys } from '../groups/api.js';

const FOLLOWING_POLL_MS = 60_000;

export const followingKeys = {
  /** What the viewer follows: the follow star's read. */
  following: ['studio', 'following'] as const,
};

/**
 * What the viewer follows (`GET followUps/following`), the follow star's read. It changes only when they follow or
 * unfollow, or an issue they follow leaves their sight, so it is read again then and for an announcement naming no
 * issues. `enabled: false` where the page has it already (the task lists' `following`).
 */
export function useFollowing(enabled = true): UseQueryResult<FollowingState> {
  const api = useApiClient();
  return useQuery({
    queryKey: followingKeys.following,
    enabled,
    queryFn: async ({ signal }) =>
      (
        await api.request<{ data: FollowingState }>({
          path: 'followUps/following',
          signal,
        })
      ).data,
    placeholderData: (previous) => previous,
    refetchInterval: FOLLOWING_POLL_MS,
  });
}

/**
 * Follows or stops following one issue (`POST followUps/issues/:issueId/follow|unfollow`), shown at once and read back
 * from the server once saved; the server keeps the list, so two tabs cannot overwrite each other's.
 */
export function useFollowIssue(
  onError: (error: unknown) => void,
): UseMutationResult<
  FollowingView,
  unknown,
  { readonly issueId: string; readonly follow: boolean },
  { previousFollowing?: FollowingState }
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
      await client.cancelQueries({ queryKey: followingKeys.following });
      const previousFollowing = client.getQueryData<FollowingState>(
        followingKeys.following,
      );
      if (previousFollowing)
        client.setQueryData<FollowingState>(followingKeys.following, {
          ...previousFollowing,
          // Following starts from what the viewer chose, never from the default list; unfollowing keeps the rest.
          issueIds: follow
            ? previousFollowing.stored
              ? previousFollowing.issueIds.includes(issueId)
                ? previousFollowing.issueIds
                : [...previousFollowing.issueIds, issueId]
              : [issueId]
            : previousFollowing.issueIds.filter((id) => id !== issueId),
          stored: true,
        });
      return previousFollowing ? { previousFollowing } : {};
    },
    onError: (error, _variables, context) => {
      if (context?.previousFollowing)
        client.setQueryData(followingKeys.following, context.previousFollowing);
      onError(error);
    },
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({
          queryKey: followingKeys.following,
          exact: true,
        }),
        // The issue lists' follow group (`../groups/api.ts`).
        client.invalidateQueries({ queryKey: taskGroupKeys.all }),
      ]),
  });
}

/** Records that the viewer looked at an issue now; the task lists' follow group counts it read at once. */
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
          () => {
            for (const list of client
              .getQueryCache()
              .findAll({ queryKey: taskGroupKeys.lists }))
              client.setQueryData<TaskGroups>(list.queryKey, (groups) =>
                groups
                  ? {
                      ...groups,
                      groups: groups.groups.map((group) => ({
                        ...group,
                        data: group.data.map((item) =>
                          item.issue.id === issueId && item.unread > 0
                            ? { ...item, unread: 0 }
                            : item,
                        ),
                      })),
                    }
                  : groups,
              );
          },
          // Only the unread count is lost; the next look records it again.
          () => undefined,
        );
    },
    [api, client],
  );
}
