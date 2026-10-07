/**
 * The headless parts of an issue's activity line, for the application that presents it (for example, with the UI Library's
 * `comment-thread`): the comment threads, changes and the application's runs on one line with older entries on demand,
 * the comment actions with the cache kept current, and the `@` candidates.
 */
import {
  type QueryKey,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';

import {
  REACTION_EMOJIS,
  type IssueComment,
} from '../../../../shared/comments.js';
import type { IssueDetail } from '../../../../shared/issues.js';
import { useNotify } from '../../../hooks/use-notify.js';
import { usePmApi } from '../../../hooks/use-pm-api.js';
import { useMentionCandidates } from '../use-mention-candidates.js';
import {
  refreshIssue,
  updateCachedComment,
  withComment,
} from './comment-cache.js';
import { hasReacted, toggleReaction } from './reaction-model.js';
import {
  buildTimeline,
  mergeActivities,
  mergeThreads,
  type TimelineEntry,
  type TimelineRun,
} from './timeline.js';
import { useOlderActivities } from './use-older-activities.js';
import { useOlderThreads } from './use-older-threads.js';

/** The emoji a reaction may be. */
export const ISSUE_REACTION_EMOJIS: readonly string[] = REACTION_EMOJIS;

export interface IssueTimeline {
  /** Threads, changes and runs, oldest first. */
  readonly entries: readonly TimelineEntry[];
  readonly hasOlder: boolean;
  readonly loadingOlder: boolean;
  readonly loadOlder: () => void;
}

/**
 * The issue's line: the threads and changes the detail brought, older pages on demand, and `runs` where they started.
 * With `targetId` (a link to a comment), older threads load until it is found, and it is scrolled into view.
 */
export function useIssueTimeline(
  detail: IssueDetail,
  runs: readonly TimelineRun[] = [],
  targetId: string | null = null,
): IssueTimeline {
  const olderActivities = useOlderActivities(
    detail.id,
    detail.activitiesNextCursor,
  );
  const olderThreads = useOlderThreads(detail.id, detail.threadsNextCursor);
  const threads = useMemo(
    () => mergeThreads(olderThreads.threads, detail.threads),
    [olderThreads.threads, detail.threads],
  );
  const entries = useMemo(
    () =>
      buildTimeline(
        threads,
        mergeActivities(olderActivities.activities, detail.activities),
        { threads: olderThreads.hasMore, activities: olderActivities.hasMore },
        runs,
      ),
    [
      runs,
      threads,
      olderActivities.activities,
      olderActivities.hasMore,
      olderThreads.hasMore,
      detail.activities,
    ],
  );
  const found =
    targetId !== null &&
    threads.some(
      (thread) =>
        thread.root.id === targetId ||
        thread.replies.some((reply) => reply.id === targetId),
    );
  const { hasMore: moreThreads, loading: loadingThreads } = olderThreads;
  const loadThreads = olderThreads.loadMore;
  useEffect(() => {
    if (!targetId) return;
    if (!found) {
      if (moreThreads && !loadingThreads) loadThreads();
      return;
    }
    document
      .querySelector<HTMLElement>(`[data-comment-id="${CSS.escape(targetId)}"]`)
      ?.scrollIntoView({ block: 'center' });
  }, [targetId, found, moreThreads, loadingThreads, loadThreads]);

  return {
    entries,
    hasOlder: olderActivities.hasMore || olderThreads.hasMore,
    loadingOlder: olderActivities.loading || olderThreads.loading,
    loadOlder: () => {
      if (olderActivities.hasMore) olderActivities.loadMore();
      if (olderThreads.hasMore) olderThreads.loadMore();
    },
  };
}

export interface NewComment {
  readonly content: string;
  readonly parentId?: string;
  readonly attachmentIds?: readonly string[];
  /** Posted as `/note …`: wakes nothing. */
  readonly note?: boolean;
}

const NOTE = /^\s*\/note(?:\s|$)/u;

export interface IssueCommentActions {
  /** Posts it and shows it at once; rejects (after saying why) when the server refuses. */
  readonly create: (comment: NewComment) => Promise<IssueComment>;
  readonly update: (commentId: string, content: string) => Promise<void>;
  readonly remove: (commentId: string) => Promise<void>;
  readonly resolve: (rootId: string, resolved: boolean) => Promise<void>;
  /** Toggles the viewer's `emoji` on the comment, shown at once. */
  readonly react: (
    comment: IssueComment,
    emoji: string,
    viewerId: string,
  ) => void;
}

/** The comment actions of one issue, each keeping every cached copy current and reporting what failed. */
export function useIssueCommentActions(
  issueId: string,
  detailKey: QueryKey,
): IssueCommentActions {
  const api = usePmApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const reacting = useMutation({
    mutationFn: ({
      comment,
      emoji,
      viewerId,
    }: {
      comment: IssueComment;
      emoji: string;
      viewerId: string;
    }) =>
      hasReacted(comment.reactions, emoji, viewerId)
        ? api.unreact(comment.id, emoji)
        : api.react(comment.id, emoji),
    onMutate: ({ comment, emoji, viewerId }) =>
      updateCachedComment(queryClient, comment.id, (current) => ({
        ...current,
        reactions: toggleReaction(
          current.reactions,
          emoji as IssueComment['reactions'][number]['emoji'],
          viewerId,
        ),
      })),
    onError: (error) => notify.error(error),
    onSettled: () => refreshIssue(queryClient),
  });
  const failed = useCallback(
    (error: unknown): never => {
      notify.error(error);
      throw error;
    },
    [notify],
  );

  return useMemo(
    () => ({
      create: async ({ content, parentId, attachmentIds, note }) => {
        const text = note && !NOTE.test(content) ? `/note ${content}` : content;
        try {
          const { comment } = await api.createComment(issueId, {
            content: text.trim(),
            ...(parentId ? { parentId } : {}),
            ...(attachmentIds && attachmentIds.length > 0
              ? { attachmentIds: [...attachmentIds] }
              : {}),
          });
          queryClient.setQueryData<IssueDetail>(detailKey, (detail) =>
            detail ? withComment(detail, comment) : detail,
          );
          refreshIssue(queryClient);
          return comment;
        } catch (error: unknown) {
          return failed(error);
        }
      },
      update: async (commentId, content) => {
        try {
          const updated = await api.updateComment(commentId, content);
          updateCachedComment(queryClient, commentId, () => updated);
        } catch (error: unknown) {
          failed(error);
        } finally {
          refreshIssue(queryClient);
        }
      },
      remove: async (commentId) => {
        try {
          await api.deleteComment(commentId);
          updateCachedComment(queryClient, commentId, (current) => ({
            ...current,
            content: '',
            deleted: true,
            reactions: [],
            attachments: [],
          }));
        } catch (error: unknown) {
          failed(error);
        } finally {
          refreshIssue(queryClient);
        }
      },
      resolve: async (rootId, resolved) => {
        try {
          await api.setThreadResolved(rootId, resolved);
        } catch (error: unknown) {
          failed(error);
        } finally {
          refreshIssue(queryClient);
        }
      },
      react: (comment, emoji, viewerId) =>
        reacting.mutate({ comment, emoji, viewerId }),
    }),
    [api, issueId, detailKey, queryClient, failed, reacting],
  );
}

export interface MentionCandidate {
  readonly kind: string;
  readonly id: string;
  readonly name: string;
  readonly hint?: string;
}

/** Who `@query` may name on the issue: the members, and the candidates of other mentionable kinds, first. */
export function useMentionSearch(
  issueId: string | null,
  enabled = true,
): (query: string) => Promise<readonly MentionCandidate[]> {
  const candidates = useMentionCandidates(enabled, issueId);
  return useCallback(
    (query: string) => {
      const needle = query.toLowerCase();
      return Promise.resolve(
        candidates.filter((candidate) =>
          candidate.name.toLowerCase().includes(needle),
        ),
      );
    },
    [candidates],
  );
}
