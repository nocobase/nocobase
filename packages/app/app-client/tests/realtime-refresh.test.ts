import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ApiClientError } from '@nocobase/api-client';
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
it('recovers a transient failure without another event', async () => {
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
  expect(scheduler.snapshot).toMatchObject({ status: 'retrying', stale: true });
  await vi.advanceTimersByTimeAsync(1_000);
  expect(refresh).toHaveBeenCalledTimes(2);
  expect(scheduler.snapshot).toMatchObject({
    status: 'idle',
    stale: false,
    failures: 0,
  });
  expect(scheduler.snapshot.lastSuccessfulRefresh).toBeDefined();
});

it('stops after the retry budget, remains stale and allows a manual retry', async () => {
  const refresh = vi.fn().mockRejectedValue(new Error('offline'));
  const scheduler = createRealtimeRefresh(refresh, {
    retries: 2,
    retryDelayMs: 10,
    delayMs: 1,
    onError: vi.fn(),
  });
  releases.push(scheduler.close);
  scheduler.request();
  await vi.advanceTimersByTimeAsync(1_000);
  expect(refresh).toHaveBeenCalledTimes(3);
  expect(scheduler.snapshot).toMatchObject({
    status: 'failed',
    stale: true,
    failures: 3,
  });
  scheduler.request();
  await vi.advanceTimersByTimeAsync(1_000);
  expect(refresh).toHaveBeenCalledTimes(3);
  refresh.mockResolvedValue(undefined);
  scheduler.retry();
  await vi.advanceTimersByTimeAsync(1);
  expect(scheduler.snapshot).toMatchObject({ status: 'idle', stale: false });
});

it.each([401, 403, 404])(
  'does not automatically repeat HTTP %i refusals',
  async (status) => {
    const error = new ApiClientError('Denied', {
      status,
      method: 'GET',
      url: '/inbox',
    });
    const refresh = vi.fn().mockRejectedValue(error);
    const scheduler = createRealtimeRefresh(refresh, { onError: vi.fn() });
    releases.push(scheduler.close);
    scheduler.request();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(refresh).toHaveBeenCalledOnce();
    expect(scheduler.snapshot).toMatchObject({
      status: 'failed',
      stale: true,
      error,
    });
  },
);

it('cancels failed refresh retries on cleanup', async () => {
  const refresh = vi.fn().mockRejectedValue(new Error('offline'));
  const scheduler = createRealtimeRefresh(refresh, { onError: vi.fn() });
  scheduler.request();
  await vi.advanceTimersByTimeAsync(100);
  scheduler.close();
  await vi.advanceTimersByTimeAsync(120_000);
  expect(refresh).toHaveBeenCalledOnce();
  expect(scheduler.snapshot.status).toBe('closed');
});

it('reconciles only when configured and pauses interval reads in hidden documents', async () => {
  const document = Object.assign(new EventTarget(), {
    visibilityState: 'visible',
  });
  vi.stubGlobal('document', document);
  const refresh = vi.fn();
  const scheduler = createRealtimeRefresh(refresh, {
    refreshIntervalMs: 1_000,
    delayMs: 1,
  });
  releases.push(scheduler.close);
  await vi.advanceTimersByTimeAsync(1_001);
  expect(refresh).toHaveBeenCalledOnce();
  document.visibilityState = 'hidden';
  await vi.advanceTimersByTimeAsync(3_000);
  expect(refresh).toHaveBeenCalledOnce();
  document.visibilityState = 'visible';
  document.dispatchEvent(new Event('visibilitychange'));
  await vi.advanceTimersByTimeAsync(1);
  expect(refresh).toHaveBeenCalledTimes(2);
  scheduler.close();
  await vi.advanceTimersByTimeAsync(3_000);
  expect(refresh).toHaveBeenCalledTimes(2);
});
