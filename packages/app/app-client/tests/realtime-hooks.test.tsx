import { act, renderHook } from '@testing-library/react';
import {
  createRealtimeClient,
  type RealtimeWatchOptions,
} from '@nocobase/realtime/client';
import { ServiceContainer } from '@nocobase/service-provider';
import type { PropsWithChildren } from 'react';
import { expect, it, vi } from 'vitest';
import {
  realtimeClientToken,
  type ClientApplication,
} from '../src/application.js';
import { ClientApplicationContext } from '../src/application-context.js';
import {
  useRealtimeReadiness,
  useRealtimeRefresh,
  useRealtimeTopic,
} from '../src/realtime.js';

it('keeps callbacks current without subscription churn and releases disabled or replaced topics', () => {
  const realtime = createRealtimeClient({ resolveUrl: () => undefined });
  const callbacks: RealtimeWatchOptions<unknown>[] = [];
  const close = vi.fn();
  const watch = vi
    .spyOn(realtime, 'watch')
    .mockImplementation((_topic, options = {}) => {
      callbacks.push(options as RealtimeWatchOptions<unknown>);
      return { state: 'subscribed', error: undefined, retry: () => {}, close };
    });
  const services = new ServiceContainer();
  services.instance(realtimeClientToken, realtime);
  const app = { services } as unknown as ClientApplication;
  const first = vi.fn();
  const second = vi.fn();
  const hook = renderHook(
    ({ topic, listener, enabled }) =>
      useRealtimeTopic(topic, listener, { enabled }),
    {
      initialProps: { topic: 'test:one', listener: first, enabled: true },
      wrapper: ({ children }: PropsWithChildren) => (
        <ClientApplicationContext value={app}>
          {children}
        </ClientApplicationContext>
      ),
    },
  );
  hook.rerender({ topic: 'test:one', listener: second, enabled: true });
  expect(watch).toHaveBeenCalledOnce();
  act(() =>
    callbacks[0]?.onEvent?.({
      type: 'event',
      topic: 'test:one',
      payload: 'changed',
      publishedAt: new Date().toISOString(),
    }),
  );
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledOnce();
  hook.rerender({ topic: 'test:two', listener: second, enabled: true });
  expect(close).toHaveBeenCalledOnce();
  expect(watch).toHaveBeenCalledTimes(2);
  hook.rerender({ topic: 'test:two', listener: second, enabled: false });
  expect(close).toHaveBeenCalledTimes(2);
  hook.unmount();
  realtime.close();
});

it('exposes refresh recovery and subscription errors without resubscribing on callback changes', async () => {
  vi.useFakeTimers();
  const realtime = createRealtimeClient({ resolveUrl: () => undefined });
  let callbacks: RealtimeWatchOptions<unknown> = {};
  const close = vi.fn();
  const watch = vi
    .spyOn(realtime, 'watch')
    .mockImplementation((_topic, options = {}) => {
      callbacks = options as RealtimeWatchOptions<unknown>;
      return { state: 'subscribed', error: undefined, retry: vi.fn(), close };
    });
  const services = new ServiceContainer();
  services.instance(realtimeClientToken, realtime);
  const app = { services } as unknown as ClientApplication;
  const refresh = vi
    .fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue(undefined);
  const onSubscriptionError = vi.fn();
  const hook = renderHook(
    () =>
      useRealtimeRefresh('test:one', refresh, {
        delayMs: 1,
        retryDelayMs: 1,
        onError: vi.fn(),
        onSubscriptionError,
        shouldRetry: () => true,
      }),
    {
      wrapper: ({ children }: PropsWithChildren) => (
        <ClientApplicationContext value={app}>
          {children}
        </ClientApplicationContext>
      ),
    },
  );
  try {
    act(() => callbacks.onReady?.());
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(hook.result.current).toMatchObject({
      status: 'retrying',
      stale: true,
    });
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(hook.result.current).toMatchObject({ status: 'idle', stale: false });
    const error = {
      type: 'error' as const,
      code: 'FORBIDDEN',
      message: 'Denied',
    };
    act(() => callbacks.onError?.(error));
    expect(onSubscriptionError).toHaveBeenCalledWith(error);
    expect(watch).toHaveBeenCalledOnce();
    act(() => hook.result.current.retry());
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(refresh).toHaveBeenCalledTimes(3);
  } finally {
    hook.unmount();
    realtime.close();
    vi.useRealTimers();
  }
  expect(close).toHaveBeenCalledOnce();
});

it('gates the first snapshot on both topics and recovers from a refused topic or reconnect', async () => {
  vi.useFakeTimers();
  const realtime = createRealtimeClient({ resolveUrl: () => undefined });
  const callbacks: RealtimeWatchOptions<unknown>[] = [];
  const close = vi.fn();
  vi.spyOn(realtime, 'watch').mockImplementation((_topic, options = {}) => {
    callbacks.push(options as RealtimeWatchOptions<unknown>);
    return { state: 'pending', error: undefined, retry: vi.fn(), close };
  });
  const services = new ServiceContainer();
  services.instance(realtimeClientToken, realtime);
  const app = { services } as unknown as ClientApplication;
  const recover = vi.fn();
  const hook = renderHook(() => useRealtimeReadiness(['one', 'two'], recover), {
    wrapper: ({ children }: PropsWithChildren) => (
      <ClientApplicationContext value={app}>
        {children}
      </ClientApplicationContext>
    ),
  });
  try {
    expect(hook.result.current).toBe(false);
    act(() => callbacks[0]!.onReady!());
    expect(hook.result.current).toBe(false);
    act(() => callbacks[1]!.onReady!());
    expect(hook.result.current).toBe(true);
    expect(recover).not.toHaveBeenCalled();
    act(() => callbacks.forEach((each) => each.onStateChange!('pending')));
    act(() => callbacks[0]!.onReady!());
    expect(recover).not.toHaveBeenCalled();
    act(() => callbacks[1]!.onReady!());
    expect(recover).toHaveBeenCalledOnce();
  } finally {
    hook.unmount();
    vi.useRealTimers();
    realtime.close();
  }
  expect(close).toHaveBeenCalledTimes(2);
});

it('allows HTTP snapshots when a topic never acknowledges', async () => {
  vi.useFakeTimers();
  const realtime = createRealtimeClient({ resolveUrl: () => undefined });
  let callbacks: RealtimeWatchOptions<unknown> = {};
  vi.spyOn(realtime, 'watch').mockImplementation((_topic, options = {}) => {
    callbacks = options as RealtimeWatchOptions<unknown>;
    return {
      state: 'pending',
      error: undefined,
      retry: vi.fn(),
      close: vi.fn(),
    };
  });
  const services = new ServiceContainer();
  services.instance(realtimeClientToken, realtime);
  const app = { services } as unknown as ClientApplication;
  const recover = vi.fn();
  const hook = renderHook(() => useRealtimeReadiness(['one'], recover), {
    wrapper: ({ children }: PropsWithChildren) => (
      <ClientApplicationContext value={app}>
        {children}
      </ClientApplicationContext>
    ),
  });
  try {
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(hook.result.current).toBe(true);
    act(() => callbacks.onReady!());
    expect(recover).toHaveBeenCalledOnce();
  } finally {
    hook.unmount();
    vi.useRealTimers();
    realtime.close();
  }
});
