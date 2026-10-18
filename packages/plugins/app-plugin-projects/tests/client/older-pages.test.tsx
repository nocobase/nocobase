import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, expect, it } from 'vitest';

import { useOlderPages } from '../../client/pages/issues/detail/use-older-pages.js';

const clients: QueryClient[] = [];
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

it.each(['threads', 'activities'] as const)(
  'retains loaded %s and fills a burst spanning several newest pages',
  async (kind) => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    clients.push(client);
    let rows = Array.from({ length: 10 }, (_, i) => ({
      id: String(i + 1),
      text: 'original',
    }));
    const read = async (cursor?: string) => {
      const end = cursor
        ? rows.findIndex((row) => row.id === cursor)
        : rows.length;
      const start = Math.max(0, end - 2);
      return {
        data: rows.slice(start, end),
        nextCursor: start ? rows[start]!.id : null,
      };
    };
    function Wrapper({ children }: { readonly children: ReactNode }) {
      return (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      );
    }
    const { result, rerender } = renderHook(
      ({ issue, cursor }) =>
        useOlderPages(issue, kind, cursor, read, (row) => row.id),
      {
        initialProps: { issue: 'issue-one', cursor: '9' },
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
    rows = [
      ...rows.map((row) => (row.id === '7' ? { ...row, text: 'edited' } : row)),
      ...Array.from({ length: 7 }, (_, i) => ({
        id: String(i + 11),
        text: 'new',
      })),
    ];
    rerender({ issue: 'issue-one', cursor: '16' });
    await waitFor(() =>
      expect(result.current.items.map((row) => row.id)).toEqual(
        Array.from({ length: 13 }, (_, i) => String(i + 5)),
      ),
    );
    expect(result.current.items.find((row) => row.id === '7')?.text).toBe(
      'edited',
    );
    expect(result.current.loadMore).toBe(loadMore);
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items[0]?.id).toBe('3'));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.hasMore).toBe(false));
    expect(result.current.items.map((row) => row.id)).toEqual(
      rows.map((row) => row.id),
    );
    rerender({ issue: 'issue-two', cursor: '16' });
    expect(result.current.items).toEqual([]);
  },
);
