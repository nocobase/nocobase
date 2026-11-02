import { refreshRealtimeQueries } from '@nocobase/app-client';
import {
  QueryClient,
  QueryClientProvider,
  QueryObserver,
  onlineManager,
} from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

import { PmQueryClient } from '../../client/api/invalidate-queries.js';
import { useOlderPages } from '../../client/pages/issues/detail/use-older-pages.js';

const clients: QueryClient[] = [];
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

it.each([
  ['threads', 'detail-first'],
  ['threads', 'history-first'],
  ['threads', 'history-ahead'],
  ['threads', 'realtime'],
  ['activities', 'detail-first'],
  ['activities', 'history-first'],
  ['activities', 'history-ahead'],
  ['activities', 'realtime'],
] as const)(
  'retains loaded %s across a multi-page burst (%s)',
  async (kind, order) => {
    const client = new PmQueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    clients.push(client);
    let rows = Array.from({ length: 10 }, (_, i) => ({
      id: String(i + 1),
      text: 'original',
    }));
    const read = vi.fn(async (cursor?: string) => {
      const end = cursor
        ? rows.findIndex((row) => row.id === cursor)
        : rows.length;
      const start = Math.max(0, end - 2);
      return {
        data: rows.slice(start, end),
        nextCursor: start ? rows[start]!.id : null,
      };
    });
    function Wrapper({ children }: { readonly children: ReactNode }) {
      return (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      );
    }
    const { result, rerender } = renderHook(
      ({ issue, cursor, boundary }) =>
        useOlderPages(issue, kind, cursor, boundary, read, (row) => row.id),
      {
        initialProps: { issue: 'issue-one', cursor: '9', boundary: '9' },
        wrapper: Wrapper,
      },
    );
    expect(result.current.items).toEqual([]);
    act(() => result.current.loadMore());
    await waitFor(() =>
      expect(result.current.items.map((row) => row.id)).toEqual([
        '7',
        '8',
        '9',
        '10',
      ]),
    );
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items[0]?.id).toBe('5'));
    const loadMore = result.current.loadMore;
    const items = result.current.items;
    rerender({ issue: 'issue-one', cursor: '9', boundary: '9' });
    expect(result.current.items).toBe(items);
    read.mockClear();
    rows = [
      ...rows.map((row) => (row.id === '7' ? { ...row, text: 'edited' } : row)),
      ...Array.from({ length: 7 }, (_, i) => ({
        id: String(i + 11),
        text: 'new',
      })),
    ];
    // History can even include a newer comment than the detail snapshot has seen.
    if (order === 'history-ahead') rows.push({ id: '18', text: 'ahead' });
    if (order !== 'detail-first') {
      await act(async () => {
        if (order === 'realtime')
          await refreshRealtimeQueries(client, {
            queryKey: ['pm', 'issue', 'issue-one'],
          });
        else
          await client.invalidateQueries({
            queryKey: ['pm', 'issue', 'issue-one'],
          });
      });
    }
    rerender({ issue: 'issue-one', cursor: '16', boundary: '16' });
    await waitFor(() =>
      expect(result.current.items.map((row) => row.id)).toEqual(
        Array.from({ length: rows.length - 4 }, (_, i) => String(i + 5)),
      ),
    );
    expect(result.current.items.find((row) => row.id === '7')?.text).toBe(
      'edited',
    );
    expect(result.current.loadMore).toBe(loadMore);
    // One refresh to the old boundary, then the already-loaded second page. No second complete refresh.
    expect(read).toHaveBeenCalledTimes(7);
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items[0]?.id).toBe('3'));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.hasMore).toBe(false));
    expect(result.current.items.map((row) => row.id)).toEqual(
      rows.map((row) => row.id),
    );
    rerender({ issue: 'issue-two', cursor: '16', boundary: '16' });
    expect(result.current.items).toEqual([]);
    rows = [...rows, { id: String(rows.length + 1), text: 'after navigation' }];
    const boundary = rows.at(-2)!.id;
    rerender({ issue: 'issue-one', cursor: boundary, boundary });
    await waitFor(() =>
      expect(result.current.items.map((row) => row.id)).toEqual(
        rows.map((row) => row.id),
      ),
    );
  },
);

