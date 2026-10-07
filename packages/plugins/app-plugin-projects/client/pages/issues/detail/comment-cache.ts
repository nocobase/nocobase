import type {
  InfiniteData,
  QueryClient,
  QueryKey,
} from '@tanstack/react-query';

import type {
  CommentThread,
  IssueComment,
  ThreadPage,
} from '../../../../shared/comments.js';
import type { IssueDetail } from '../../../../shared/issues.js';
import { pmKeys } from '../../../api/keys.js';

/**
 * Comments in the query cache: the detail holds the newest page of threads (read under the id or the identifier the
 * URL has), older pages sit under `pmKeys.threads`. A change is written into every copy at once and the issue is then
 * refetched.
 */

const ISSUE_PREFIX: QueryKey = ['pm', 'issue'];

function isThreadPages(key: QueryKey): boolean {
  return key[3] === 'threads';
}

function mapThreads(
  threads: readonly CommentThread[],
  commentId: string,
  update: (comment: IssueComment) => IssueComment,
): CommentThread[] {
  const one = (comment: IssueComment): IssueComment =>
    comment.id === commentId ? update(comment) : comment;
  return threads.map((thread) => ({
    root: one(thread.root),
    replies: thread.replies.map(one),
  }));
}

/** Every cached copy of the comment, replaced through `update`. */
export function updateCachedComment(
  queryClient: QueryClient,
  commentId: string,
  update: (comment: IssueComment) => IssueComment,
): void {
  for (const [key, value] of queryClient.getQueriesData<unknown>({
    queryKey: ISSUE_PREFIX,
  })) {
    if (!value) continue;
    if (key.length === 3) {
      const detail = value as IssueDetail;
      queryClient.setQueryData<IssueDetail>(key, {
        ...detail,
        threads: mapThreads(detail.threads, commentId, update),
      });
    } else if (isThreadPages(key)) {
      const pages = value as InfiniteData<ThreadPage>;
      queryClient.setQueryData<InfiniteData<ThreadPage>>(key, {
        ...pages,
        pages: pages.pages.map((page) => ({
          ...page,
          data: mapThreads(page.data, commentId, update),
        })),
      });
    }
  }
}

/** The detail with a comment just posted: a new thread at the end, or a reply under its thread. */
export function withComment(
  detail: IssueDetail,
  comment: IssueComment,
): IssueDetail {
  if (!comment.parentId) {
    if (detail.threads.some((thread) => thread.root.id === comment.id))
      return detail;
    return {
      ...detail,
      threads: [...detail.threads, { root: comment, replies: [] }],
    };
  }
  return {
    ...detail,
    threads: detail.threads.map((thread) =>
      thread.root.id === comment.rootId &&
      !thread.replies.some((reply) => reply.id === comment.id)
        ? { ...thread, replies: [...thread.replies, comment] }
        : thread,
    ),
  };
}

/** Refetches the issue under every key it is cached by, and the lists that show its activity. */
export function refreshIssue(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ISSUE_PREFIX });
  void queryClient.invalidateQueries({ queryKey: pmKeys.issues });
}
