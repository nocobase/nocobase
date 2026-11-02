import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { renderWithApp } from '@nocobase/app-testing/client';
import {
  realtimeClientToken,
  type RealtimeWatchOptions,
} from '@nocobase/app-client';
import { useLoader } from '../client/lib/use-loader.js';
import {
  useLifecycleChanges,
  refreshLifecycleViews,
} from '../client/lib/use-lifecycle-changes.js';
import {
  LIFECYCLE_CHANGES_TOPIC,
  type LifecycleChange,
} from '../shared/routes.js';

type Read = (signal?: AbortSignal) => Promise<string>;
function Probe({
  identity = 'first',
  read,
}: {
  identity?: string;
  read: Read;
}) {
  const data = useLoader(read, identity, '', false);
  const updates = useLifecycleChanges('tickets', identity, data.refresh);
  return (
    <>
      <output>{data.data ?? 'loading'}</output>
      <span>{updates.error ? 'failed' : 'fresh'}</span>
      <button onClick={updates.retry}>Retry</button>
    </>
  );
}
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function setup(read: Read) {
  const watches: RealtimeWatchOptions<LifecycleChange>[] = [];
  const close = vi.fn();
  const retry = vi.fn();
  const view = await renderWithApp(<Probe read={read} />, {
    services(app) {
      vi.spyOn(
        app.container.resolve(realtimeClientToken),
        'watch',
      ).mockImplementation((_topic, options = {}) => {
        watches.push(options as RealtimeWatchOptions<LifecycleChange>);
        return { state: 'subscribed', error: undefined, retry, close };
      });
    },
  });
  return {
    view,
    watches,
    close,
    retry,
    changed: (lifecycle = 'tickets') =>
      watches.at(-1)?.onEvent?.({
        type: 'event',
        topic: LIFECYCLE_CHANGES_TOPIC,
        payload: { lifecycle, recordId: 'one' },
        publishedAt: new Date().toISOString(),
      }),
  };
}

it('coalesces bursts, filters other flows and reads again after an event during initial loading', async () => {
  vi.useFakeTimers();
  const pending = Promise.withResolvers<string>();
  const read = vi
    .fn<Read>()
    .mockReturnValueOnce(pending.promise)
    .mockResolvedValue('new');
  const fixture = await setup(read);
  await act(() => vi.advanceTimersByTimeAsync(100));
  expect(read).toHaveBeenCalledTimes(1);
  act(() => {
    for (let i = 0; i < 20; i++) fixture.changed();
  });
  await act(() => vi.advanceTimersByTimeAsync(500));
  expect(read).toHaveBeenCalledTimes(1);
  await act(async () => {
    pending.resolve('old');
    await vi.advanceTimersByTimeAsync(100);
  });
  expect(read).toHaveBeenCalledTimes(2);
  expect(screen.getByText('new')).toBeInTheDocument();
  act(() => fixture.changed('expenses'));
  await act(() => vi.advanceTimersByTimeAsync(100));
  expect(read).toHaveBeenCalledTimes(2);
  act(() => fixture.watches[0].onReady?.());
  await act(() => vi.advanceTimersByTimeAsync(100));
  expect(read).toHaveBeenCalledTimes(3);
});

it('retries transient failures, blocks forbidden reads and exposes manual recovery', async () => {
  vi.useFakeTimers();
  const forbidden = Object.assign(new Error('Forbidden'), { status: 403 });
  const read = vi
    .fn<Read>()
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValue('recovered');
  const fixture = await setup(read);
  await act(() => vi.advanceTimersByTimeAsync(100));
  expect(screen.getByText('failed')).toBeInTheDocument();
  await act(() => vi.advanceTimersByTimeAsync(2_000));
  expect(screen.getByText('recovered')).toBeInTheDocument();
  read.mockRejectedValue(forbidden);
  act(() => fixture.changed());
  await act(() => vi.advanceTimersByTimeAsync(100));
  expect(screen.queryByText('recovered')).not.toBeInTheDocument();
  const count = read.mock.calls.length;
  act(() => fixture.changed());
  await act(() => vi.advanceTimersByTimeAsync(60_000));
  expect(read).toHaveBeenCalledTimes(count);
  read.mockResolvedValue('allowed');
  fireEvent.click(screen.getByText('Retry'));
  await act(() => vi.advanceTimersByTimeAsync(100));
  expect(screen.getByText('allowed')).toBeInTheDocument();
  expect(fixture.retry).toHaveBeenCalledOnce();
});

it('reconciles once a minute, pauses while hidden and disposes pending reads', async () => {
  vi.useFakeTimers();
  const visible = vi
    .spyOn(document, 'visibilityState', 'get')
    .mockReturnValue('visible');
  const read = vi.fn<Read>().mockResolvedValue('snapshot');
  const fixture = await setup(read);
  await act(() => vi.advanceTimersByTimeAsync(59_900));
  expect(read).toHaveBeenCalledTimes(1);
  await act(() => vi.advanceTimersByTimeAsync(200));
  expect(read).toHaveBeenCalledTimes(2);
  visible.mockReturnValue('hidden');
  await act(() => vi.advanceTimersByTimeAsync(120_000));
  expect(read).toHaveBeenCalledTimes(2);
  visible.mockReturnValue('visible');
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  await act(() => vi.advanceTimersByTimeAsync(100));
  expect(read).toHaveBeenCalledTimes(3);
  fixture.view.unmount();
  expect(fixture.close).toHaveBeenCalledOnce();
  expect(read.mock.calls.at(-1)?.[0]?.aborted).toBe(true);
  await act(() => vi.advanceTimersByTimeAsync(60_000));
  expect(read).toHaveBeenCalledTimes(3);
});

it('cancels a replaced identity and rejects late snapshots from its old request', async () => {
  vi.useFakeTimers();
  const old = Promise.withResolvers<string>();
  const read = vi
    .fn<Read>()
    .mockReturnValueOnce(old.promise)
    .mockResolvedValue('second account');
  const fixture = await setup(read);
  await act(() => vi.advanceTimersByTimeAsync(100));
  fixture.view.rerender(<Probe identity='second' read={read} />);
  expect(read.mock.calls[0][0]?.aborted).toBe(true);
  await act(() => vi.advanceTimersByTimeAsync(100));
  await act(async () => {
    old.resolve('first account');
  });
  expect(screen.getByText('second account')).toBeInTheDocument();
  expect(screen.queryByText('first account')).not.toBeInTheDocument();
});

it('waits for every request in a failed batch before allowing a retry', async () => {
  const pending = Promise.withResolvers<void>();
  const error = new Error('Offline');
  const settled = vi.fn();
  const batch = refreshLifecycleViews([
    Promise.reject(error),
    pending.promise,
  ]).catch(settled);
  await Promise.resolve();
  expect(settled).not.toHaveBeenCalled();
  pending.resolve();
  await batch;
  expect(settled).toHaveBeenCalledWith(error);
});
