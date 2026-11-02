import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import {
  realtimeClientToken,
  type RealtimeWatchOptions,
} from '@nocobase/app-client';
import { useBusinessData } from '../../client/pages/business/use-business-data.js';

function Probe() {
  const query = useBusinessData<{ value: string }>(
    'test/snapshot',
    'test:changes',
  );
  return (
    <output>{query.data?.value ?? (query.error ? 'failed' : 'loading')}</output>
  );
}
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function setup(read: () => Promise<unknown> | unknown) {
  let watch: RealtimeWatchOptions<unknown> = {};
  const close = vi.fn();
  const view = await renderWithApp(<Probe />, {
    fetch: answerApi(read),
    services(app) {
      vi.spyOn(
        app.container.resolve(realtimeClientToken),
        'watch',
      ).mockImplementation((_topic, options = {}) => {
        watch = options;
        return { state: 'subscribed', error: undefined, retry: vi.fn(), close };
      });
    },
  });
  return {
    view,
    close,
    changed: () =>
      watch.onEvent?.({
        type: 'event',
        topic: 'test:changes',
        payload: {},
        publishedAt: new Date().toISOString(),
      }),
  };
}

it('reads again after an event during initial loading without cancelling the earlier read', async () => {
  vi.useFakeTimers();
  const old = Promise.withResolvers<{ value: string }>();
  const read = vi
    .fn()
    .mockReturnValueOnce(old.promise)
    .mockReturnValue({ value: 'new snapshot' });
  const fixture = await setup(read);
  await act(() => vi.advanceTimersByTimeAsync(100));
  act(fixture.changed);
  await act(async () => {
    old.resolve({ value: 'old snapshot' });
    await vi.advanceTimersByTimeAsync(200);
  });
  expect(screen.getByText('new snapshot')).toBeInTheDocument();
  expect(read).toHaveBeenCalledTimes(2);
  fixture.view.unmount();
  expect(fixture.close).toHaveBeenCalledOnce();
});

it('recovers a failed HTTP snapshot without needing a subsequent event', async () => {
  vi.useFakeTimers();
  const read = vi
    .fn()
    .mockReturnValueOnce(
      Response.json({ error: { reason: 'UNAVAILABLE' } }, { status: 503 }),
    )
    .mockReturnValue({ value: 'recovered snapshot' });
  await setup(read);
  await act(() => vi.advanceTimersByTimeAsync(100));
  expect(screen.getByText('failed')).toBeInTheDocument();
  await act(() => vi.advanceTimersByTimeAsync(2_000));
  expect(screen.getByText('recovered snapshot')).toBeInTheDocument();
  expect(read).toHaveBeenCalledTimes(2);
});
