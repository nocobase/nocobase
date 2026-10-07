import { useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';

import type { Activity } from '../../../../shared/issues.js';
import { pmKeys } from '../../../api/keys.js';
import { usePmApi } from '../../../hooks/use-pm-api.js';

export interface OlderActivities {
  readonly activities: readonly Activity[];
  readonly hasMore: boolean;
  readonly loading: boolean;
  readonly loadMore: () => void;
}

/**
 * Older activities on demand: the detail brings the newest ones and `activitiesNextCursor`; "Load older" pages on
 * from there. The query sits under `pmKeys.issue(id)`, so refreshing the issue refetches the loaded pages. Nothing is
 * requested until asked.
 */
export function useOlderActivities(
  issueId: string,
  firstCursor: string | null,
): OlderActivities {
  const api = usePmApi();
  const [requested, setRequested] = useState(false);
  const query = useInfiniteQuery({
    queryKey: pmKeys.activities(issueId, firstCursor),
    queryFn: ({ pageParam }) => api.activities(issueId, pageParam),
    initialPageParam: firstCursor ?? '',
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: requested && !!firstCursor,
  });
  return {
    // Each page is oldest first; later pages are older still.
    activities: [...(query.data?.pages ?? [])]
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
