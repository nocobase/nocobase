// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const invalidate = vi.hoisted(() => vi.fn());
vi.mock('../../client/query.js', () => ({
  agentsQueryClient: () => ({ invalidateQueries: invalidate }),
}));
import { useQuotaClock } from '../../client/hooks/use-quota-expiry.js';
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});
it('shares one expiry timer, keeps stable subscriptions for equivalent arrays and targets eligibility views', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
  const reset = '2030-01-01T01:00:00Z';
  const first = renderHook(() => useQuotaClock([reset]));
  const second = renderHook(() => useQuotaClock([reset]));
  expect(vi.getTimerCount()).toBe(1);
  first.rerender();
  expect(vi.getTimerCount()).toBe(1);
  act(() => vi.advanceTimersByTime(3_600_026));
  expect(first.result.current).toBe(Date.now() - 1);
  expect(second.result.current).toBe(first.result.current);
  expect(invalidate).toHaveBeenCalledTimes(1);
  const predicate = invalidate.mock.calls[0][0].predicate;
  for (const queryKey of [
    ['agents', 'agents'],
    ['agents', 'available'],
    ['agents', 'chat', 'agents'],
    ['agents', 'runners', 'detail', 'r1'],
  ])
    expect(predicate({ queryKey })).toBe(true);
  for (const queryKey of [
    ['agents', 'runs'],
    ['agents', 'runners', 'runs', 'r1'],
    ['agents', 'skills'],
  ])
    expect(predicate({ queryKey })).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
});
