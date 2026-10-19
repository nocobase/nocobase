import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  newestBoundaryId: string | null,
  read: (cursor?: string) => Promise<HistoryPage<T>>,
  idOf: (item: T) => string,
): OlderPages<T> {
  const client = useQueryClient();
  const key = useMemo(() => pmKeys[kind](issueId), [kind, issueId]);
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
  // Compare the boundary record, not cursors: history may be ahead of the detail snapshot.
  const previousCursorRef = useRef(firstCursor);
  useEffect(() => {
    if (query.isFetching) return;
    const changed = previousCursorRef.current !== firstCursor;
    previousCursorRef.current = firstCursor;
    if (
      changed &&
      requested &&
      firstCursor &&
      newestBoundaryId &&
      !query.data?.pages[0]?.data.some(
        (item) => idOf(item) === newestBoundaryId,
      )
    )
      void client.invalidateQueries({
        queryKey: key,
        exact: true,
      });
  }, [
    client,
    key,
    firstCursor,
    newestBoundaryId,
    idOf,
    requested,
    query.isFetching,
    query.data,
  ]);
  const { fetchNextPage } = query;
  const loadMore = useCallback(() => {
    if (!requested) setRequestedIssue(issueId);
    else void fetchNextPage();
  }, [requested, issueId, fetchNextPage, setRequestedIssue]);
  const items = useMemo(
    () => [...(query.data?.pages ?? [])].reverse().flatMap((page) => page.data),
    [query.data],
  );
  return {
    items,
    hasMore: !!firstCursor && (!query.data || query.hasNextPage),
    loading: query.isFetching,
    loadMore,
  };
}
