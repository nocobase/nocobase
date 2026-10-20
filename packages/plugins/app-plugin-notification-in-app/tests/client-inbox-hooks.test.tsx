import type {
  ApiClient,
  RealtimeClient,
  RealtimeWatchOptions,
} from '@nocobase/app-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { InboxItem } from '../client/api.js';

const mocks = vi.hoisted(() => ({
  appClient: {
    request: vi.fn(),
    stream: vi.fn(),
    repository: vi.fn(),
  } satisfies ApiClient,
  realtime: {
    connected: true,
    subscribe: vi.fn(),
    watch: vi.fn(),
    onOpen: vi.fn(),
    onError: vi.fn(),
    reconnect: vi.fn(),
    close: vi.fn(),
  } satisfies RealtimeClient,
  fetchInbox: vi.fn(),
  fetchUnreadCount: vi.fn(),
  mutateInboxItem: vi.fn(),
  markInboxRead: vi.fn(),
  subscribe: vi.fn(),
}));

vi.mock('@nocobase/app-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/app-client')>();
  return {
    ...actual,
    useApiClient: () => mocks.appClient,
    useService: (token: unknown) =>
      token === actual.realtimeClientToken ? mocks.realtime : mocks.appClient,
  };
});

vi.mock('../client/api.js', () => ({
  fetchInbox: mocks.fetchInbox,
  fetchUnreadCount: mocks.fetchUnreadCount,
  mutateInboxItem: mocks.mutateInboxItem,
  markInboxRead: mocks.markInboxRead,
}));

vi.mock('../client/subscription.js', () => ({
  subscribeToInboxInvalidations: mocks.subscribe,
}));

import {
  useInboxActions,
  useInboxItems,
  useInboxRefresh,
  useInboxUnreadCount,
} from '../client/inbox/index.js';

function item(id: string, readAt?: string): InboxItem {
  return {
    id,
    deliveryId: `d-${id}`,
    notificationId: `n-${id}`,
    title: `Title ${id}`,
    body: '',
    createdAt: '2026-10-01T00:00:00.000Z',
    ...(readAt ? { readAt } : {}),
  };
}

