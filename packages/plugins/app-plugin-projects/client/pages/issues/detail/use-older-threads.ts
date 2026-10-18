import type { CommentThread } from '../../../../shared/comments.js';
import { usePmApi } from '../../../hooks/use-pm-api.js';
import { useOlderPages } from './use-older-pages.js';

export interface OlderThreads {
  readonly threads: readonly CommentThread[];
  readonly hasMore: boolean;
  readonly loading: boolean;
  readonly loadMore: () => void;
}

/**
 * Older comment threads on demand, like `useOlderActivities`: the detail brings the newest page and
 * `threadsNextCursor`; nothing is requested until asked.
 */
export function useOlderThreads(
  issueId: string,
  firstCursor: string | null,
): OlderThreads {
  const api = usePmApi();
  const history = useOlderPages(
    issueId,
    'threads',
    firstCursor,
    (cursor) => api.threads(issueId, cursor),
    (thread) => thread.root.id,
  );
  return {
    threads: history.items,
    hasMore: history.hasMore,
    loading: history.loading,
    loadMore: history.loadMore,
  };
}
