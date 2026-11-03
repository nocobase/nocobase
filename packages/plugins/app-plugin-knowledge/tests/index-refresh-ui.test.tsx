import {
  apiClientToken,
  realtimeClientToken,
  type RealtimeWatchOptions,
} from '@nocobase/app-client';
import { renderWithApp } from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

import { ChunksSheet, DocIndexBadge } from '../client/components/doc-index.js';
import { SpaceHome } from '../client/components/space-home.js';
import enUS from '../client/locales/en-US.js';
import zhCN from '../client/locales/zh-CN.js';
import locales from '../client/locales/index.js';
import { ACCESS_NAMESPACE } from '../shared/access.js';
import {
  KNOWLEDGE_TOPIC,
  type KnowledgeDocIndex,
  type KnowledgeDocSummary,
} from '../shared/knowledge.js';

const pending: KnowledgeDocIndex = {
  docId: 'one',
  version: 1,
  enabled: true,
  total: 1,
  indexed: 0,
  pending: 1,
  failed: 0,
  state: 'pending',
  chunks: [
    {
      ordinal: 0,
      headingPath: ['Private section'],
      anchor: null,
      lines: [1, 4],
      chars: 50,
      state: 'pending',
      error: null,
    },
  ],
};
const indexed: KnowledgeDocIndex = {
  ...pending,
  indexed: 1,
  pending: 0,
  state: 'done',
  chunks: pending.chunks.map((chunk) => ({ ...chunk, state: 'done' })),
};
const snapshot = (data: unknown) => ({
  data,
  meta: { enabled: true, notifications: 'partial' },
});
const outage = Object.assign(new Error('Temporary outage'), { status: 503 });

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function setup(
  ui: ReactElement,
  initial: unknown = pending,
  locale: 'en-US' | 'zh-CN' = 'en-US',
) {
  vi.useFakeTimers();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const request = vi.fn().mockResolvedValue(snapshot(initial));
  const watches: RealtimeWatchOptions<unknown>[] = [];
  await renderWithApp(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
    {
      locale,
      namespace: ACCESS_NAMESPACE,
      namespaces: {
        [ACCESS_NAMESPACE]: locales,
        '@nocobase/i18n': {
          'en-US': async () => ({
            default: {
              actions: { close: 'Close' },
              status: { loading: 'Loading' },
            },
          }),
          'zh-CN': async () => ({
            default: {
              actions: { close: '关闭' },
              status: { loading: '加载中' },
            },
          }),
        },
      },
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
            close() {},
            retry() {},
          };
        });
      },
    },
  );
  await act(() => vi.advanceTimersByTimeAsync(100));
  return {
    request,
    changed: () => {
      for (const watch of watches)
        watch.onEvent?.({
          type: 'event',
          topic: KNOWLEDGE_TOPIC,
          payload: { kind: 'knowledge.changed', docId: 'one' },
          publishedAt: new Date().toISOString(),
        });
    },
  };
}

