import { afterEach, expect, it, vi } from 'vitest';

import {
  CHAT_INVALIDATION_MS,
  coalescedInvalidation,
} from '../../client/chat/coalesced-invalidation.js';

afterEach(() => vi.useRealTimers());

it('reads each query a burst of announcements names once', async () => {
  vi.useFakeTimers();
  const invalidateQueries = vi.fn(() => Promise.resolve());
  const stale = coalescedInvalidation({ invalidateQueries });
  for (let i = 0; i < 5; i++) {
    stale.add(['agents', 'chat', 'conversations']);
    stale.add(['agents', 'chat', 'conversation', 'c1']);
  }
  expect(invalidateQueries).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(CHAT_INVALIDATION_MS);
  expect(invalidateQueries.mock.calls).toEqual([
    [{ queryKey: ['agents', 'chat', 'conversations'] }],
    [{ queryKey: ['agents', 'chat', 'conversation', 'c1'] }],
  ]);
  stale.add(['agents', 'chat', 'conversations']);
  stale.stop();
  await vi.advanceTimersByTimeAsync(CHAT_INVALIDATION_MS);
  expect(invalidateQueries).toHaveBeenCalledTimes(2);
});
