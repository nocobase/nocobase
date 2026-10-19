import {
  realtimeClientToken,
  type RealtimeWatchOptions,
} from '@nocobase/app-client';
import { renderWithApp } from '@nocobase/app-testing/client';
import { act, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useLoader } from '../client/lib/use-loader.js';
import { OFFICE_FLOWS_TOPIC } from '../shared/realtime.js';

function Probe({ load }: { load: () => Promise<string> }) {
  const result = useLoader(load, 'record');
  return <output>{result.data ?? 'loading'}</output>;
}

it('catches up a lifecycle event during a read without frequent quiet-page polling', async () => {
  vi.useFakeTimers();
  let finish!: (value: string) => void;
  const load = vi
    .fn<() => Promise<string>>()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValue('after transition');
  let callbacks: RealtimeWatchOptions<unknown> = {};
  const close = vi.fn();
  const view = await renderWithApp(<Probe load={load} />, {
    services: (app) => {
      vi.spyOn(
        app.container.resolve(realtimeClientToken),
        'watch',
      ).mockImplementation((topic, options = {}) => {
        expect(topic).toBe(OFFICE_FLOWS_TOPIC);
        callbacks = options as RealtimeWatchOptions<unknown>;
        return { state: 'subscribed', error: undefined, retry: vi.fn(), close };
      });
    },
  });
  try {
    await act(() => vi.advanceTimersByTimeAsync(100));
    act(() =>
      callbacks.onEvent?.({
        type: 'event',
        topic: OFFICE_FLOWS_TOPIC,
        payload: { kind: 'office.changed' },
        publishedAt: new Date().toISOString(),
      }),
    );
    await act(async () => {
      finish('before transition');
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(screen.getByText('after transition')).toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(30_000));
    expect(load).toHaveBeenCalledTimes(2);
    act(() => callbacks.onReady?.());
    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(load).toHaveBeenCalledTimes(3);
  } finally {
    view.unmount();
    vi.useRealTimers();
  }
  expect(close).toHaveBeenCalledOnce();
});
