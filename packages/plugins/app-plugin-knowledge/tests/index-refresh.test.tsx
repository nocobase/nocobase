import {
  apiClientToken,
  realtimeClientToken,
  type RealtimeWatchOptions,
} from '@nocobase/app-client';
import { renderWithApp } from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import {
  useKnowledgeDocIndex,
  useKnowledgeUnindexed,
  useKnowledgeRefresh,
  knowledgeKeys,
} from '../client/api.js';
import { resetIndexRefresh } from '../client/index-refresh.js';
import {
  KNOWLEDGE_TOPIC,
  type KnowledgeDocIndex,
  type KnowledgeIndexNotifications,
} from '../shared/knowledge.js';

const pending: KnowledgeDocIndex = {
  docId: 'one',
  version: 1,
  enabled: true,
  total: 2,
  indexed: 0,
  pending: 2,
  failed: 0,
  state: 'pending',
  chunks: [],
};
function Probe({ maxPollMs }: { maxPollMs?: number }) {
  const query = useKnowledgeDocIndex('one', { maxPollMs });
  return (
    <output>{query.data ? `${query.data.indexed} indexed` : 'empty'}</output>
  );
}
function SpaceProbe() {
  const query = useKnowledgeUnindexed({ scope: 'project', scopeId: 'one' });
  return (
    <output>
      {query.data === null
        ? 'disabled'
        : `${query.data?.[0]?.pending ?? 0} pending`}
    </output>
  );
}
function Page({
  duplicate = false,
  maxPollMs,
  space = false,
}: {
  duplicate?: boolean;
  maxPollMs?: number;
  space?: boolean;
}) {
  useKnowledgeRefresh();
  return space ? (
    <SpaceProbe />
  ) : (
    <>
      <Probe maxPollMs={maxPollMs} />
      {duplicate ? <Probe maxPollMs={maxPollMs} /> : null}
    </>
  );
}
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function setup(
  notifications?: KnowledgeIndexNotifications,
  duplicate = false,
  options: { maxPollMs?: number; space?: boolean } = {},
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const request = vi.fn().mockResolvedValue({
    data: options.space
      ? [
          {
            docId: 'one',
            title: 'One',
            kind: 'article',
            pending: 2,
            failed: 0,
            error: null,
          },
        ]
      : pending,
    ...(options.space ? { meta: { enabled: true, notifications } } : {}),
    ...(notifications ? { meta: { notifications } } : {}),
  });
  const watches: RealtimeWatchOptions<unknown>[] = [];
  const close = vi.fn();
  const view = await renderWithApp(
    <QueryClientProvider client={client}>
      <Page duplicate={duplicate} {...options} />
    </QueryClientProvider>,
    {
      services(app) {
        vi.spyOn(
          app.container.resolve(apiClientToken),
          'request',
        ).mockImplementation(request);
        vi.spyOn(
          app.container.resolve(realtimeClientToken),
          'watch',
        ).mockImplementation((_topic, options = {}) => {
          watches.push(options);
          return {
            state: 'subscribed',
            error: undefined,
            close,
            retry: vi.fn(),
          };
        });
      },
    },
  );
  await act(() => vi.advanceTimersByTimeAsync(100));
  return {
    client,
    request,
    watches,
    view,
    close,
    ready: () => {
      for (const watch of watches) watch.onReady?.();
    },
    changed: () => {
      for (const watch of watches)
        watch.onEvent?.({
          type: 'event',
          topic: KNOWLEDGE_TOPIC,
          payload: {},
          publishedAt: new Date().toISOString(),
        });
    },
  };
}

