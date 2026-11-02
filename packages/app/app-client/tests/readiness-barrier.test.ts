import { afterEach, expect, it, vi } from 'vitest';
import type {
  RealtimeConnectionState,
  RealtimeWatchOptions,
} from '@nocobase/realtime/client';
import { watchReadiness } from '../src/realtime-readiness.js';
afterEach(() => vi.useRealTimers());
it('starts the acknowledgement deadline after a slow transport opens and recovers once per generation', async () => {
  vi.useFakeTimers();
  const watchers: RealtimeWatchOptions<unknown>[] = [];
  let connection: ((state: RealtimeConnectionState) => void) | undefined;
  const opened = vi.fn(),
    recover = vi.fn(),
    pending = vi.fn();
  const barrier = watchReadiness(
    {
      state: 'connecting',
      onStateChange: (listener) => {
        connection = listener;
        return () => {};
      },
      watch: (_topic, options = {}) => {
        watchers.push(options);
        return {
          state: 'pending',
          error: undefined,
          retry: () => {},
          close: () => {},
        };
      },
    },
    ['one', 'two'],
    { onOpen: opened, onRecovery: recover, onPending: pending },
  );
  await vi.advanceTimersByTimeAsync(2000);
  expect(opened).not.toHaveBeenCalled();
  connection?.('open');
  watchers.forEach((watch) => watch.onReady?.());
  await barrier.wait();
  expect(opened).toHaveBeenCalledOnce();
  watchers.forEach((watch) => watch.onReady?.());
  expect(recover).not.toHaveBeenCalled();
  watchers.forEach((watch) => watch.onStateChange?.('pending'));
  await vi.advanceTimersByTimeAsync(1000);
  expect(pending).toHaveBeenCalledOnce();
  expect(recover).not.toHaveBeenCalled();
  watchers.forEach((watch) => watch.onReady?.());
  expect(recover).toHaveBeenCalledOnce();
  barrier.close();
});
it('releases HTTP reads on refusal without losing the later acknowledgement recovery', async () => {
  let watch: RealtimeWatchOptions<unknown> = {};
  const recover = vi.fn();
  const barrier = watchReadiness(
    {
      watch: (_topic, options = {}) => {
        watch = options;
        return {
          state: 'pending',
          error: undefined,
          retry: () => {},
          close: () => {},
        };
      },
    },
    ['one'],
    { onRecovery: recover },
  );
  watch.onError?.({
    type: 'error',
    code: 'FORBIDDEN',
    message: 'Denied',
  } as never);
  await barrier.wait();
  expect(recover).not.toHaveBeenCalled();
  watch.onReady?.();
  expect(recover).toHaveBeenCalledOnce();
  barrier.close();
});
