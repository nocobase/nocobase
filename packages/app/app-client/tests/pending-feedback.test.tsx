import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { usePendingFeedback } from '../src/pending-feedback.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('shows at 300ms, explains at 10s, and clears immediately on completion', () => {
  const { result, rerender } = renderHook(
    ({ busy }) => usePendingFeedback(busy),
    { initialProps: { busy: true } },
  );
  act(() => vi.advanceTimersByTime(299));
  expect(result.current).toEqual({ visible: false, longWaiting: false });
  act(() => vi.advanceTimersByTime(1));
  expect(result.current).toEqual({ visible: true, longWaiting: false });
  act(() => vi.advanceTimersByTime(9699));
  expect(result.current.longWaiting).toBe(false);
  act(() => vi.advanceTimersByTime(1));
  expect(result.current.longWaiting).toBe(true);
  rerender({ busy: false });
  expect(result.current).toEqual({ visible: false, longWaiting: false });
  expect(vi.getTimerCount()).toBe(0);
});

it('suppresses fast requests and resets for consecutive operations and identity changes', () => {
  const { result, rerender, unmount } = renderHook(
    ({ busy, identity }) => usePendingFeedback(busy, identity),
    { initialProps: { busy: true, identity: 'a' }, wrapper: StrictMode },
  );
  act(() => vi.advanceTimersByTime(299));
  rerender({ busy: false, identity: 'a' });
  act(() => vi.advanceTimersByTime(10_000));
  expect(result.current.visible).toBe(false);
  rerender({ busy: true, identity: 'a' });
  act(() => vi.advanceTimersByTime(300));
  expect(result.current.visible).toBe(true);
  rerender({ busy: true, identity: 'b' });
  expect(result.current.visible).toBe(false);
  act(() => vi.advanceTimersByTime(299));
  expect(result.current.visible).toBe(false);
  act(() => vi.advanceTimersByTime(1));
  expect(result.current.visible).toBe(true);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it('keeps independent operations separate and idle allocates no timers', () => {
  const first = renderHook(() => usePendingFeedback(true));
  const second = renderHook(({ busy }) => usePendingFeedback(busy), {
    initialProps: { busy: false },
  });
  expect(vi.getTimerCount()).toBe(2);
  act(() => vi.advanceTimersByTime(300));
  second.rerender({ busy: true });
  expect(first.result.current.visible).toBe(true);
  expect(second.result.current.visible).toBe(false);
});

it('does not impose a minimum display duration after a visible wait', () => {
  const { result, rerender } = renderHook(
    ({ busy }) => usePendingFeedback(busy),
    { initialProps: { busy: true } },
  );
  act(() => vi.advanceTimersByTime(301));
  expect(result.current.visible).toBe(true);
  rerender({ busy: false });
  expect(result.current.visible).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
});