it.each(['en-US', 'zh-CN'] as const)(
  'lets a reader recover the badge after refresh exhaustion (%s)',
  async (locale) => {
    const labels = (locale === 'en-US' ? enUS : zhCN).knowledge.index;
    const { request, changed } = await setup(
      <DocIndexBadge docId='one' editable={false} />,
      pending,
      locale,
    );
    expect(screen.getByTestId('knowledge-index-badge')).toBeInTheDocument();
    request.mockRejectedValue(outage);
    await act(() => vi.advanceTimersByTimeAsync(40_000));
    expect(screen.getByRole('alert')).toHaveTextContent(labels.refreshFailed);
    expect(screen.queryByTestId('knowledge-index-badge')).toBeNull();
    // Recovery is explicit after exhaustion; an event does not reset retries.
    act(changed);
    await act(() => vi.advanceTimersByTimeAsync(180_000));
    const retry = screen.getByRole('button', { name: labels.retryRefresh });
    fireEvent.click(retry);
    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(screen.getByRole('alert')).toHaveTextContent(labels.refreshFailed);
    expect(retry).toBeEnabled();

    let finish!: (response: ReturnType<typeof snapshot>) => void;
    request.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    request.mockResolvedValue(snapshot(pending));
    fireEvent.click(retry);
    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(retry).toBeDisabled();
    await act(async () => {
      finish(snapshot(pending));
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(screen.queryByRole('alert')).toBeNull();
    request.mockResolvedValue(snapshot(indexed));
    await act(() => vi.advanceTimersByTimeAsync(31_000));
    expect(screen.getByTestId('knowledge-index-badge')).toHaveTextContent(
      labels.done,
    );
    expect(
      request.mock.calls.every(([request]) => request.method !== 'POST'),
    ).toBe(true);
  },
);

it('clears denied sections and lets a reader retry after access returns', async () => {
  const { request } = await setup(
    <ChunksSheet
      open
      onOpenChange={() => {}}
      docId='one'
      title='One'
      onShow={() => {}}
    />,
  );
  expect(screen.getByText('Private section')).toBeInTheDocument();
  request.mockRejectedValue(
    Object.assign(new Error('Forbidden'), { status: 403 }),
  );
  await act(() => vi.advanceTimersByTimeAsync(10_000));
  expect(screen.queryByText('Private section')).toBeNull();
  expect(screen.getByRole('alert')).toHaveTextContent(
    enUS.knowledge.index.refreshFailed,
  );
  const stopped = request.mock.calls.length;
  await act(() => vi.advanceTimersByTimeAsync(60_000));
  expect(request).toHaveBeenCalledTimes(stopped);
  request.mockResolvedValue(snapshot(indexed));
  fireEvent.click(
    screen.getByRole('button', { name: enUS.knowledge.index.retryRefresh }),
  );
  await act(() => vi.advanceTimersByTimeAsync(200));
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByText('Private section')).toBeInTheDocument();
});

it('offers recovery on the space home instead of retaining stale pending counts', async () => {
  const space = { scope: 'project', scopeId: 'one' };
  const doc: KnowledgeDocSummary = {
    id: 'one',
    kind: 'article',
    spaceId: 's1',
    ...space,
    parentId: null,
    sortOrder: 0,
    slug: 'one',
    title: 'One',
    summary: '',
    version: 1,
    file: null,
    verifiedAt: null,
    archivedAt: null,
    updatedAt: '2026-10-01T00:00:00Z',
    updatedBy: { kind: 'user', id: 'u1', name: 'Ada' },
    childCount: 0,
    pendingProposals: 0,
    access: { read: true, propose: false, edit: false, manage: false },
    accessMode: 'inherit',
    accessEntries: 0,
  };
  const { request } = await setup(
    <SpaceHome
      space={space}
      spaceLabel='One'
      docs={[doc]}
      ownDocs={[doc]}
      pending={[]}
      actions={null}
      onOpen={() => {}}
      onProposal={() => {}}
      onProposals={() => {}}
    />,
    [
      {
        docId: 'one',
        title: 'One',
        kind: 'article',
        pending: 1,
        failed: 0,
        error: null,
      },
    ],
  );
  expect(screen.getByText('1 section waiting')).toBeInTheDocument();
  request.mockRejectedValue(outage);
  await act(() => vi.advanceTimersByTimeAsync(40_000));
  expect(screen.queryByText('1 section waiting')).toBeNull();
  expect(screen.getByRole('alert')).toHaveTextContent(
    enUS.knowledge.index.refreshFailed,
  );
  request.mockResolvedValue(snapshot([]));
  fireEvent.click(
    screen.getByRole('button', { name: enUS.knowledge.index.retryRefresh }),
  );
  await act(() => vi.advanceTimersByTimeAsync(200));
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.queryByText('Not fully indexed')).toBeNull();
});
