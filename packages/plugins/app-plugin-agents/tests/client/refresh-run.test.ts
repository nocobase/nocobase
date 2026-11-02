// @vitest-environment jsdom
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { afterEach, expect, test, vi } from 'vitest';

import { agentsKeys } from '../../client/api/keys.js';
import { refreshRunDetail } from '../../client/runs/refresh-run.js';

const clients: QueryClient[] = [];
const subscriptions: (() => void)[] = [];

function client(): QueryClient {
  const value = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(value);
  return value;
}

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

afterEach(() => {
  for (const stop of subscriptions.splice(0)) stop();
  for (const value of clients.splice(0)) value.clear();
});

test.each(['queued', 'completed'])(
  'a notification replaces an unfinished first read with %s',
  async (status) => {
    const cache = client();
    const first = deferred<{ status: string }>();
    const read = vi
      .fn<() => Promise<{ status: string }>>()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValue({ status });
    const observer = new QueryObserver(cache, {
      queryKey: agentsKeys.run('changed'),
      queryFn: read,
    });
    subscriptions.push(observer.subscribe(() => {}));
    expect(read).toHaveBeenCalledTimes(1);
    expect(observer.getCurrentResult().data).toBeUndefined();

    const notification = refreshRunDetail(cache, 'changed');
    // The older response arrives after the server announced the new state.
    first.resolve({ status: 'running' });
    await notification;

    expect(observer.getCurrentResult().data).toEqual({ status });
    expect(cache.getQueryData(agentsKeys.run('changed'))).toEqual({ status });
    expect(read).toHaveBeenCalledTimes(2);
  },
);

test('keeps an existing detail visible while the announced state is read', async () => {
  const cache = client();
  const next = deferred<{ status: string }>();
  const read = vi.fn(() => next.promise);
  const key = agentsKeys.run('changed');
  cache.setQueryData(key, { status: 'running' });
  const observer = new QueryObserver(cache, {
    queryKey: key,
    queryFn: read,
    staleTime: Infinity,
  });
  subscriptions.push(observer.subscribe(() => {}));

  const notification = refreshRunDetail(cache, 'changed');
  await vi.waitFor(() => expect(read).toHaveBeenCalledTimes(1));
  expect(observer.getCurrentResult().data).toEqual({ status: 'running' });
  next.resolve({ status: 'queued' });
  await notification;
  expect(observer.getCurrentResult().data).toEqual({ status: 'queued' });
});

test('does not refetch another run or fetch an inactive detail', async () => {
  const cache = client();
  const read = vi
    .fn<() => Promise<{ status: string }>>()
    .mockResolvedValue({ status: 'running' });
  const otherKey = agentsKeys.run('other');
  const observer = new QueryObserver(cache, {
    queryKey: otherKey,
    queryFn: read,
    staleTime: Infinity,
  });
  subscriptions.push(observer.subscribe(() => {}));
  await cache.fetchQuery({ queryKey: otherKey, queryFn: read });
  cache.setQueryData(agentsKeys.run('inactive'), { status: 'queued' });

  await refreshRunDetail(cache, 'inactive');

  expect(read).toHaveBeenCalledTimes(1);
  expect(cache.getQueryState(otherKey)?.isInvalidated).toBe(false);
  expect(cache.getQueryState(agentsKeys.run('inactive'))?.isInvalidated).toBe(
    true,
  );
});
