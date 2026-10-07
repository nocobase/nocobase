import type * as Inbox from '@nocobase/app-plugin-notification-in-app/client/inbox';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { demoItems } from './inbox-data.js';

// The preview's stand-in for the in-app notification plugin's inbox hooks, aliased in vite.config.ts: the messages
// live in memory, so the inbox demo lists, reads and deletes them without a server.
type InboxItem = Inbox.InboxItem;
type InboxListResponse = Inbox.InboxListResponse;
type InboxMutationAction = Inbox.InboxMutationAction;

let messages: InboxItem[] = [...demoItems];

const wait = (): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, 250));

export const INBOX_PAGE_SIZE: typeof Inbox.INBOX_PAGE_SIZE = 25;

export const inboxKeys: typeof Inbox.inboxKeys = {
  all: ['notificationInApp', 'inbox'],
  items: ['notificationInApp', 'inbox', 'items'],
  unread: ['notificationInApp', 'inbox', 'unread'],
  page: (pageSize) => ['notificationInApp', 'inbox', 'items', pageSize],
};

export function useInboxItems(
  pageSize: number = INBOX_PAGE_SIZE,
): UseInfiniteQueryResult<InfiniteData<InboxListResponse, string | undefined>> {
  return useInfiniteQuery({
    queryKey: inboxKeys.page(pageSize),
    queryFn: async ({ pageParam }): Promise<InboxListResponse> => {
      await wait();
      const start = pageParam ? Number(pageParam) : 0;
      const end = start + pageSize;
      return {
        data: messages.slice(start, end),
        ...(end < messages.length ? { nextPageToken: String(end) } : {}),
      };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextPageToken,
  });
}

export function useInboxUnreadCount(): UseQueryResult<number> {
  return useQuery({
    queryKey: inboxKeys.unread,
    queryFn: async () => {
      await wait();
      return messages.filter((message) => !message.readAt).length;
    },
  });
}

export function useInboxActions(): Inbox.InboxActions {
  const queryClient = useQueryClient();
  const settle = (): Promise<void> =>
    queryClient.invalidateQueries({ queryKey: inboxKeys.all });
  const mark = useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: InboxMutationAction;
    }): Promise<InboxItem | undefined> => {
      await wait();
      if (action === 'delete') {
        messages = messages.filter((message) => message.id !== id);
        return undefined;
      }
      messages = messages.map((message) => {
        if (message.id !== id) return message;
        const { readAt: _readAt, ...rest } = message;
        return action === 'read'
          ? { ...rest, readAt: new Date().toISOString() }
          : rest;
      });
      return messages.find((message) => message.id === id);
    },
    onSettled: settle,
  });
  const readAll = useMutation({
    mutationFn: async (): Promise<number> => {
      await wait();
      const now = new Date().toISOString();
      const count = messages.filter((message) => !message.readAt).length;
      messages = messages.map((message) =>
        message.readAt ? message : { ...message, readAt: now },
      );
      return count;
    },
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

// Nothing arrives in the preview.
// eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix -- stands in for the hook of the same name
export const useInboxRefresh: typeof Inbox.useInboxRefresh = () => undefined;