it('requires explicit complete coverage and topic acknowledgement before slowing reconciliation', async () => {
  vi.useFakeTimers();
  const h = await setup('complete');
  expect(h.request).toHaveBeenCalledTimes(1);
  await act(() => vi.advanceTimersByTimeAsync(5_100));
  expect(h.request).toHaveBeenCalledTimes(2);
  act(h.ready);
  await act(() => vi.advanceTimersByTimeAsync(100));
  const count = h.request.mock.calls.length;
  await act(() => vi.advanceTimersByTimeAsync(59_000));
  expect(h.request).toHaveBeenCalledTimes(count);
  await act(() => vi.advanceTimersByTimeAsync(1_100));
  expect(h.request).toHaveBeenCalledTimes(count + 1);
  act(() => {
    for (const watch of h.watches) watch.onStateChange?.('pending');
  });
  await act(() => vi.advanceTimersByTimeAsync(5_100));
  expect(h.request).toHaveBeenCalledTimes(count + 2);
});

it.each([undefined, 'none', 'partial'] as const)(
  'backs off legacy/incomplete indexers (%s), resets on progress and stops when done',
  async (coverage) => {
    vi.useFakeTimers();
    const h = await setup(coverage);
    act(h.ready);
    await act(() => vi.advanceTimersByTimeAsync(100));
    const first = h.request.mock.calls.length;
    for (const [index, delay] of [5_100, 10_100, 20_100, 30_100].entries()) {
      await act(() => vi.advanceTimersByTimeAsync(delay));
      expect(h.request).toHaveBeenCalledTimes(first + index + 1);
    }
    h.request.mockResolvedValue({
      data: { ...pending, indexed: 1, pending: 1 },
      meta: { notifications: coverage },
    });
    await act(() => vi.advanceTimersByTimeAsync(30_100));
    const progressed = h.request.mock.calls.length;
    await act(() => vi.advanceTimersByTimeAsync(5_100));
    expect(h.request).toHaveBeenCalledTimes(progressed + 1);
    h.request.mockResolvedValue({
      data: { ...pending, indexed: 2, pending: 0, state: 'done' },
    });
    act(h.changed);
    await act(() => vi.advanceTimersByTimeAsync(100));
    const finished = h.request.mock.calls.length;
    await act(() => vi.advanceTimersByTimeAsync(120_000));
    expect(h.request).toHaveBeenCalledTimes(finished);
  },
);

it('shares a scheduler across observers and excludes index reads from the general event refresh', async () => {
  vi.useFakeTimers();
  const h = await setup('complete', true);
  expect(h.watches).toHaveLength(2); // One general subscription and one shared index subscription.
  expect(h.request).toHaveBeenCalledTimes(1);
  const old = Promise.withResolvers<unknown>();
  h.request
    .mockReturnValueOnce(old.promise)
    .mockResolvedValue({ data: { ...pending, indexed: 2, pending: 0 } });
  act(h.ready);
  await act(() => vi.advanceTimersByTimeAsync(100));
  expect(h.request).toHaveBeenCalledTimes(2);
  act(() => {
    for (let i = 0; i < 20; i++) h.changed();
  });
  await act(() => vi.advanceTimersByTimeAsync(100));
  expect(h.request).toHaveBeenCalledTimes(2);
  await act(async () => {
    old.resolve({ data: pending });
    await vi.advanceTimersByTimeAsync(200);
  });
  expect(h.request).toHaveBeenCalledTimes(3);
  expect(screen.getAllByText('2 indexed')).toHaveLength(2);
  h.view.unmount();
  expect(h.close).toHaveBeenCalledTimes(2);
  await act(() => vi.advanceTimersByTimeAsync(120_000));
  expect(h.request).toHaveBeenCalledTimes(3);
});

it('clears protected snapshots and stops automatic reads after a forbidden response', async () => {
  vi.useFakeTimers();
  const h = await setup('complete');
  act(h.ready);
  await act(() => vi.advanceTimersByTimeAsync(100));
  h.request.mockRejectedValue(
    Object.assign(new Error('Forbidden'), { status: 403 }),
  );
  act(h.changed);
  await act(() => vi.advanceTimersByTimeAsync(100));
  expect(screen.getByText('empty')).toBeInTheDocument();
  const count = h.request.mock.calls.length;
  act(h.changed);
  await act(() => vi.advanceTimersByTimeAsync(120_000));
  expect(h.request).toHaveBeenCalledTimes(count);
  h.request.mockResolvedValue({
    data: pending,
    meta: { notifications: 'complete' },
  });
  act(h.ready);
  await act(() => vi.advanceTimersByTimeAsync(100));
  expect(screen.getByText('0 indexed')).toBeInTheDocument();
});

