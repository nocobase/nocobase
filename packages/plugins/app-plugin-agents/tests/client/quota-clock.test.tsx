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

it('does not rerender existing rows as later rows subscribe, and only updates due rows', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2031-01-01T00:00:00Z'));
  const renders = Array.from({ length: 50 }, () => vi.fn());
  renders.forEach((render, index) => {
    renderHook(() => {
      render();
      return useQuotaClock([
        new Date(Date.now() + 60_000 + index * 1000).toISOString(),
      ]);
    });
    vi.advanceTimersByTime(1);
  });
  expect(renders.map((render) => render.mock.calls.length)).toEqual(
    Array(50).fill(1),
  );
  act(() => vi.advanceTimersByTime(60_000));
  expect(renders[0]).toHaveBeenCalledTimes(2);
  expect(renders[49]).toHaveBeenCalledTimes(1);
});

it('new expired data must use current time without waiting for a future reset', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2032-01-01T00:00:00Z'));
  const { result, rerender } = renderHook(
    ({ reset }) => useQuotaClock([reset]),
    { initialProps: { reset: null as string | null } },
  );
  act(() => vi.advanceTimersByTime(120000));
  const expired = '2032-01-01T00:01:00Z';
  rerender({ reset: expired });
  console.log(
    JSON.stringify({
      clock: result.current,
      actual: Date.now(),
      expired: Date.parse(expired),
      timers: vi.getTimerCount(),
    }),
  );
  expect(result.current).toBeGreaterThanOrEqual(Date.parse(expired));
});

it('a later subscriber must not cancel an overdue expiry without notifying the expired row', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2033-01-01T00:00:00Z'));
  const reset = '2033-01-01T00:01:00Z';
  const first = renderHook(() => useQuotaClock([reset]));
  vi.setSystemTime(new Date('2033-01-01T00:02:00Z'));
  renderHook(() => useQuotaClock(['2033-01-01T00:03:00Z']));
  act(() => vi.advanceTimersByTime(61000));
  console.log(
    JSON.stringify({
      first: first.result.current,
      actual: Date.now(),
      reset: Date.parse(reset),
    }),
  );
  expect(first.result.current).toBeGreaterThanOrEqual(Date.parse(reset));
});

it('batches fifty simultaneous expiries without mount or unmount broadcasts', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2034-01-01T00:00:00Z'));
  const reset = new Date(Date.now() + 60_000).toISOString();
  const renders = Array.from({ length: 50 }, () => vi.fn());
  const rows = renders.map((render) =>
    renderHook(() => {
      render();
      return useQuotaClock([reset]);
    }),
  );
  expect(renders.map((render) => render.mock.calls.length)).toEqual(
    Array(50).fill(1),
  );
  expect(vi.getTimerCount()).toBe(1);
  expect(invalidate).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(60_026));
  expect(renders.map((render) => render.mock.calls.length)).toEqual(
    Array(50).fill(2),
  );
  expect(invalidate).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
  const later = renderHook(() =>
    useQuotaClock([new Date(Date.now() + 60_000).toISOString()]),
  );
  later.unmount();
  expect(renders.map((render) => render.mock.calls.length)).toEqual(
    Array(50).fill(2),
  );
  rows.forEach((row) => row.unmount());
  expect(vi.getTimerCount()).toBe(0);
  expect(invalidate).toHaveBeenCalledTimes(1);
});

it('settles overdue survivors when a row unsubscribes, without notifying removed or future rows', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2035-01-01T00:00:00Z'));
  const dueAt = new Date(Date.now() + 60_000).toISOString();
  const futureAt = new Date(Date.now() + 180_000).toISOString();
  const removedRender = vi.fn(),
    survivorRender = vi.fn(),
    futureRender = vi.fn();
  const removed = renderHook(() => {
    removedRender();
    return useQuotaClock([dueAt]);
  });
  const survivor = renderHook(() => {
    survivorRender();
    return useQuotaClock([dueAt]);
  });
  const future = renderHook(() => {
    futureRender();
    return useQuotaClock([futureAt]);
  });
  vi.setSystemTime(new Date(Date.now() + 120_000));
  removed.unmount();
  expect(survivor.result.current).toBeGreaterThanOrEqual(Date.parse(dueAt));
  expect(removedRender).toHaveBeenCalledTimes(1);
  expect(survivorRender).toHaveBeenCalledTimes(2);
  expect(futureRender).toHaveBeenCalledTimes(1);
  expect(invalidate).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(1);
  future.unmount();
  survivor.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