function setup(): {
  queryClient: QueryClient;
  wrapper: (props: PropsWithChildren) => ReactElement;
} {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  return {
    queryClient,
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

function useInbox() {
  return {
    items: useInboxItems(2),
    unread: useInboxUnreadCount(),
    actions: useInboxActions(),
  };
}

function ids(result: ReturnType<typeof useInbox>): string[] {
  return (
    result.items.data?.pages.flatMap((page) =>
      page.data.map((entry) => `${entry.id}:${entry.readAt ? 'read' : 'new'}`),
    ) ?? []
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('in-app notification inbox hooks', () => {
  it('pages the list by nextPageToken', async () => {
    mocks.fetchInbox.mockImplementation(
      (_client: unknown, filters: { pageToken?: string }) =>
        Promise.resolve(
          filters.pageToken === 'p2'
            ? { data: [item('3')] }
            : { data: [item('1'), item('2')], nextPageToken: 'p2' },
        ),
    );
    mocks.fetchUnreadCount.mockResolvedValue(3);
    const { wrapper } = setup();
    const { result } = renderHook(useInbox, { wrapper });

    await waitFor(() => expect(result.current.unread.data).toBe(3));
    await waitFor(() => expect(ids(result.current)).toHaveLength(2));
    expect(result.current.items.hasNextPage).toBe(true);
    await act(() => result.current.items.fetchNextPage());

    await waitFor(() =>
      expect(ids(result.current)).toEqual(['1:new', '2:new', '3:new']),
    );
    expect(mocks.fetchInbox).toHaveBeenLastCalledWith(
      mocks.appClient,
      { pageSize: 2, pageToken: 'p2' },
      expect.anything(),
    );
    expect(result.current.items.hasNextPage).toBe(false);
  });

  it('marks optimistically and refetches once settled', async () => {
    mocks.fetchInbox.mockResolvedValue({ data: [item('1'), item('2')] });
    mocks.fetchUnreadCount.mockResolvedValue(2);
    let finish: (value: InboxItem) => void = () => undefined;
    mocks.mutateInboxItem.mockReturnValue(
      new Promise<InboxItem>((resolve) => {
        finish = resolve;
      }),
    );
    const { wrapper } = setup();
    const { result } = renderHook(useInbox, { wrapper });
    await waitFor(() => expect(ids(result.current)).toHaveLength(2));
    await waitFor(() => expect(result.current.unread.data).toBe(2));

    let done: Promise<unknown> = Promise.resolve();
    act(() => {
      done = result.current.actions.mark('1', 'read');
    });
    await waitFor(() =>
      expect(ids(result.current)).toEqual(['1:read', '2:new']),
    );
    expect(result.current.unread.data).toBe(1);
    expect(mocks.mutateInboxItem).toHaveBeenCalledWith(
      mocks.appClient,
      '1',
      'read',
    );

    const fetches = mocks.fetchInbox.mock.calls.length;
    await act(async () => {
      finish(item('1', '2026-10-02T00:00:00.000Z'));
      await done;
    });
    await waitFor(() =>
      expect(mocks.fetchInbox.mock.calls.length).toBeGreaterThan(fetches),
    );
  });

  it('removes a deleted message and restores the cache when the server refuses', async () => {
    mocks.fetchInbox.mockResolvedValue({ data: [item('1'), item('2')] });
    mocks.fetchUnreadCount.mockResolvedValue(2);
    let fail: (error: Error) => void = () => undefined;
    mocks.mutateInboxItem.mockReturnValue(
      new Promise((_resolve, reject) => {
        fail = reject;
      }),
    );
    const { wrapper } = setup();
    const { result } = renderHook(useInbox, { wrapper });
    await waitFor(() => expect(ids(result.current)).toHaveLength(2));
    await waitFor(() => expect(result.current.unread.data).toBe(2));

    let done: Promise<unknown> = Promise.resolve();
    act(() => {
      done = result.current.actions.mark('1', 'delete');
    });
    await waitFor(() => expect(ids(result.current)).toEqual(['2:new']));
    expect(result.current.unread.data).toBe(1);

    await act(async () => {
      fail(new Error('refused'));
      await expect(done).rejects.toThrow('refused');
    });
    await waitFor(() =>
      expect(ids(result.current)).toEqual(['1:new', '2:new']),
    );
    expect(result.current.unread.data).toBe(2);
  });

  it('reads all at once', async () => {
    mocks.fetchInbox.mockResolvedValue({
      data: [item('1'), item('2', '2026-10-01T01:00:00.000Z')],
    });
    mocks.fetchUnreadCount.mockResolvedValue(1);
    mocks.markInboxRead.mockReturnValue(new Promise(() => undefined));
    const { wrapper } = setup();
    const { result } = renderHook(useInbox, { wrapper });
    await waitFor(() => expect(ids(result.current)).toHaveLength(2));
    await waitFor(() => expect(result.current.unread.data).toBe(1));

    act(() => {
      void result.current.actions.readAll();
    });

    await waitFor(() =>
      expect(ids(result.current)).toEqual(['1:read', '2:read']),
    );
    expect(result.current.unread.data).toBe(0);
    expect(result.current.actions.pending).toBe(true);
  });

  it('refreshes inbox snapshots on plugin signals and extra topic readiness', async () => {
    const stopItems = vi.fn();
    const stopTopic = vi.fn();
    let refreshItems: (signal: AbortSignal) => Promise<void> = async () => {};
    let extra: RealtimeWatchOptions<unknown> = {};
    mocks.subscribe.mockImplementation(
      (_realtime: unknown, _target: unknown, refresh: typeof refreshItems) => {
        refreshItems = refresh;
        return stopItems;
      },
    );
    mocks.realtime.watch.mockImplementation(
      (_topic: string, options: RealtimeWatchOptions<unknown>) => {
        extra = options;
        return {
          state: 'subscribed',
          error: undefined,
          retry: vi.fn(),
          close: stopTopic,
        };
      },
    );
    mocks.fetchUnreadCount.mockResolvedValue(1);
    const { queryClient, wrapper } = setup();
    const view = renderHook(
      ({ topics }: { topics: string[] }) => {
        useInboxRefresh(topics);
        return useInboxUnreadCount();
      },
      { wrapper, initialProps: { topics: ['app:inbox'] } },
    );
    await waitFor(() => expect(view.result.current.data).toBe(1));
    mocks.fetchUnreadCount.mockResolvedValue(2);
    await act(() => refreshItems(new AbortController().signal));
    await waitFor(() => expect(view.result.current.data).toBe(2));
    mocks.fetchUnreadCount.mockResolvedValue(3);
    act(() => extra.onReady?.());
    await waitFor(() => expect(view.result.current.data).toBe(3));
    mocks.fetchUnreadCount.mockResolvedValue(4);
    act(() =>
      extra.onEvent?.({
        type: 'event',
        topic: 'app:inbox',
        payload: {},
        publishedAt: new Date().toISOString(),
      }),
    );
    await waitFor(() => expect(view.result.current.data).toBe(4));
    view.rerender({ topics: ['app:inbox'] });
    expect(mocks.subscribe).toHaveBeenCalledTimes(1);
    expect(mocks.realtime.watch).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(stopItems).toHaveBeenCalledOnce();
    expect(stopTopic).toHaveBeenCalledOnce();
    queryClient.clear();
  });
});