it('resets the fallback after reindexing and pauses reads in a hidden page', async () => {
  vi.useFakeTimers();
  const visible = vi
    .spyOn(document, 'visibilityState', 'get')
    .mockReturnValue('visible');
  const h = await setup();
  await act(() => vi.advanceTimersByTimeAsync(16_000));
  act(() => {
    resetIndexRefresh(h.client, knowledgeKeys.docIndex('one'));
    h.client.setQueryData(knowledgeKeys.docIndex('one'), { ...pending });
  });
  const count = h.request.mock.calls.length;
  await act(() => vi.advanceTimersByTimeAsync(5_100));
  expect(h.request).toHaveBeenCalledTimes(count + 1);
  visible.mockReturnValue('hidden');
  await act(() => vi.advanceTimersByTimeAsync(120_000));
  expect(h.request).toHaveBeenCalledTimes(count + 1);
  visible.mockReturnValue('visible');
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  await act(() => vi.advanceTimersByTimeAsync(100));
  expect(h.request).toHaveBeenCalledTimes(count + 2);
});

it('caps fallback intervals with the caller configuration', async () => {
  vi.useFakeTimers();
  const h = await setup(undefined, false, { maxPollMs: 10_000 });
  for (const [index, delay] of [5_100, 10_100, 10_100, 10_100].entries()) {
    await act(() => vi.advanceTimersByTimeAsync(delay));
    expect(h.request).toHaveBeenCalledTimes(index + 2);
  }
});

it('applies the same adaptive fallback to a space and stops when semantic indexing is disabled', async () => {
  vi.useFakeTimers();
  const h = await setup(undefined, false, { space: true });
  expect(screen.getByText('2 pending')).toBeInTheDocument();
  await act(() => vi.advanceTimersByTimeAsync(5_100));
  expect(h.request).toHaveBeenCalledTimes(2);
  h.request.mockResolvedValue({
    data: [],
    meta: { enabled: false, notifications: 'none' },
  });
  act(h.changed);
  await act(() => vi.advanceTimersByTimeAsync(200));
  expect(screen.getByText('disabled')).toBeInTheDocument();
  const count = h.request.mock.calls.length;
  await act(() => vi.advanceTimersByTimeAsync(120_000));
  expect(h.request).toHaveBeenCalledTimes(count);
});

it('recovers a failed snapshot without waiting for another notification', async () => {
  vi.useFakeTimers();
  const h = await setup();
  h.request
    .mockRejectedValueOnce(
      Object.assign(new Error('Unavailable'), { status: 503 }),
    )
    .mockResolvedValue({ data: { ...pending, indexed: 1, pending: 1 } });
  act(h.changed);
  await act(() => vi.advanceTimersByTimeAsync(2_100));
  expect(screen.getByText('1 indexed')).toBeInTheDocument();
  expect(h.request).toHaveBeenCalledTimes(3);
});

it('rebinds after the query cache is replaced during an identity change', async () => {
  vi.useFakeTimers();
  const h = await setup();
  act(() => h.client.clear());
  h.view.rerender(
    <QueryClientProvider client={h.client}>
      <Page />
    </QueryClientProvider>,
  );
  await act(() => vi.advanceTimersByTimeAsync(100));
  const count = h.request.mock.calls.length;
  await act(() => vi.advanceTimersByTimeAsync(5_100));
  expect(h.request).toHaveBeenCalledTimes(count + 1);
  expect(h.close).toHaveBeenCalledTimes(1);
});
