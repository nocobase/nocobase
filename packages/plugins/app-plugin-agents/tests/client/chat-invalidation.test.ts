import { afterEach, expect, it, vi } from 'vitest';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import {
  CHAT_INVALIDATION_MS,
  coalescedInvalidation,
} from '../../client/chat/coalesced-invalidation.js';
afterEach(() => vi.useRealTimers());

it('coalesces bursts and keeps a trailing snapshot without cancelling the current read', async () => {
  vi.useFakeTimers();
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity } },
  });
  const blocked = Promise.withResolvers<number>();
  const read = vi
    .fn()
    .mockResolvedValueOnce(1)
    .mockReturnValueOnce(blocked.promise)
    .mockResolvedValue(3);
  const observer = new QueryObserver(client, {
    queryKey: ['chat', 'one'],
    queryFn: read,
  });
  const off = observer.subscribe(() => {});
  await vi.advanceTimersByTimeAsync(0);
  const stale = coalescedInvalidation(client);
  try {
    for (let i = 0; i < 5; i++) stale.add(['chat']);
    await vi.advanceTimersByTimeAsync(CHAT_INVALIDATION_MS);
    expect(read).toHaveBeenCalledTimes(2);
    stale.add(['chat']);
    await vi.advanceTimersByTimeAsync(CHAT_INVALIDATION_MS);
    expect(read).toHaveBeenCalledTimes(2);
    blocked.resolve(2);
    await vi.advanceTimersByTimeAsync(CHAT_INVALIDATION_MS);
    expect(read).toHaveBeenCalledTimes(3);
    expect(observer.getCurrentResult().data).toBe(3);
    stale.add(['chat']);
    stale.stop();
    await vi.advanceTimersByTimeAsync(CHAT_INVALIDATION_MS);
    expect(read).toHaveBeenCalledTimes(3);
  } finally {
    stale.stop();
    off();
    client.clear();
  }
});

it('limits read receipts to the exact detail and lets a broader change subsume them', async () => {
  vi.useFakeTimers();
  const client = new QueryClient();
  const detail = vi.fn(async () => 1),
    links = vi.fn(async () => 2);
  const off = [
    new QueryObserver(client, {
      queryKey: ['chat', 'one'],
      queryFn: detail,
      staleTime: Infinity,
    }).subscribe(() => {}),
    new QueryObserver(client, {
      queryKey: ['chat', 'one', 'links'],
      queryFn: links,
      staleTime: Infinity,
    }).subscribe(() => {}),
  ];
  await vi.advanceTimersByTimeAsync(0);
  const stale = coalescedInvalidation(client);
  try {
    stale.add(['chat', 'one'], true);
    await vi.advanceTimersByTimeAsync(CHAT_INVALIDATION_MS);
    expect(detail).toHaveBeenCalledTimes(2);
    expect(links).toHaveBeenCalledTimes(1);
    stale.add(['chat', 'one'], true);
    stale.add(['chat', 'one']);
    await vi.advanceTimersByTimeAsync(CHAT_INVALIDATION_MS);
    expect(detail).toHaveBeenCalledTimes(3);
    expect(links).toHaveBeenCalledTimes(2);
  } finally {
    stale.stop();
    off.forEach((stop) => stop());
    client.clear();
  }
});
