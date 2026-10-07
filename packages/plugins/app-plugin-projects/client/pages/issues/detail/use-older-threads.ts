import { useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';

import type { CommentThread } from '../../../../shared/comments.js';
import { pmKeys } from '../../../api/keys.js';
import { usePmApi } from '../../../hooks/use-pm-api.js';

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
  const [requested, setRequested] = useState(false);
  const query = useInfiniteQuery({
    queryKey: pmKeys.threads(issueId, firstCursor),
    queryFn: ({ pageParam }) => api.threads(issueId, pageParam),
    initialPageParam: firstCursor ?? '',
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: requested && !!firstCursor,
  });
  return {
    threads: [...(query.data?.pages ?? [])]
      .reverse()
      .flatMap((page) => page.data),
    hasMore: !!firstCursor && (!query.data || query.hasNextPage),
    loading: query.isFetching,
    loadMore: () => {
      if (!requested) setRequested(true);
      else void query.fetchNextPage();
    },
  };
}
