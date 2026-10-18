import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createRealtimeRefresh } from '../src/realtime.js';

const releases: (() => void)[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  for (const release of releases.splice(0)) release();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it('coalesces bursts and preserves one follow-up during an in-flight read', async () => {
  let finish: (() => void) | undefined;
  const refresh = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const scheduler = createRealtimeRefresh(refresh);
  releases.push(() => scheduler.close());
  scheduler.request();
  scheduler.request();
  await vi.advanceTimersByTimeAsync(100);
  expect(refresh).toHaveBeenCalledOnce();
  scheduler.request();
  scheduler.request();
  await vi.advanceTimersByTimeAsync(500);
  expect(refresh).toHaveBeenCalledOnce();
  finish?.();
  await vi.advanceTimersByTimeAsync(100);
  expect(refresh).toHaveBeenCalledTimes(2);
  finish?.();
  await vi.advanceTimersByTimeAsync(500);
  expect(refresh).toHaveBeenCalledTimes(2);
});
it('waits for visibility and cancels scheduled and in-flight work on cleanup', async () => {
  const document = Object.assign(new EventTarget(), {
    visibilityState: 'hidden',
  });
  vi.stubGlobal('document', document);
  let signal: AbortSignal | undefined;
  const refresh = vi.fn((value: AbortSignal) => {
    signal = value;
  });
  const scheduler = createRealtimeRefresh(refresh);
  releases.push(() => scheduler.close());
  scheduler.request();
  await vi.advanceTimersByTimeAsync(1000);
  expect(refresh).not.toHaveBeenCalled();
  document.visibilityState = 'visible';
  document.dispatchEvent(new Event('visibilitychange'));
  await vi.advanceTimersByTimeAsync(100);
  expect(refresh).toHaveBeenCalledOnce();
  scheduler.request();
  scheduler.close();
  expect(signal?.aborted).toBe(true);
  await vi.advanceTimersByTimeAsync(1000);
  expect(refresh).toHaveBeenCalledOnce();
});
it('reports failures and permits later recovery', async () => {
  const onError = vi.fn();
  const refresh = vi
    .fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue(undefined);
  const scheduler = createRealtimeRefresh(refresh, { onError });
  releases.push(() => scheduler.close());
  scheduler.request();
  await vi.advanceTimersByTimeAsync(100);
  expect(onError).toHaveBeenCalledOnce();
  scheduler.request();
  await vi.advanceTimersByTimeAsync(100);
  expect(refresh).toHaveBeenCalledTimes(2);
});
