import { ApiClientError } from '@nocobase/app-client';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSummary } from '../client/hooks/use-app-summary.js';
import type { AppSummary } from '../shared/releases.js';
import { appSummary } from './helpers/app-summary.js';

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

async function advance(ms: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('app summary refresh', () => {
  it('polls stable states, speeds up transitions and refreshes deployment records when they finish', async () => {
    const load = vi
      .fn<() => Promise<AppSummary>>()
      .mockResolvedValue(appSummary());
    const changed = vi.fn();
    const view = renderHook(() => useAppSummary('shop', load, changed));
    await advance(0);
    expect(view.result.current.data?.runtime.state).toBe('running');
    load.mockResolvedValue({
      ...appSummary('starting'),
      hasPendingDeployment: true,
    });
    await advance(4999);
    expect(load).toHaveBeenCalledTimes(1);
    await advance(1);
    expect(view.result.current.data?.hasPendingDeployment).toBe(true);
    load.mockResolvedValue(appSummary('stopped'));
    await advance(1500);
    expect(changed).toHaveBeenCalledTimes(1);
    expect(view.result.current.data?.runtime.state).toBe('stopped');
    await advance(5000);
    expect(load).toHaveBeenCalledTimes(4);
  });

  it('serializes a slow poll and coalesces explicit refreshes, discarding the obsolete response', async () => {
    const slow = deferred<AppSummary>();
    const fresh = deferred<AppSummary>();
    const load = vi
      .fn<() => Promise<AppSummary>>()
      .mockResolvedValueOnce(appSummary())
      .mockReturnValueOnce(slow.promise)
      .mockReturnValueOnce(fresh.promise);
    const view = renderHook(() => useAppSummary('shop', load, vi.fn()));
    await advance(5000);
    await advance(30_000);
    expect(load).toHaveBeenCalledTimes(2);
    let refresh!: Promise<void>;
    act(() => {
      refresh = view.result.current.reload();
      void view.result.current.reload();
    });
    await act(async () => {
      slow.resolve(appSummary('failed'));
    });
    expect(load).toHaveBeenCalledTimes(3);
    expect(view.result.current.data?.runtime.state).toBe('running');
    await act(async () => {
      fresh.resolve(appSummary('stopped'));
      await refresh;
    });
    expect(view.result.current.data?.runtime.state).toBe('stopped');
  });

  it('pauses when hidden, refreshes immediately when visible and stops on unmount', async () => {
    const load = vi
      .fn<() => Promise<AppSummary>>()
      .mockResolvedValue(appSummary());
    const view = renderHook(() => useAppSummary('shop', load, vi.fn()));
    await advance(0);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await advance(60_000);
    expect(load).toHaveBeenCalledTimes(1);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(load).toHaveBeenCalledTimes(2);
    view.unmount();
    await advance(60_000);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('never presents a previous app or its late response after navigation', async () => {
    const late = deferred<AppSummary>();
    const load = vi
      .fn<() => Promise<AppSummary>>()
      .mockResolvedValueOnce(appSummary())
      .mockReturnValueOnce(late.promise)
      .mockResolvedValue(appSummary('dormant', 'other'));
    const view = renderHook(({ id }) => useAppSummary(id, load, vi.fn()), {
      initialProps: { id: 'shop' },
    });
    await advance(5000);
    view.rerender({ id: 'other' });
    expect(view.result.current.data).toBeUndefined();
    await advance(0);
    await act(async () => {
      late.resolve(appSummary('failed'));
    });
    expect(view.result.current.data?.app.id).toBe('other');
  });

  it('keeps stale data and its error through retries, backs off to 30 seconds and recovers', async () => {
    const load = vi
      .fn<() => Promise<AppSummary>>()
      .mockResolvedValueOnce(appSummary())
      .mockRejectedValue(new Error('Offline'));
    const view = renderHook(() => useAppSummary('shop', load, vi.fn()));
    await advance(5000);
    expect(view.result.current.data?.runtime.state).toBe('running');
    expect(view.result.current.error).toBeInstanceOf(Error);
    for (const delay of [5000, 10_000, 20_000, 30_000, 30_000]) {
      const calls = load.mock.calls.length;
      await advance(delay - 1);
      expect(load).toHaveBeenCalledTimes(calls);
      await advance(1);
      expect(load).toHaveBeenCalledTimes(calls + 1);
    }
    const recovery = deferred<AppSummary>();
    load.mockReturnValue(recovery.promise);
    act(() => {
      void view.result.current.reload();
    });
    expect(view.result.current.error).toBeInstanceOf(Error);
    await act(async () => {
      recovery.resolve(appSummary('failed'));
    });
    expect(view.result.current.error).toBeUndefined();
  });

  it.each([401, 403])(
    'stops automatic retries after %s until manually refreshed',
    async (status) => {
      const load = vi.fn<() => Promise<AppSummary>>().mockRejectedValue(
        new ApiClientError('Denied', {
          status,
          method: 'GET',
          url: '/api/releases/apps/shop',
        }),
      );
      const view = renderHook(() => useAppSummary('shop', load, vi.fn()));
      await advance(120_000);
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      expect(load).toHaveBeenCalledTimes(1);
      load.mockResolvedValue(appSummary());
      await act(async () => {
        await view.result.current.reload();
      });
      await advance(5000);
      expect(load).toHaveBeenCalledTimes(3);
    },
  );
});
