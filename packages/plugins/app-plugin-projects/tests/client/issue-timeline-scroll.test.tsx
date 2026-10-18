import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  cleanup,
  render,
  renderHook,
  waitFor,
} from '@testing-library/react';
import { useLayoutEffect, useState, type ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

import type { IssueDetail } from '../../shared/issues.js';
import { useIssueTimeline } from '../../client/pages/issues/detail/use-issue-activity.js';

const api = vi.hoisted(() => ({ threads: vi.fn(), activities: vi.fn() }));
vi.mock('../../client/hooks/use-pm-api.js', () => ({ usePmApi: () => api }));
afterEach(cleanup);

it('bounds a missing target lookup and never scans activities for an absent thread', async () => {
  api.threads.mockClear();
  api.activities.mockClear();
  api.threads.mockImplementation(async (_issue: string, cursor?: string) => {
    const page = Number(cursor ?? 100);
    return {
      data: [
        {
          root: { id: String(page), createdAt: '2026-01-02T00:00:00Z' },
          replies: [],
        },
      ],
      nextCursor: page > 0 ? String(page - 1) : null,
    };
  });
  const detail = {
    id: 'missing-target',
    threads: [],
    activities: [],
    threadsNextCursor: '99',
    activitiesNextCursor: 'activities',
  } as unknown as IssueDetail;
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  const { result, rerender } = renderHook(
    () => useIssueTimeline(detail, [], 'missing'),
    { wrapper: Wrapper },
  );
  await waitFor(() => expect(api.threads).toHaveBeenCalledTimes(11));
  await waitFor(() => expect(result.current.loadingOlder).toBe(false));
  rerender();
  expect(api.threads).toHaveBeenCalledTimes(11);
  expect(api.activities).not.toHaveBeenCalled();
  expect(result.current.hasOlder).toBe(true);
  // The automatic search budget does not disable explicit history loading.
  act(() => result.current.loadOlder());
  await waitFor(() => expect(api.threads).toHaveBeenCalledTimes(12));
  client.clear();
});

it('loads both history streams to reveal an older target and scrolls once across refreshes', async () => {
  const thread = (id: string, day: string) => ({
    root: { id, createdAt: `2026-01-${day}T00:00:00Z` },
    replies: [],
  });
  const old = thread('old', '02');
  const latest = thread('latest', '04');
  const activity = (day: string) => ({
    id: day,
    action: 'title_changed',
    createdAt: `2026-01-${day}T00:00:00Z`,
  });
  const detail = {
    id: 'issue',
    threads: [latest],
    threadsNextCursor: 'threads',
    activities: [activity('05')],
    activitiesNextCursor: 'activities',
  } as unknown as IssueDetail;
  api.threads.mockResolvedValue({ data: [old, latest], nextCursor: null });
  api.activities.mockResolvedValue({
    data: [activity('01'), activity('05')],
    nextCursor: null,
  });
  const scroll = vi.fn();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Timeline({ target }: { readonly target: string | null }) {
    const timeline = useIssueTimeline(detail, [], target);
    return (
      <div
        style={{ overflowY: 'auto' }}
        ref={(element) => {
          if (element) {
            element.scrollTo = scroll;
            Object.defineProperties(element, {
              clientHeight: { value: 100, configurable: true },
              scrollHeight: { value: 500, configurable: true },
            });
          }
        }}
      >
        {timeline.entries.map((entry) =>
          entry.kind === 'thread' ? (
            <div key={entry.key} data-comment-id={entry.thread.root.id} />
          ) : null,
        )}
      </div>
    );
  }
  const view = (target: string | null) => (
    <QueryClientProvider client={client}>
      <Timeline target={target} />
    </QueryClientProvider>
  );
  const { rerender } = render(view('old'));
  await waitFor(() => expect(scroll).toHaveBeenCalledTimes(1));
  expect(document.querySelector('[data-comment-id="old"]')).not.toBeNull();
  await act(async () => {
    await client.invalidateQueries({ queryKey: ['pm', 'issue', 'issue'] });
  });
  rerender(view('old'));
  expect(scroll).toHaveBeenCalledTimes(1);
  rerender(view('latest'));
  await waitFor(() => expect(scroll).toHaveBeenCalledTimes(2));
  rerender(view(null));
  rerender(view('latest'));
  await waitFor(() => expect(scroll).toHaveBeenCalledTimes(3));
  client.clear();
});

it('handles an already-visible target once before later content starts overflowing', async () => {
  const root = {
    id: 'visible',
    createdAt: '2026-01-02T00:00:00Z',
  } as IssueDetail['threads'][number]['root'];
  const detail = {
    id: 'short-issue',
    threads: [{ root, replies: [] }],
    activities: [],
    threadsNextCursor: null,
    activitiesNextCursor: null,
  } as unknown as IssueDetail;
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const scroll = vi.fn();
  function Timeline({ grown }: { readonly grown: boolean }) {
    const timeline = useIssueTimeline(
      grown
        ? {
            ...detail,
            threadsNextCursor: 'older',
            threads: [
              ...detail.threads,
              { root: { ...root, id: 'new' }, replies: [] },
            ],
          }
        : detail,
      [],
      'visible',
    );
    return (
      <div
        style={{ overflowY: 'auto' }}
        ref={(element) => {
          if (!element) return;
          element.scrollTo = scroll;
          Object.defineProperties(element, {
            clientHeight: { value: 100, configurable: true },
            scrollHeight: { value: grown ? 500 : 100, configurable: true },
          });
        }}
      >
        {timeline.entries.map((entry) =>
          entry.kind === 'thread' ? (
            <div key={entry.key} data-comment-id={entry.thread.root.id} />
          ) : null,
        )}
      </div>
    );
  }
  const view = (grown: boolean) => (
    <QueryClientProvider client={client}>
      <Timeline grown={grown} />
    </QueryClientProvider>
  );
  const { rerender } = render(view(false));
  expect(document.querySelector('[data-comment-id="visible"]')).not.toBeNull();
  await act(
    () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  );
  expect(scroll).not.toHaveBeenCalled();
  rerender(view(true));
  expect(document.querySelector('[data-comment-id="new"]')).not.toBeNull();
  expect(scroll).not.toHaveBeenCalled();
  client.clear();
});

it('positions using the committed child measurement instead of the initial comment geometry', async () => {
  const root = {
    id: 'measured',
    createdAt: '2026-01-02T00:00:00Z',
  } as IssueDetail['threads'][number]['root'];
  const detail = {
    id: 'measured-issue',
    threads: [{ root, replies: [] }],
    activities: [],
    threadsNextCursor: null,
    activitiesNextCursor: null,
  } as unknown as IssueDetail;
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const scroll = vi.fn();
  function Timeline() {
    useIssueTimeline(detail, [], 'measured');
    const [measured, setMeasured] = useState(false);
    // A child measurement schedules a commit after passive effects from the initial render have run.
    useLayoutEffect(() => setMeasured(true), []);
    return (
      <div
        style={{ overflowY: 'auto' }}
        ref={(element) => {
          if (!element) return;
          element.scrollTo = scroll;
          element.getBoundingClientRect = () => new DOMRect(0, 0, 300, 100);
          Object.defineProperties(element, {
            clientHeight: { value: 100, configurable: true },
            scrollHeight: { value: 2000, configurable: true },
          });
        }}
      >
        <div
          data-comment-id='measured'
          ref={(element) => {
            if (element)
              element.getBoundingClientRect = () =>
                new DOMRect(0, measured ? 300 : 900, 300, 20);
          }}
        />
      </div>
    );
  }
  render(
    <QueryClientProvider client={client}>
      <Timeline />
    </QueryClientProvider>,
  );
  await waitFor(() =>
    expect(scroll).toHaveBeenCalledExactlyOnceWith({
      top: 260,
      behavior: 'auto',
    }),
  );
  client.clear();
});