it.each(['threads', 'activities'] as const)(
  'keeps an in-flight %s page and coalesces invalidations during loading and refreshing',
  async (kind) => {
    const client = new PmQueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    clients.push(client);
    let text = 'old';
    let hold = false;
    let release: (() => void) | undefined;
    const rows = Array.from({ length: 10 }, (_, i) => ({ id: String(i + 1) }));
    const read = vi.fn(async (cursor?: string) => {
      const end = cursor
        ? rows.findIndex((row) => row.id === cursor)
        : rows.length;
      const start = Math.max(0, end - 2);
      const page = {
        data: rows.slice(start, end).map((row) => ({ ...row, text })),
        nextCursor: start ? rows[start]!.id : null,
      };
      if (hold) {
        hold = false;
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      }
      return page;
    });
    function Wrapper({ children }: { readonly children: ReactNode }) {
      return (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      );
    }
    const { result } = renderHook(
      () => useOlderPages('race', kind, '9', '9', read, (row) => row.id),
      { wrapper: Wrapper },
    );
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toHaveLength(4));
    read.mockClear();
    hold = true;
    act(() => result.current.loadMore());
    await waitFor(() => expect(release).toBeDefined());
    text = 'edited during loading';
    const refresh = () => client.invalidateQueries({ queryKey: ['pm'] });
    const pending = [refresh(), refresh(), refresh()];
    await act(async () => {
      release!();
      await Promise.all(pending);
    });
    await waitFor(() =>
      expect(result.current.items.map((row) => row.id)).toEqual([
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
      ]),
    );
    await waitFor(() =>
      expect(result.current.items.every((row) => row.text === text)).toBe(true),
    );
    // One next-page read, then B + P - 1 = 2 + 2 - 1 reads for the expanded range.
    expect(read).toHaveBeenCalledTimes(4);
    read.mockClear();
    release = undefined;
    hold = true;
    const firstRefresh = refresh();
    await waitFor(() => expect(release).toBeDefined());
    text = 'edited during refresh';
    const trailing = [refresh(), refresh(), refresh()];
    await act(async () => {
      release!();
      await Promise.all([firstRefresh, ...trailing]);
    });
    await waitFor(() =>
      expect(result.current.items.every((row) => row.text === text)).toBe(true),
    );
    expect(read).toHaveBeenCalledTimes(6);
    read.mockClear();
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items[0]?.id).toBe('3'));
    expect(read).toHaveBeenCalledTimes(1);
  },
);

it.each(['inactive', 'removed', 'failure'] as const)(
  'does not spin or recreate history after %s while a page is pending',
  async (stop) => {
    const client = new PmQueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    clients.push(client);
    let release: (() => void) | undefined;
    let pending = false;
    const read = vi.fn(async (cursor?: string) => {
      if (pending) {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        if (stop === 'failure') throw new Error('Unavailable');
      }
      return {
        data: [{ id: cursor ?? '3' }],
        nextCursor: cursor === '2' ? '1' : '2',
      };
    });
    function Wrapper({ children }: { readonly children: ReactNode }) {
      return (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      );
    }
    const { result, unmount } = renderHook(
      () => useOlderPages('stop', 'threads', '2', '3', read, (row) => row.id),
      { wrapper: Wrapper },
    );
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    pending = true;
    act(() => result.current.loadMore());
    await waitFor(() => expect(release).toBeDefined());
    const key = ['pm', 'issue', 'stop', 'threads'];
    const refresh = client.invalidateQueries({ queryKey: key });
    if (stop === 'inactive') unmount();
    if (stop === 'removed') {
      unmount();
      client.removeQueries({ queryKey: key });
    }
    pending = false;
    await act(async () => {
      release!();
      await refresh;
    });
    if (stop === 'removed') expect(client.getQueryData(key)).toBeUndefined();
    if (stop === 'inactive')
      expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    // Failed next-page reads permit one requested refresh, but no self-triggered retry loop.
    expect(read).toHaveBeenCalledTimes(stop === 'failure' ? 5 : 3);
  },
);

it('leaves inactive history stale and uses ordinary semantics for non-history reads', async () => {
  const client = new PmQueryClient();
  clients.push(client);
  const history = ['pm', 'issue', 'inactive', 'threads'];
  client.setQueryData(history, { pages: [], pageParams: [] });
  const read = vi.fn(async () => 'detail');
  const observer = new QueryObserver(client, {
    queryKey: ['pm', 'issue', 'active'],
    queryFn: read,
  });
  const off = observer.subscribe(() => undefined);
  await waitFor(() => expect(observer.getCurrentResult().data).toBe('detail'));
  read.mockClear();
  await client.invalidateQueries({ queryKey: ['pm'] });
  expect(client.getQueryState(history)?.isInvalidated).toBe(true);
  expect(read).toHaveBeenCalledTimes(1);
  off();
});

it('does not loop while offline and resumes the existing read on reconnect', async () => {
  const client = new PmQueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  client.mount();
  const read = vi.fn(async () => 'new');
  const key = ['pm', 'issue', 'offline', 'threads'];
  client.setQueryData(key, 'old');
  const observer = new QueryObserver(client, {
    queryKey: key,
    queryFn: read,
    staleTime: Infinity,
  });
  const off = observer.subscribe(() => undefined);
  try {
    onlineManager.setOnline(false);
    await client.invalidateQueries({ queryKey: ['pm'] });
    expect(client.getQueryState(key)?.fetchStatus).toBe('paused');
    expect(read).not.toHaveBeenCalled();
    const pending = client.invalidateQueries({ queryKey: key });
    onlineManager.setOnline(true);
    await pending;
    expect(observer.getCurrentResult().data).toBe('new');
    expect(read).toHaveBeenCalledTimes(2);
  } finally {
    onlineManager.setOnline(true);
    off();
    client.unmount();
  }
});
