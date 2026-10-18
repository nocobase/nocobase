import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import type { IssueDetail } from '../../shared/issues.js';
import { useIssueTimeline } from '../../client/pages/issues/detail/use-issue-activity.js';

const api = vi.hoisted(() => ({ threads: vi.fn(), activities: vi.fn() }));
vi.mock('../../client/hooks/use-pm-api.js', () => ({ usePmApi: () => api }));
afterEach(cleanup);

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
      <>
        {timeline.entries.map((entry) =>
          entry.kind === 'thread' ? (
            <div
              key={entry.key}
              data-comment-id={entry.thread.root.id}
              ref={(element) => {
                if (element) element.scrollIntoView = scroll;
              }}
            />
          ) : null,
        )}
      </>
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
