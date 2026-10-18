import {
  QueryClient,
  QueryObserver,
  type QueryFilters,
} from '@tanstack/react-query';
import { afterEach, expect, it } from 'vitest';
import { refreshRealtimeQueries } from '../src/realtime-query.js';

const cleanup: (() => void)[] = [];
afterEach(() =>
  cleanup
    .splice(0)
    .reverse()
    .forEach((close) => close()),
);

function fixture(initialData?: number) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  cleanup.push(() => client.clear());
  let complete!: (value: number) => void;
  let reads = 0;
  const observer = new QueryObserver(client, {
    queryKey: ['sessions', 'list', false],
    queryFn: () =>
      ++reads === 1
        ? new Promise<number>((resolve) => {
            complete = resolve;
          })
        : Promise.resolve(2),
    initialData,
  });
  cleanup.push(observer.subscribe(() => undefined));
  return {
    client,
    observer,
    complete: (value: number) => complete(value),
    reads: () => reads,
  };
}

it.each([
  ['prefix', { queryKey: ['sessions'] }],
  ['exact', { queryKey: ['sessions', 'list', false], exact: true }],
  ['predicate', { predicate: (query) => query.queryKey[0] === 'sessions' }],
] satisfies [string, QueryFilters][])(
  'follows a pre-event request with a fresh snapshot for a %s match',
  async (_name, filters) => {
    const { client, observer, complete } = fixture(0);
    const refreshed = refreshRealtimeQueries(client, filters);
    complete(1);
    await refreshed;
    expect(observer.getCurrentResult().data).toBe(2);
  },
);

it('also catches up when the event arrives during initial loading', async () => {
  const { client, observer, complete } = fixture();
  const refreshed = refreshRealtimeQueries(client, { queryKey: ['sessions'] });
  complete(1);
  await refreshed;
  expect(observer.getCurrentResult().data).toBe(2);
});

it('keeps an unobserved snapshot invalid after its old read completes', async () => {
  const { client, observer, complete, reads } = fixture(0);
  observer.destroy();
  const refreshed = refreshRealtimeQueries(client, { queryKey: ['sessions'] });
  complete(1);
  await refreshed;
  expect(client.getQueryState(['sessions', 'list', false])?.isInvalidated).toBe(
    true,
  );
  expect(reads()).toBe(1);
});

it.each(['abort', 'remove'] as const)(
  'does not launch a follow-up after %s',
  async (mode) => {
    const { client, complete, reads } = fixture(0);
    const controller = new AbortController();
    const refreshed = refreshRealtimeQueries(client, {}, controller.signal);
    if (mode === 'abort') controller.abort();
    else client.clear();
    complete(1);
    await refreshed;
    expect(reads()).toBe(1);
  },
);

it('reports a failed fresh read and leaves it invalid for recovery', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  cleanup.push(() => client.clear());
  const error = new Error('Unavailable');
  const observer = new QueryObserver(client, {
    queryKey: ['inbox'],
    initialData: 1,
    staleTime: Infinity,
    queryFn: () => Promise.reject(error),
  });
  cleanup.push(observer.subscribe(() => undefined));
  await expect(refreshRealtimeQueries(client)).rejects.toBe(error);
  expect(client.getQueryState(['inbox'])?.isInvalidated).toBe(true);
});
