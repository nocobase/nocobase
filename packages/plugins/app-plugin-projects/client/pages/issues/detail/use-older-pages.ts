import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { pmKeys } from '../../../api/keys.js';

interface HistoryPage<T> {
  readonly data: readonly T[];
  readonly nextCursor: string | null;
}

interface OlderPages<T> {
  readonly items: readonly T[];
  readonly hasMore: boolean;
  readonly loading: boolean;
  readonly loadMore: () => void;
}

/** Keep the loaded range while its newest boundary moves, including bursts larger than one page. */
export function useOlderPages<T>(
  issueId: string,
  kind: 'threads' | 'activities',
  firstCursor: string | null,
  read: (cursor?: string) => Promise<HistoryPage<T>>,
  idOf: (item: T) => string,
): OlderPages<T> {
  const client = useQueryClient();
  const key = pmKeys[kind](issueId, null);
  const [requestedIssue, setRequestedIssue] = useState<string | null>(null);
  const requested =
    requestedIssue === issueId || client.getQueryData(key) !== undefined;
  const query = useInfiniteQuery({
    queryKey: key,
    initialPageParam: '',
    queryFn: async ({ pageParam, signal }): Promise<HistoryPage<T>> => {
      if (pageParam) return read(pageParam);
      const previous =
        client.getQueryData<InfiniteData<HistoryPage<T>>>(key)?.pages[0];
      const boundary = previous?.data[0];
      let page = await read();
      let items = [...page.data];
      // The first load includes an older page. On refresh, keep reaching at least the old boundary.
      while (
        page.nextCursor &&
        (!boundary || !items.some((item) => idOf(item) === idOf(boundary)))
      ) {
        signal.throwIfAborted();
        page = await read(page.nextCursor);
        items = [...page.data, ...items];
        if (!boundary) break;
      }
      const unique = new Map(items.map((item) => [idOf(item), item]));
      const loaded = [...unique.values()];
      const boundaryIndex = boundary
        ? loaded.findIndex((item) => idOf(item) === idOf(boundary))
        : -1;
      if (previous && boundaryIndex >= 0)
        return {
          data: loaded.slice(boundaryIndex),
          nextCursor: previous.nextCursor,
        };
      return { data: loaded, nextCursor: page.nextCursor };
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: requested && !!firstCursor,
  });
  // A detail refresh can finish after the history refresh; bridge that new boundary too.
  const previousCursorRef = useRef(firstCursor);
  useEffect(() => {
    if (query.isFetching) return;
    const changed = previousCursorRef.current !== firstCursor;
    previousCursorRef.current = firstCursor;
    if (changed && requested && firstCursor)
      void client.invalidateQueries({
        queryKey: pmKeys[kind](issueId, null),
        exact: true,
      });
  }, [client, issueId, kind, firstCursor, requested, query.isFetching]);
  const { fetchNextPage } = query;
  const loadMore = useCallback(() => {
    if (!requested) setRequestedIssue(issueId);
    else void fetchNextPage();
  }, [requested, issueId, fetchNextPage]);
  return {
    items: [...(query.data?.pages ?? [])]
      .reverse()
      .flatMap((page) => page.data),
    hasMore: !!firstCursor && (!query.data || query.hasNextPage),
    loading: query.isFetching,
    loadMore,
  };
}
