/**
 * React Query hooks over the inbox API, for an application that renders its own inbox. They use the nearest
 * `QueryClientProvider`, keep every query under `inboxKeys.all`, and apply mutations optimistically before settling
 * with a refetch.
 */
import {
  realtimeClientToken,
  useApiClient,
  useService,
} from '@nocobase/app-client';
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  type UseInfiniteQueryResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import {
  fetchInbox,
  fetchUnreadCount,
  markInboxRead,
  mutateInboxItem,
  type InboxItem,
  type InboxListResponse,
  type InboxMutationAction,
} from '../api.js';
import { subscribeToInboxInvalidations } from '../subscription.js';
import { INBOX_PAGE_SIZE, inboxKeys } from './keys.js';

/** The pages `useInboxItems` has loaded. */
export type InboxPages = InfiniteData<InboxListResponse, string | undefined>;

/** What `useInboxActions` returns. Both calls reject when the server refuses; the cache is restored first. */
export interface InboxActions {
  /** Marks one message read or unread, returning it, or deletes it, returning nothing. */
  mark(id: string, action: InboxMutationAction): Promise<InboxItem | undefined>;
  /** Marks every message read, returning how many changed. */
  readAll(): Promise<number>;
  /** Whether a call is in flight. */
  readonly pending: boolean;
}

/** The viewer's messages, newest first, one page of `pageSize` at a time; `fetchNextPage()` loads the next. */
export function useInboxItems(
  pageSize: number = INBOX_PAGE_SIZE,
): UseInfiniteQueryResult<InboxPages> {
  const client = useApiClient();
  return useInfiniteQuery({
    queryKey: inboxKeys.page(pageSize),
    queryFn: ({ pageParam, signal }) =>
      fetchInbox(
        client,
        { pageSize, ...(pageParam ? { pageToken: pageParam } : {}) },
        signal,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextPageToken,
    placeholderData: keepPreviousData,
  });
}

/** How many of the viewer's messages are unread. */
export function useInboxUnreadCount(): UseQueryResult<number> {
  const client = useApiClient();
  return useQuery({
    queryKey: inboxKeys.unread,
    queryFn: ({ signal }) => fetchUnreadCount(client, signal),
    retry: false,
    staleTime: 30_000,
  });
}

interface Snapshot {
  readonly entries: ReadonlyArray<readonly [QueryKey, unknown]>;
}

async function snapshot(queryClient: QueryClient): Promise<Snapshot> {
  await queryClient.cancelQueries({ queryKey: inboxKeys.all });
  return { entries: queryClient.getQueriesData({ queryKey: inboxKeys.all }) };
}

function restore(queryClient: QueryClient, saved: Snapshot | undefined): void {
  for (const [key, data] of saved?.entries ?? [])
    queryClient.setQueryData(key, data);
}

function findItem(queryClient: QueryClient, id: string): InboxItem | undefined {
  for (const [, data] of queryClient.getQueriesData<InboxPages>({
    queryKey: inboxKeys.items,
  })) {
    for (const page of data?.pages ?? []) {
      const item = page.data.find((candidate) => candidate.id === id);
      if (item) return item;
    }
  }
  return undefined;
}

function patchPages(
  queryClient: QueryClient,
  patch: (items: readonly InboxItem[]) => readonly InboxItem[],
): void {
  queryClient.setQueriesData<InboxPages>(
    { queryKey: inboxKeys.items },
    (data) =>
      data && {
        ...data,
        pages: data.pages.map((page) => ({ ...page, data: patch(page.data) })),
      },
  );
}

function withReadAt(item: InboxItem, readAt: string | undefined): InboxItem {
  const { readAt: _previous, ...rest } = item;
  return readAt ? { ...rest, readAt } : rest;
}

/** Marks, deletes and reads all, updating the cached list and count at once and refetching both once settled. */
export function useInboxActions(): InboxActions {
  const client = useApiClient();
  const queryClient = useQueryClient();
  const settle = (): Promise<void> =>
    queryClient.invalidateQueries({ queryKey: inboxKeys.all });

  const mark = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: InboxMutationAction;
    }): Promise<InboxItem | undefined> => mutateInboxItem(client, id, action),
    onMutate: async ({ id, action }): Promise<Snapshot> => {
      const saved = await snapshot(queryClient);
      const current = findItem(queryClient, id);
      const now = new Date().toISOString();
      patchPages(queryClient, (items) =>
        action === 'delete'
          ? items.filter((item) => item.id !== id)
          : items.map((item) =>
              item.id === id
                ? withReadAt(
                    item,
                    action === 'read' ? (item.readAt ?? now) : undefined,
                  )
                : item,
            ),
      );
      if (current) {
        const wasUnread = !current.readAt;
        const delta =
          wasUnread && action !== 'unread'
            ? -1
            : !wasUnread && action === 'unread'
              ? 1
              : 0;
        if (delta !== 0)
          queryClient.setQueryData<number>(inboxKeys.unread, (count) =>
            count === undefined ? count : Math.max(0, count + delta),
          );
      }
      return saved;
    },
    onError: (_error, _variables, saved) => restore(queryClient, saved),
    onSettled: settle,
  });

  const readAll = useMutation({
    mutationFn: (): Promise<number> => markInboxRead(client),
    onMutate: async (): Promise<Snapshot> => {
      const saved = await snapshot(queryClient);
      const now = new Date().toISOString();
      patchPages(queryClient, (items) =>
        items.map((item) => (item.readAt ? item : withReadAt(item, now))),
      );
      queryClient.setQueryData<number>(inboxKeys.unread, (count) =>
        count === undefined ? count : 0,
      );
      return saved;
    },
    onError: (_error, _variables, saved) => restore(queryClient, saved),
    onSettled: settle,
  });

  const markAsync = mark.mutateAsync;
  const readAllAsync = readAll.mutateAsync;
  const pending = mark.isPending || readAll.isPending;
  return useMemo(
    () => ({
      mark: (id, action) => markAsync({ id, action }),
      readAll: () => readAllAsync(),
      pending,
    }),
    [markAsync, readAllAsync, pending],
  );
}

/**
 * Refetches every inbox query when the inbox changes: a message arrives, is read or deleted, the realtime connection
 * reopens, or the window regains focus. `extraTopics` are further realtime topics whose events refresh it too, such
 * as an application's own topic for what it adds to each message.
 */
export function useInboxRefresh(extraTopics: readonly string[] = []): void {
  const realtime = useService(realtimeClientToken);
  const queryClient = useQueryClient();
  const topics = extraTopics.join('\n');
  useEffect(() => {
    const refresh = (): void =>
      void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
    const stops = [subscribeToInboxInvalidations(realtime, window, refresh)];
    for (const topic of topics ? topics.split('\n') : []) {
      const stop = realtime.subscribe<unknown>(topic, refresh);
      if (stop) stops.push(stop);
    }
    return () => {
      for (const stop of stops) stop();
    };
  }, [realtime, queryClient, topics]);
}
