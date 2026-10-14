/**
 * The restored three-column follow-ups page retains complete structured progress in its following rail and
 * activity panel. Selection and permission boundaries are covered by `follow-ups.test.tsx`.
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
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import { FollowingRail } from '../../client/follow-ups/following-rail.js';
import { IssuePanel } from '../../client/follow-ups/issue-panel.js';
import type { FollowUpIssue, FollowUpsView } from '../../shared/follow-ups.js';
import type { IssueProgress } from '../../shared/project-manager.js';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  issue: vi.fn(),
  show: vi.fn(),
  update: vi.fn(),
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
  useIssueUpdate: () => ({ mutate: mocks.update, isPending: false }),
  canEditIssues: () => true,
}));
// The feed and the composer have tests of their own (`issue-feed.test.tsx`).
vi.mock('../../client/issues/live/conversation.js', () => ({
  IssueConversation: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('../../client/issues/live/issue-feed.js', () => ({
  IssueFeed: () => <div data-testid='issue-feed' />,
}));
// The live run's link reads the agents plugin's runs; here it is the text alone.
vi.mock('../../client/agents/issue-runs.js', () => ({
  IssueLiveRunLink: ({ children }: { children: ReactNode }) => (
    <span>{children}</span>
  ),
}));
// The phone bar's navigation and chat buttons need the shell's providers.
vi.mock('../../client/layouts/components/phone-bar.js', () => ({
  PhoneBar: ({ children }: { children?: ReactNode }) => (
    <div data-testid='phone-bar'>{children}</div>
  ),
}));
vi.mock('../../client/issues/live/issue-composer.js', () => ({
  IssueComposer: () => <div data-testid='issue-composer' />,
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
  needsYou: null,
  explanationCommentId: null,
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
        progress: progress({
          state: 'inReview',
          needsYou: 'Review the export. Accept it or send it back.',
          explanationCommentId: 'manager-explanation',
        }),
      }),
      issue({
        id: 'b1',
        identifier: 'WEB-4',
        title: 'Mail adapter',
        statusKey: 'blocked',
        lastActivityAt: at(3),
        progress: progress({
          state: 'needsDecision',
          needsYou: 'Push again?',
          explanationCommentId: null,
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
  mocks.update.mockReset();
  mocks.request.mockImplementation(
    (request: { path: string; method?: string; json?: unknown }) => {
      if (request.path === 'followUps') return Promise.resolve({ data: view });
      if (/^followUps\/issues\/[^/]+\/(?:un)?follow$/u.test(request.path))
        return Promise.resolve({ data: { issueIds: view.following } });
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
          data: progress({
            state: 'inReview',
            next: 'merge once accepted',
            needsYou: 'Review the export. Accept it or send it back.',
            explanationCommentId: 'manager-explanation',
          }),
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
          <FollowingRail
            issues={view.issues.filter((item) => item.followed)}
            stored
            selectedId='r1'
            viewing={null}
            onSelect={() => undefined}
          />
          <IssuePanel
            issueId='r1'
            summary={view.issues.find((item) => item.id === 'r1')!}
            onSeen={() => undefined}
          />
        </MemoryRouter>
      </QueryClientProvider>
    </TestI18nProvider>,
  );
  return screen.findByTestId('follow-ups-following');
}

const card = (rail: HTMLElement, identifier: string) =>
  rail.querySelector<HTMLElement>(`[data-issue="${identifier}"]`)!;

describe('structured progress in the shared following rail and panel', () => {
  it.each(['blocked', 'in_review'])(
    'shows complete structured text and the explanation link for %s without comment content',
    async (statusKey) => {
      const needsYou =
        'Choose this source.\nProvide the URL and select the deployment region.';
      const value = progress({
        state: statusKey === 'blocked' ? 'needsDecision' : 'inReview',
        needsYou,
        next: 'Implement the selected source.',
        explanationCommentId: 'new-explanation',
      });
      view.issues = view.issues.map((item) =>
        item.id === 'r1' ? { ...item, statusKey, progress: value } : item,
      );
      const original = mocks.request.getMockImplementation()!;
      mocks.request.mockImplementation((request) =>
        request.path.startsWith('issueProgress/')
          ? Promise.resolve({ data: value })
          : original(request),
      );
      const rail = await mount();
      expect(card(rail, 'WEB-5').textContent).toContain(needsYou);
      const panel = await screen.findByTestId('follow-ups-activity');
      await waitFor(() =>
        expect(
          within(panel).getByTestId('issue-needs-you').textContent,
        ).toContain(needsYou),
      );
      const summary = within(panel).getByTestId('issue-summary');
      expect(summary.textContent).not.toContain(
        'Implement the change and open a PR.',
      );
      expect(summary.textContent).toContain('Implement the selected source.');
      if (statusKey === 'in_review') {
        fireEvent.click(
          within(summary).getByRole('button', { name: 'Send back' }),
        );
        expect(mocks.update).toHaveBeenCalledWith({ statusKey: 'in_progress' });
      }
      const link = within(summary).getByRole('link', {
        name: 'View the project manager’s latest explanation',
      });
      expect(link.getAttribute('href')).toContain('comment=new-explanation');
      fireEvent.click(link);
      expect(
        within(panel).getByTestId('issue-needs-you').textContent,
      ).toContain(needsYou);
    },
  );
});
