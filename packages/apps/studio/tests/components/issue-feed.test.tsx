/**
 * The issue pages' shared feed and follow star (`client/issues/live/`): newest first, system records folded under
 * "Conversation only" and shown under "All", hand-overs tagged, long comments cut with "Show more", and the star held
 * once the follow limit is reached.
 */
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import type { TimelineEntry } from '@nocobase/app-plugin-projects/client/issues';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import { Clamped } from '../../client/issues/live/clamped.js';
import { IssueConversation } from '../../client/issues/live/conversation.js';
import { FollowToggle } from '../../client/issues/live/follow-toggle.js';
import { IssueFeed } from '../../client/issues/live/issue-feed.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  entries: [] as TimelineEntry[],
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => ({ request: mocks.request }),
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
  useAuthorLabel: () => (comment: { authorName: string | null }) =>
    comment.authorName ?? 'Someone',
  useKindLabel: () => (kind: string) => kind,
  useMentionSearch: () => () => Promise.resolve([]),
  useIssueCommentActions: () => ({}),
  useIssueTimeline: () => ({
    entries: mocks.entries,
    hasOlder: false,
    loadingOlder: false,
    loadOlder: () => undefined,
  }),
}));
vi.mock('@nocobase/app-plugin-agents/client/kit', () => ({
  AgentAvatar: () => null,
}));
vi.mock('../../client/issues/markdown.js', () => ({
  IssueMarkdown: ({ content }: { content: string }) => <div>{content}</div>,
}));
// The projects plugin's wording; the comment thread falls back to its own.
vi.mock('../../client/issues/detail/labels.js', () => ({
  useIssuePageWording: () => ({ t: (key: string) => key }),
}));
// Studio's file preview has tests of its own (`file-preview.test.tsx`).
vi.mock('../../client/files/attachment-preview.js', () => ({
  StudioFilePreview: ({
    files,
    index,
  }: {
    files: { filename: string }[];
    index: number;
  }) => <div role='dialog'>{files[index]?.filename}</div>,
}));
vi.mock('../../client/issues/detail/activity-row.js', () => ({
  ActivityRow: ({ activity }: { activity: { action: string } }) => (
    <span data-testid='activity-row'>{activity.action}</span>
  ),
}));

const at = (minute: number) =>
  new Date(Date.UTC(2026, 9, 12, 13, minute)).toISOString();

function file(id: string, filename: string, image: boolean) {
  return {
    id,
    filename,
    ext: filename.split('.').pop() ?? '',
    mimeType: image ? 'image/png' : 'text/plain',
    size: 2048,
    issueId: 'i1',
    commentId: 'c2',
    uploader: { type: 'user', id: 'bob', name: 'Bob' },
    createdAt: at(4),
    contentUrl: `/api/files/${id}/content`,
    downloadUrl: `/api/files/${id}/content?download=1`,
    previewable: image,
    canDelete: false,
  };
}

function comment(
  id: string,
  minute: number,
  author: { type: string; id: string; name: string },
  content: string,
  attachments: ReturnType<typeof file>[] = [],
) {
  return {
    id,
    issueId: 'i1',
    authorType: author.type,
    authorId: author.id,
    authorName: author.name,
    kind: 'comment',
    content,
    note: false,
    parentId: null,
    rootId: id,
    via: null,
    createdAt: at(minute),
    editedAt: null,
    deleted: false,
    reactions: [],
    resolvedAt: null,
    resolvedById: null,
    resolvedByName: null,
    attachments,
  };
}

function thread(root: ReturnType<typeof comment>): TimelineEntry {
  return {
    kind: 'thread',
    key: `thread:${root.id}`,
    at: root.createdAt,
    thread: { root, replies: [] },
  } as unknown as TimelineEntry;
}

function activity(id: string, action: string, minute: number): TimelineEntry {
  return {
    kind: 'activity',
    key: `activity:${id}`,
    at: at(minute),
    activity: {
      id,
      action,
      details: {},
      createdAt: at(minute),
      actorType: 'system',
      actorId: null,
      actorName: null,
      via: null,
    },
  } as unknown as TimelineEntry;
}

const detail = {
  id: 'i1',
  identifier: 'WEB-1',
  projectId: null,
  statuses: [],
} as unknown as IssueDetail;

async function mount(node: ReactElement) {
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
        <MemoryRouter>{node}</MemoryRouter>
      </QueryClientProvider>
    </TestI18nProvider>,
  );
}

beforeEach(() => {
  mocks.request.mockReset();
  mocks.entries = [
    thread(
      comment(
        'c1',
        1,
        { type: 'agent', id: PROJECT_MANAGER_ID, name: 'PM' },
        '[@Sol](mention://agent/sol) Implement the export.',
      ),
    ),
    activity('a1', 'work_skipped', 2),
    activity('a2', 'label_added', 3),
    thread(
      comment('c2', 4, { type: 'user', id: 'bob', name: 'Bob' }, 'Looks good'),
    ),
  ];
});
afterEach(cleanup);

