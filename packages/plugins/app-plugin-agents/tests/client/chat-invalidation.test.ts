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
