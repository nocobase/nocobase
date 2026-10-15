/**
 * "My follow-ups" in the browser (`/api/followUps`, `server/follow-ups/routes.ts`). An announced change to issues, or
 * to their runs, reads the rows of those issues again and merges them in (`issues/live/realtime-refresh.ts`); anything
 * else, and every `OVERVIEW_POLL_MS` as a fallback, reads the whole overview again.
 */
import { useApiClient, type ApiClient } from '@nocobase/app-client';
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
  FollowUpIssue,
  FollowUpsView,
} from '../../shared/follow-ups.js';
import { taskGroupKeys } from '../issues/groups/api.js';
import { followUpsKeys, mergeFollowUpRows } from './model.js';

const OVERVIEW_POLL_MS = 60_000;

/** The most issues one rows read names (`FOLLOW_UP_ROWS_MAX` on the server). */
const ROWS_MAX = 100;

/** Reads the overview's rows of `issueIds` (`GET followUps/issues`): those it lists now, the others left out. */
export async function readFollowUpRows(
  api: Pick<ApiClient, 'request'>,
  issueIds: readonly string[],
): Promise<FollowUpIssue[]> {
  const rows: FollowUpIssue[] = [];
  for (let start = 0; start < issueIds.length; start += ROWS_MAX)
    rows.push(
      ...(
        await api.request<{ data: FollowUpIssue[] }>({
          path: 'followUps/issues',
          query: {
            issueIds: issueIds.slice(start, start + ROWS_MAX).join(','),
          },
        })
      ).data,
    );
  return rows;
}

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
 * What the viewer follows and how many they may (`GET followUps/following`), the follow star's read; under the
 * overview's key, so whatever reads the overview again reads it too.
 */
export function useFollowing(): UseQueryResult<FollowingState> {
  const api = useApiClient();
  return useQuery({
    queryKey: followUpsKeys.following,
    queryFn: async ({ signal }) =>
      (
        await api.request<{ data: FollowingState }>({
          path: 'followUps/following',
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
  { previous?: FollowUpsView; previousFollowing?: FollowingState }
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
      const previousFollowing = client.getQueryData<FollowingState>(
        followUpsKeys.following,
      );
      if (previousFollowing)
        client.setQueryData<FollowingState>(followUpsKeys.following, {
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
      return { previous, previousFollowing };
    },
    onError: (error, _variables, context) => {
      if (context?.previous)
        client.setQueryData(followUpsKeys.overview, context.previous);
      if (context?.previousFollowing)
        client.setQueryData(followUpsKeys.following, context.previousFollowing);
      onError(error);
    },
    // The overview's key holds the star's, so both are read again.
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: followUpsKeys.overview }),
        // The issue lists' follow group (`../issues/groups/api.ts`).
        client.invalidateQueries({ queryKey: taskGroupKeys.all }),
      ]),
  });
}

/** Records that the viewer looked at an issue now, then reads that issue's row again. */
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
          async () => {
            const rows = await readFollowUpRows(api, [issueId]);
            const view = client.getQueryData<FollowUpsView>(
              followUpsKeys.overview,
            );
            const merged = view
              ? mergeFollowUpRows(view, new Set([issueId]), rows)
              : null;
            if (merged) client.setQueryData(followUpsKeys.overview, merged);
            else
              await client.invalidateQueries({
                queryKey: followUpsKeys.overview,
              });
          },
          // Only the unread count is lost; the next look records it again.
          () => undefined,
        )
        .catch(() =>
          client.invalidateQueries({ queryKey: followUpsKeys.overview }),
        );
    },
    [api, client],
  );
}