describe('the issue feed', () => {
  it('shows the newest first and folds system records until asked', async () => {
    await mount(
      <IssueConversation detail={detail} detailKey={['pm', 'issue', 'i1']}>
        <IssueFeed />
      </IssueConversation>,
    );
    const feed = await screen.findByTestId('issue-feed');
    const text = feed.textContent ?? '';
    expect(text.indexOf('Looks good')).toBeLessThan(
      text.indexOf('Implement the export.'),
    );
    // The project manager's mention of an agent is a hand-over.
    expect(text).toContain('Hand-over');
    expect(within(feed).queryByTestId('activity-row')).toBeNull();
    const folded = within(feed).getByRole('button', {
      name: '2 system records',
    });
    expect(folded.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(folded);
    expect(
      within(feed)
        .getAllByTestId('activity-row')
        .map((row) => row.textContent),
    ).toEqual(['label_added', 'work_skipped']);
    fireEvent.click(folded);
    expect(within(feed).queryByTestId('activity-row')).toBeNull();

    fireEvent.click(within(feed).getByRole('button', { name: 'All' }));
    await waitFor(() =>
      expect(feed.getAttribute('data-feed-mode')).toBe('all'),
    );
    expect(within(feed).getAllByTestId('activity-row')).toHaveLength(2);
    expect(
      within(feed).queryByRole('button', { name: '2 system records' }),
    ).toBeNull();
  });

  it('shows a comment’s screenshots as thumbnails that open the preview, and its other files as chips', async () => {
    mocks.entries = [
      thread(
        comment(
          'c2',
          4,
          { type: 'user', id: 'bob', name: 'Bob' },
          'See the screenshot',
          [file('f1', 'shot.png', true), file('f2', 'notes.txt', false)],
        ),
      ),
    ];
    await mount(
      <IssueConversation detail={detail} detailKey={['pm', 'issue', 'i1']}>
        <IssueFeed />
      </IssueConversation>,
    );
    const feed = await screen.findByTestId('issue-feed');
    const images = within(feed).getByRole('list', { name: 'Images' });
    const thumbnail = within(images).getByRole('img', { name: 'shot.png' });
    expect(thumbnail.getAttribute('src')).toBe('/api/files/f1/content');
    // Outside the cut of a long comment, so a screenshot is never hidden.
    expect(thumbnail.closest('[data-slot="clamped"]')).toBeNull();
    const files = within(feed).getByRole('list', { name: 'Files' });
    expect(files.textContent).toContain('notes.txt');
    expect(
      within(files)
        .getByRole('button', { name: 'Download notes.txt' })
        .getAttribute('href'),
    ).toBe('/api/files/f2/content?download=1');
    fireEvent.click(
      within(images).getByRole('button', { name: 'Preview shot.png' }),
    );
    expect((await screen.findByRole('dialog')).textContent).toBe('shot.png');
  });

  it('cuts a long comment to a few lines with Show more and Show less', async () => {
    const heights = vi
      .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(400);
    const client = vi
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockReturnValue(72);
    try {
      await mount(<Clamped>A very long comment</Clamped>);
      const more = await screen.findByRole('button', { name: 'Show more' });
      expect(more.getAttribute('aria-expanded')).toBe('false');
      fireEvent.click(more);
      const less = screen.getByRole('button', { name: 'Show less' });
      expect(less.getAttribute('aria-expanded')).toBe('true');
    } finally {
      heights.mockRestore();
      client.mockRestore();
    }
  });

  it('leaves a short comment whole', async () => {
    await mount(<Clamped>Short</Clamped>);
    expect(screen.getByText('Short')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Show more' })).toBeNull();
  });
});

describe('the follow star', () => {
  const answer = (initial: string[]) => {
    let following = initial;
    mocks.request.mockImplementation(
      (request: { path: string; json?: { issueIds: string[] } }) => {
        if (request.path === 'followUps')
          return Promise.resolve({
            data: {
              following,
              followingStored: true,
              counts: { in_review: 0, blocked: 0, in_progress: 0, backlog: 0 },
              truncated: false,
              issues: [],
            },
          });
        if (request.path === 'followUps/following') {
          following = request.json?.issueIds ?? [];
          return Promise.resolve({ data: request.json });
        }
        return Promise.resolve(undefined);
      },
    );
  };

  it('follows and says how many of the allowed are followed', async () => {
    answer(['x1']);
    await mount(<FollowToggle issueId='i1' />);
    const star = await screen.findByRole('button', { name: 'Follow' });
    await waitFor(() => expect(star.getAttribute('aria-disabled')).toBeNull());
    fireEvent.click(star);
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: 'followUps/following',
        json: { issueIds: ['x1', 'i1'] },
      }),
    );
    await screen.findByRole('button', { name: 'Following · 2/5' });
  });

  it('is held, with the reason, once five others are followed', async () => {
    answer(['a', 'b', 'c', 'd', 'e']);
    await mount(<FollowToggle issueId='i1' />);
    const star = await screen.findByRole('button', {
      name: 'Following 5 already',
    });
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
