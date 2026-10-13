import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import enUS from '../../client/locales/en-US.js';
import { IssuePanel } from '../../client/follow-ups/issue-panel.js';

const mocks = vi.hoisted(() => ({ issue: vi.fn() }));
vi.mock('@nocobase/app-plugin-projects/client/kit', () => ({
  usePmApi: () => ({ issue: mocks.issue }),
  pmKeys: { issue: (id: string) => ['pm', 'issue', id] },
}));
vi.mock('@nocobase/app-plugin-projects/client/issues', () => ({
  useIssueUpdate: () => ({}),
}));
vi.mock('../../client/issues/live/conversation.js', () => ({
  IssueConversation: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('../../client/issues/live/issue-summary.js', () => ({
  IssueSummary: ({
    issue,
    actions,
  }: {
    issue: { title: string };
    actions: ReactNode;
  }) => (
    <>
      <h2>{issue.title}</h2>
      {actions}
    </>
  ),
}));
vi.mock('../../client/issues/live/issue-feed.js', () => ({
  IssueFeed: () => <p>Private feed</p>,
}));
vi.mock('../../client/issues/live/issue-composer.js', () => ({
  IssueComposer: () => <button>Send private comment</button>,
}));
vi.mock('../../client/issues/live/follow-toggle.js', () => ({
  FollowToggle: () => null,
}));
vi.mock('../../client/layouts/components/phone-bar.js', () => ({
  PhoneBar: ({ children }: { children: ReactNode }) => children,
}));
afterEach(cleanup);

async function mount(
  client: QueryClient,
  seen: (id: string) => void,
  unavailable: (id: string) => void,
) {
  const runtime = await createTestI18nRuntime({
    application: { namespace: 'studio', resources: enUS },
    locale: 'en-US',
  });
  return render(
    <TestI18nProvider runtime={runtime} namespace='studio'>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <IssuePanel
            issueId='A'
            summary={null}
            onSeen={seen}
            onUnavailable={unavailable}
            issueHref={(id) => `/my-issues/executing/${id}?q=keep`}
          />
        </MemoryRouter>
      </QueryClientProvider>
    </TestI18nProvider>,
  );
}
const detail = {
  id: 'A',
  identifier: 'TASK-1',
  title: 'Private title',
  activities: [],
  threads: [],
};
describe('visible following content', () => {
  it.each([403, 404])(
    'hides stale cached content and sends nothing after an authorization/deletion refresh (%s)',
    async (status) => {
      const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      mocks.issue.mockResolvedValue(detail);
      const seen = vi.fn();
      const unavailable = vi.fn();
      await mount(client, seen, unavailable);
      expect(await screen.findByText('Private title')).toBeVisible();
      await waitFor(() => expect(seen).toHaveBeenCalledWith('A'));
      seen.mockClear();
      mocks.issue.mockRejectedValue(
        new ApiClientError('No access', {
          status,
          method: 'GET',
          url: '/issue/A',
        }),
      );
      await act(async () => {
        await client.invalidateQueries();
      });
      await waitFor(() => expect(unavailable).toHaveBeenCalledWith('A'));
      expect(screen.queryByText('Private title')).toBeNull();
      expect(screen.queryByText('Private feed')).toBeNull();
      expect(
        screen.queryByRole('button', { name: 'Send private comment' }),
      ).toBeNull();
      expect(seen).not.toHaveBeenCalled();
    },
  );
  it('marks only the visible selected panel, retaining the full scoped detail link', async () => {
    mocks.issue.mockResolvedValue(detail);
    const seen = vi.fn();
    await mount(new QueryClient(), seen, vi.fn());
    expect(
      await screen.findByRole('link', { name: 'Open issue' }),
    ).toHaveAttribute('href', '/my-issues/executing/TASK-1?q=keep');
    expect(mocks.issue).toHaveBeenLastCalledWith('A');
    await waitFor(() => expect(seen).toHaveBeenCalledTimes(1));
  });
});
