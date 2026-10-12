/**
 * "My follow-ups" (`client/pages/follow-ups`): the followed issues with what needs the viewer and what is new, the
 * selected issue's activity, the owned issues filtered by status and text, starring and marking an issue seen.
 */
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import FollowUpsPage from '../../client/pages/follow-ups/index.js';
import type { FollowUpIssue, FollowUpsView } from '../../shared/follow-ups.js';
import type { IssueProgress } from '../../shared/project-manager.js';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  issue: vi.fn(),
  show: vi.fn(),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => ({ request: mocks.request }),
  useToaster: () => ({ show: mocks.show }),
  useService: () => ({
    subscribe: () => () => undefined,
    onOpen: () => () => undefined,
  }),
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', () => ({
  useViewer: () => ({ userId: 'alice' }),
  usePmApi: () => ({ issue: mocks.issue }),
  pmKeys: { issue: (id: string) => ['pm', 'issue', id] },
}));
vi.mock('@nocobase/app-plugin-projects/client/issues', () => ({
  statusTone: () => 'blue',
  useStatusName: () => (_statuses: unknown, key: string) => `status:${key}`,
}));
vi.mock('@nocobase/app-plugin-agents/client/kit', () => ({
  AgentAvatar: () => null,
}));
vi.mock('@nocobase/app-plugin-agents/client/runs', () => ({
  useAgentNames: () => () => null,
}));
vi.mock('../../client/issues/markdown.js', () => ({
  IssueMarkdown: ({ content }: { content: string }) => <div>{content}</div>,
}));

const at = (minute: number) =>
  new Date(Date.UTC(2026, 9, 12, 13, minute)).toISOString();

const progress = (overrides: Partial<IssueProgress> = {}): IssueProgress => ({
  state: 'idle',
  agent: null,
  step: null,
  since: null,
  runner: null,
  pullRequest: null,
  question: null,
  next: null,
  handOver: false,
  ...overrides,
});

function issue(overrides: Partial<FollowUpIssue>): FollowUpIssue {
  return {
    id: 'i',
    identifier: 'WEB-1',
    title: 'An issue',
    statusKey: 'in_progress',
    projectId: null,
    executorName: null,
    lastActivityAt: at(0),
    owned: true,
    followed: false,
    progress: null,
    unread: 0,
    seenAt: null,
    ...overrides,
  };
}

let view: FollowUpsView;

beforeEach(() => {
  view = {
    following: ['r1', 'f1'],
    followingStored: true,
    counts: { in_review: 1, blocked: 1, in_progress: 1, backlog: 0 },
    truncated: false,
    issues: [
      issue({
        id: 'r1',
        identifier: 'WEB-5',
        title: 'Release page lists previews',
        statusKey: 'in_review',
        followed: true,
        unread: 2,
        progress: progress({ state: 'inReview' }),
      }),
      issue({
        id: 'b1',
        identifier: 'WEB-4',
        title: 'Mail adapter',
        statusKey: 'blocked',
        lastActivityAt: at(3),
        progress: progress({
          state: 'needsDecision',
          question: 'Push again?',
        }),
      }),
      issue({
        id: 'p1',
        identifier: 'WEB-3',
        title: 'Queue timeouts',
        statusKey: 'in_progress',
        progress: progress({
          state: 'working',
          agent: { id: 'sol', name: 'Sol' },
          step: 'implementing the timeout',
        }),
      }),
      issue({
        id: 'f1',
        identifier: 'WEB-9',
        title: 'Someone else’s issue',
        owned: false,
        followed: true,
        unread: 3,
        progress: progress({
          state: 'working',
          agent: { id: 'sol', name: 'Sol' },
          step: 'fixing the review',
        }),
      }),
    ],
  };
  mocks.request.mockReset();
  mocks.show.mockReset();
  mocks.issue.mockReset();
  mocks.request.mockImplementation(
    (request: { path: string; method?: string; json?: unknown }) => {
      if (request.path === 'followUps') return Promise.resolve({ data: view });
      if (request.path === 'followUps/following')
        return Promise.resolve({ data: request.json });
      if (request.path === 'git/marks')
        return Promise.resolve({
          data: {
            r1: {
              count: 1,
              merged: 0,
              state: 'open',
              ciState: 'success',
              conflict: true,
              url: 'https://github.com/o/r/pull/12',
              label: 'o/r#12',
            },
          },
        });
      if (request.path === 'git/pullRequests')
        return Promise.resolve({
          data: [],
          meta: {
            suggestions: [],
            canMerge: false,
            canLink: false,
            applicable: false,
          },
        });
      if (request.path.startsWith('issueProgress/'))
        return Promise.resolve({
          data: progress({ state: 'inReview', next: 'merge once accepted' }),
        });
      return Promise.resolve(undefined);
    },
  );
  mocks.issue.mockImplementation((id: string) =>
    Promise.resolve({
      id,
      identifier: view.issues.find((item) => item.id === id)?.identifier,
      title: view.issues.find((item) => item.id === id)?.title,
      statusKey: view.issues.find((item) => item.id === id)?.statusKey,
      ownerUserId: 'alice',
      revision: 1,
      activities: [],
      threads: [
        {
          root: {
            id: `c-${id}`,
            authorType: 'agent',
            authorId: 'studio-project-manager',
            authorName: 'PM',
            content:
              'Next: review it.\n[@Sol](mention://agent/sol) Implement the change and open a PR.',
            createdAt: at(1),
            deleted: false,
          },
          replies: [],
        },
      ],
    }),
  );
});
afterEach(cleanup);

