import type { ApiClient, RealtimeClient } from '@nocobase/app-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  appClient: {
    request: vi.fn(),
    stream: vi.fn(),
    repository: vi.fn(),
  } satisfies ApiClient,
  realtime: {
    connected: true,
    subscribe: vi.fn(() => ({ close: () => undefined })),
    watch: vi.fn(() => ({
      state: 'subscribed' as const,
      error: undefined,
      retry: () => undefined,
      close: () => undefined,
    })),
    onOpen: vi.fn(() => () => undefined),
    onError: vi.fn(() => () => undefined),
    reconnect: vi.fn(),
    close: vi.fn(),
  } satisfies RealtimeClient,
  fetchUnreadCount: vi.fn(),
  sources: [] as unknown[],
}));

vi.mock('@nocobase/app-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/app-client')>();
  return {
    ...actual,
    useRealtimeReadiness: () => true,
    useApiClient: () => mocks.appClient,
    useService: () => mocks.realtime,
  };
});

vi.mock('../client/api.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../client/api.js')>()),
  fetchUnreadCount: mocks.fetchUnreadCount,
}));

vi.mock('../client/inbox-page/extensions.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../client/inbox-page/extensions.js')>();
  return {
    ...actual,
    useInboxSource: () =>
      actual.combineInboxSources(
        mocks.sources as Parameters<typeof actual.combineInboxSources>[0],
      ),
  };
});

import notificationInApp from '../client/plugin.js';
import { useInboxBadge } from '../client/components/inbox-badge.js';
import {
  combineInboxSources,
  createInboxExtensionList,
} from '../client/inbox-page/extensions.js';
import {
  defaultInboxRegistry,
  fallbackRenderer,
  rendererFor,
  type InboxEntryRenderer,
} from '../client/inbox-page/registry.js';

function routesOf(registration: ReturnType<typeof notificationInApp>) {
  return JSON.parse(
    JSON.stringify(registration.routes, (key, value: unknown) =>
      typeof value === 'function' ? undefined : value,
    ),
  ) as { routes?: { name: string; path: string }[] }[];
}

function wrapper({ children }: PropsWithChildren): ReactElement {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('in-app notification client plugin', () => {
  it('registers the inbox route, the header button and the extension lists', () => {
    expect(notificationInApp({ inboxRoute: false }).routes).toEqual([
      expect.objectContaining({ disabled: true }),
    ]);
    expect(
      notificationInApp({ inboxRoute: false }).serviceProviders,
    ).toHaveLength(1);
    const registration = notificationInApp();
    expect(JSON.stringify(routesOf(registration))).toContain(
      '"name":"inbox","path":"/inbox"',
    );
    expect(registration.headerActions.map((action) => action.name)).toEqual([
      'inbox',
    ]);
    expect(registration.headerActions[0]?.badge).toBe(useInboxBadge);
    expect(registration.serviceProviders).toHaveLength(1);
  });

  it('moves the page and leaves out the button on request', () => {
    const registration = notificationInApp({
      inboxPath: '/messages',
      headerButton: false,
    });
    expect(JSON.stringify(routesOf(registration))).toContain(
      '"path":"/messages"',
    );
    expect(registration.headerActions).toEqual([]);
  });
});

describe('inbox header badge', () => {
  it('shows what waits on the viewer in attention, else the unread count', async () => {
    mocks.fetchUnreadCount.mockResolvedValue(4);
    mocks.sources = [];
    const unread = renderHook(() => useInboxBadge(), { wrapper });
    await waitFor(() => expect(unread.result.current).toEqual({ count: 4 }));

    mocks.sources = [
      { id: 'a', pending: async () => ({ decision: 2 }) },
      { id: 'b', pending: async () => ({ decision: 1, review: 1 }) },
    ];
    const pending = renderHook(() => useInboxBadge(), { wrapper });
    await waitFor(() =>
      expect(pending.result.current).toEqual({ count: 4, tone: 'attention' }),
    );

    mocks.fetchUnreadCount.mockResolvedValue(0);
    mocks.sources = [];
    const none = renderHook(() => useInboxBadge(), { wrapper });
    await waitFor(() => expect(mocks.fetchUnreadCount).toHaveBeenCalled());
    expect(none.result.current).toBeUndefined();
  });
});

describe('inbox extension points', () => {
  it('lists registered values and tells subscribers', () => {
    const list = createInboxExtensionList<string>();
    const listener = vi.fn();
    list.subscribe(listener);
    const remove = list.register('approvals');
    expect(list.list()).toEqual(['approvals']);
    remove();
    expect(list.list()).toEqual([]);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('adds pending counts and keeps the first notice of each item', async () => {
    const api = mocks.appClient;
    const source = combineInboxSources([
      {
        id: 'a',
        pending: async () => ({ decision: 1 }),
        notices: async () => [
          { notificationId: 'n1', source: 'a', type: 'x' } as never,
        ],
      },
      {
        id: 'b',
        pending: () => {
          throw new Error('offline');
        },
        notices: async () => [
          { notificationId: 'n1', source: 'b', type: 'x' } as never,
        ],
      },
      { id: 'c', pending: async () => ({ decision: 2 }) },
    ]);
    await expect(source.pending?.({ api })).resolves.toEqual({ decision: 3 });
    await expect(source.notices?.(['n1'], { api })).resolves.toMatchObject([
      { source: 'a' },
    ]);
  });

  it('reports a failed query if none of the sources that implement it can answer', async () => {
    const source = combineInboxSources([
      { id: 'other' },
      {
        id: 'offline',
        pending: () => Promise.reject(new Error('offline')),
      },
    ]);
    await expect(source.pending?.({ api: mocks.appClient })).rejects.toThrow(
      'offline',
    );
    await expect(
      source.notices?.([], { api: mocks.appClient }),
    ).resolves.toEqual([]);
  });

  it('picks the renderer registered for the item kind, else the fallback', () => {
    const approval = {
      kinds: ['approval.requested'],
      text: () => ({ title: 'Approval' }),
    } as unknown as InboxEntryRenderer<never>;
    const registry = { ...defaultInboxRegistry, renderers: [approval] };
    const entry = (kind?: string) =>
      ({
        item: {
          id: '1',
          deliveryId: 'd',
          notificationId: 'n',
          title: 'T',
          body: 'B',
          createdAt: '2026-11-21T00:00:00.000Z',
          ...(kind ? { kind } : {}),
        },
      }) as never;
    expect(rendererFor(registry, entry('approval.requested'))).toBe(approval);
    expect(rendererFor(registry, entry('projects.mentioned'))).toBe(
      fallbackRenderer,
    );
  });
});
