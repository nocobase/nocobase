/**
 * Owner handoffs on the shared issue feed: they stay in "Conversation only" and read in Studio's words through the
 * issue page's own activity row, on the issue page and on "My follow-ups" alike.
 */
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import type { TimelineEntry } from '@nocobase/app-plugin-projects/client/issues';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import { IssueConversation } from '../../client/issues/live/conversation.js';
import { IssueFeed } from '../../client/issues/live/issue-feed.js';

const entries = vi.hoisted(() => ({ list: [] as TimelineEntry[] }));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => ({ request: () => Promise.resolve(undefined) }),
  useToaster: () => ({ show: vi.fn() }),
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', () => ({
  useViewer: () => ({ userId: 'alice', name: 'Alice' }),
  usePmApi: () => ({
    members: () => Promise.resolve([]),
    project: () => Promise.resolve({ members: [] }),
  }),
  useApiKeyActors: () => new Map(),
  pmKeys: {
    members: ['pm', 'members'],
    project: (id: string) => ['pm', 'project', id],
  },
}));
vi.mock('@nocobase/app-plugin-projects/client/issues', () => ({
  canComment: () => true,
  canEditComment: () => false,
  canDeleteComment: () => false,
  isBuiltInKind: () => true,
  ISSUE_REACTION_EMOJIS: ['👍'],
  useAuthorLabel: () => () => 'Someone',
  useKindLabel: () => (kind: string) => kind,
  useMentionSearch: () => () => Promise.resolve([]),
  useIssueCommentActions: () => ({}),
  useEventTitle: () => () => null,
  useIssueTimeline: () => ({
    entries: entries.list,
    hasOlder: false,
    loadingOlder: false,
    loadOlder: () => undefined,
  }),
}));
vi.mock('@nocobase/app-plugin-agents/client/kit', () => ({
  AgentAvatar: () => null,
}));
vi.mock('@nocobase/app-plugin-agents/client/runs', () => ({
  useAgentNames: () => () => null,
}));
vi.mock('../../client/issues/detail/plan-links.js', () => ({
  usePlanLinkTo: () => (planId: string) => `/plans/${planId}`,
}));
// The projects plugin's wording; Studio's own words come from its locale.
vi.mock('../../client/issues/detail/labels.js', () => ({
  useIssuePageWording: () => ({ t: (key: string) => `projects:${key}` }),
}));

afterEach(cleanup);

describe('owner handoffs on the feed', () => {
  it('stay in the conversation, in Studio’s words', async () => {
    entries.list = [
      'studio_owner_transferred',
      'studio_owner_accepted',
      'studio_owner_rejected',
    ].map(
      (action, index) =>
        ({
          kind: 'activity',
          key: `activity:handoff-${index}`,
          at: new Date(Date.UTC(2026, 9, 12, 13, index)).toISOString(),
          activity: {
            id: `handoff-${index}`,
            actorType: 'user',
            actorId: 'alice',
            actorName: 'Alice',
            action,
            details: {},
            via: null,
            createdAt: new Date(Date.UTC(2026, 9, 12, 13, index)).toISOString(),
          },
        }) as unknown as TimelineEntry,
    );
    const runtime = await createTestI18nRuntime({
      application: { namespace: 'studio', resources: enUS },
      locale: 'en-US',
    });
    render(
      <TestI18nProvider runtime={runtime} namespace='studio'>
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter>
            <IssueConversation
              detail={
                {
                  id: 'i1',
                  identifier: 'WEB-1',
                  projectId: null,
                  statuses: [],
                } as unknown as IssueDetail
              }
              detailKey={['pm', 'issue', 'i1']}
            >
              <IssueFeed />
            </IssueConversation>
          </MemoryRouter>
        </QueryClientProvider>
      </TestI18nProvider>,
    );
    const feed = await screen.findByTestId('issue-feed');
    expect(feed.getAttribute('data-feed-mode')).toBe('conversation');
    expect(within(feed).queryByText(/system record/u)).toBeNull();
    expect(feed.textContent).toContain('transferred responsibility');
    expect(feed.textContent).toContain('accepted responsibility');
    expect(feed.textContent).toContain('rejected the handoff');
  });
});
