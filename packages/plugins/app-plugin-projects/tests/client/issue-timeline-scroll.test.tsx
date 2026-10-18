import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  cleanup,
  render,
  renderHook,
  waitFor,
} from '@testing-library/react';
import type { ReactNode } from 'react';
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
          if (element) element.scrollTo = scroll;
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
  expect(scroll).toHaveBeenCalledTimes(2);
  rerender(view(null));
  rerender(view('latest'));
  expect(scroll).toHaveBeenCalledTimes(3);
  client.clear();
});