async function mount() {
  const runtime = await createTestI18nRuntime({
    application: { namespace: 'studio', resources: enUS },
    locale: 'en-US',
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <TestI18nProvider runtime={runtime} namespace='studio'>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/follow-ups']}>
          <FollowUpsPage />
        </MemoryRouter>
      </QueryClientProvider>
    </TestI18nProvider>,
  );
  return screen.findByTestId('follow-ups-following');
}

const card = (rail: HTMLElement, identifier: string) =>
  rail.querySelector<HTMLElement>(`[data-issue="${identifier}"]`)!;

describe('My follow-ups', () => {
  it('shows the followed issues, what needs the viewer and what is new, with the first one open', async () => {
    const rail = await mount();
    const first = card(rail, 'WEB-5');
    await waitFor(() =>
      expect(first.textContent).toContain('Needs you: Accept: PR #12'),
    );
    // The open issue's count is not shown; the other one's is.
    expect(first.getAttribute('aria-current')).toBe('true');
    expect(within(first).queryByTestId('follow-ups-unread')).toBeNull();
    const other = card(rail, 'WEB-9');
    expect(within(other).getByTestId('follow-ups-unread').textContent).toBe(
      '3',
    );
    expect(other.textContent).toContain('Sol is working on fixing the review');

    const panel = await screen.findByTestId('follow-ups-activity');
    await waitFor(() =>
      expect(within(panel).getByTestId('follow-ups-now').textContent).toContain(
        'Next: merge once accepted',
      ),
    );
    // The pull request mark arrives in a batched request of its own, after the issue's progress.
    await waitFor(() =>
      expect(panel.textContent).toContain('Checks passed · Has conflicts'),
    );
    expect(
      within(panel).getByTestId('follow-ups-needs-you').textContent,
    ).toContain('Accept: PR #12');
    expect(within(panel).getByTestId('follow-ups-feed').textContent).toContain(
      'Project manager asked Sol: Implement the change and open a PR.',
    );
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith({
        method: 'POST',
        path: 'followUps/issues/r1/markSeen',
      }),
    );
  });

  it('filters the owned issues by several statuses and by text, in review first', async () => {
    await mount();
    const mine = screen.getByTestId('follow-ups-mine');
    const keys = () =>
      [...mine.querySelectorAll('li[data-issue]')].map((row) =>
        row.getAttribute('data-issue'),
      );
    // In review only, when the page opens; another person's issue never.
    expect(keys()).toEqual(['WEB-5']);
    fireEvent.click(
      within(mine).getByRole('button', { name: /status:blocked/ }),
    );
    fireEvent.click(
      within(mine).getByRole('button', { name: /status:in_progress/ }),
    );
    expect(keys()).toEqual(['WEB-5', 'WEB-4', 'WEB-3']);
    expect(mine.textContent).toContain('Answer: Push again?');
    fireEvent.change(within(mine).getByRole('searchbox'), {
      target: { value: 'web-3' },
    });
    expect(keys()).toEqual(['WEB-3']);
  });

  it('opens an owned issue in the middle without following it, and stars it', async () => {
    const rail = await mount();
    const mine = screen.getByTestId('follow-ups-mine');
    fireEvent.click(
      within(mine).getByRole('button', { name: /status:blocked/ }),
    );
    const row = mine.querySelector<HTMLElement>('li[data-issue="WEB-4"]')!;
    fireEvent.click(within(row).getByText('Mail adapter'));
    await waitFor(() => expect(mocks.issue).toHaveBeenCalledWith('b1'));
    await waitFor(() =>
      expect(rail.textContent).toContain('Viewing (not followed)'),
    );
    fireEvent.click(within(row).getByRole('button', { name: 'Follow WEB-4' }));
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: 'followUps/following',
        json: { issueIds: ['r1', 'f1', 'b1'] },
      }),
    );
  });

  it('holds the star of an unfollowed issue once five are followed', async () => {
    view = {
      ...view,
      following: ['r1', 'f1', 'x1', 'x2', 'x3'],
      issues: [
        ...view.issues,
        issue({ id: 'x1', owned: false, followed: true }),
        issue({ id: 'x2', owned: false, followed: true }),
        issue({ id: 'x3', owned: false, followed: true }),
      ],
    };
    await mount();
    const mine = screen.getByTestId('follow-ups-mine');
    fireEvent.click(
      within(mine).getByRole('button', { name: /status:blocked/ }),
    );
    const star = within(mine).getByRole('button', { name: 'Follow WEB-4' });
    expect(star.getAttribute('aria-disabled')).toBe('true');
    expect(star.getAttribute('title')).toContain('You follow 5 issues already');
    fireEvent.click(star);
    expect(
      mocks.request.mock.calls.some(
        ([request]) => (request as { method?: string }).method === 'PUT',
      ),
    ).toBe(false);
  });
});
