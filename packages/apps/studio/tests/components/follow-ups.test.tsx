import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { ApiClientError } from '@nocobase/app-client';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useEffect, useState } from 'react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import {
  DraftContext,
  IssueDrafts,
} from '../../client/follow-ups/draft-state.js';
import { PersonalTaskWorkspace } from '../../client/follow-ups/workspace.js';
import { FollowToggle } from '../../client/issues/live/follow-toggle.js';
import LegacyFollowUps from '../../client/pages/follow-ups/index.js';
import type { FollowUpsView } from '../../shared/follow-ups.js';
import { followUpsKeys } from '../../client/follow-ups/model.js';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  show: vi.fn(),
  seen: vi.fn(),
  send: vi.fn(),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => ({ request: mocks.request }),
  useToaster: () => ({ show: mocks.show }),
}));
vi.mock('../../client/git/api.js', () => ({
  usePullRequestMark: () => ({ data: null }),
}));
vi.mock('../../client/follow-ups/issue-panel.js', () => ({
  IssuePanel: ({
    issueId,
    onBack,
    onUnavailable,
    issueHref,
  }: {
    issueId: string;
    onBack?: () => void;
    onUnavailable: (id: string) => void;
    issueHref: (id: string) => string;
  }) => (
    <section data-testid='panel'>
      {issueId}
      <CachedDetail issueId={issueId} />
      <FollowToggle issueId={issueId} />
      {onBack ? <button onClick={onBack}>Back</button> : null}
      <button onClick={() => onUnavailable(issueId)}>Deny</button>
      <a href={issueHref(issueId)}>Full detail</a>
    </section>
  ),
}));

/** Keep a successful, independent detail query while the overview refetch fails first. */
function CachedDetail({ issueId }: { issueId: string }) {
  const detail = useQuery({
    queryKey: ['cached-detail', issueId],
    queryFn: async () =>
      (await mocks.request({ path: `issues/${issueId}` })).data as {
        title: string;
      },
  });
  useEffect(() => {
    if (detail.data) mocks.seen(issueId);
  }, [detail.data, issueId]);
  return detail.data ? (
    <>
      <p>{detail.data.title}</p>
      <button onClick={() => mocks.send(issueId)}>Send comment</button>
    </>
  ) : null;
}

let view: FollowUpsView;
let width: (width: number) => void;
let availableWidth = 1400;
beforeEach(() => {
  availableWidth = 1400;
  view = {
    following: [],
    followingStored: false,
    issues: [],
    counts: { blocked: 0, in_review: 0, backlog: 0, in_progress: 0 },
    truncated: false,
  };
  mocks.request.mockReset();
  mocks.show.mockReset();
  mocks.seen.mockReset();
  mocks.send.mockReset();
  mocks.request.mockImplementation(({ path }: { path: string }) => {
    if (path === 'followUps') return Promise.resolve({ data: view });
    if (path.startsWith('issues/'))
      return Promise.resolve({ data: { title: 'Cached private title' } });
    const id = path.split('/')[2]!;
    const follow = path.endsWith('/follow');
    view = {
      ...view,
      followingStored: true,
      following: follow
        ? [...view.following, id]
        : view.following.filter((candidate) => candidate !== id),
      issues: [
        { id, identifier: id, title: id, followed: follow },
      ] as FollowUpsView['issues'],
    };
    return Promise.resolve({ data: { issueIds: view.following } });
  });
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(
        callback: (entries: { contentRect: { width: number } }[]) => void,
      ) {
        width = (value) => callback([{ contentRect: { width: value } }]);
      }
      observe() {
        width(availableWidth);
      }
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

function Tasks() {
  const [query, setQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div data-testid='tasks'>
      {location.pathname === '/my-issues/executing/A' ? (
        <CachedDetail issueId='A' />
      ) : null}
      <input
        aria-label='Search'
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <FollowToggle issueId='A' />
      <button onClick={() => navigate(-1)}>History back</button>
      <output>
        {location.pathname}
        {location.search}
        {location.hash}
      </output>
    </div>
  );
}
async function mount(
  url = '/my-issues/owned?view=list',
  legacy = false,
  drafts: IssueDrafts | null = null,
  outsideAction = false,
) {
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
        <MemoryRouter initialEntries={[url]}>
          {outsideAction ? <FollowToggle issueId='A' /> : null}
          {legacy ? (
            <>
              <LegacyFollowUps />
              <Tasks />
            </>
          ) : (
            <DraftContext.Provider value={drafts}>
              <PersonalTaskWorkspace>
                <Tasks />
              </PersonalTaskWorkspace>
            </DraftContext.Provider>
          )}
        </MemoryRouter>
      </QueryClientProvider>
    </TestI18nProvider>,
  );
  await waitFor(() =>
    expect(mocks.request).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'followUps' }),
    ),
  );
  await waitFor(() =>
    expect(screen.queryByText('Loading followed tasks…')).toBeNull(),
  );
  return client;
}

const acknowledge = (ids: string[]): void => {
  view = {
    ...view,
    following: ids,
    followingStored: true,
    issues: ids.map((id) => ({
      id,
      identifier: id,
      title: id,
      statusKey: 'in_progress',
      lastActivityAt: '2026-10-13T12:00:00Z',
      unread: 3,
      progress: null,
      followed: true,
    })) as FollowUpsView['issues'],
  };
};

describe('personal task workspace', () => {
  it('does not insert a query-only history entry when first following from an already open full detail', async () => {
    await mount('/my-issues/executing/A?view=list&q=keep#reply');
    fireEvent.click(screen.getByTestId('follow-toggle'));
    await waitFor(() => expect(view.following).toEqual(['A']));
    await waitFor(() =>
      expect(screen.getByTestId('follow-toggle')).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    );
    expect(screen.getByText(/my-issues\/executing\/A/u)).toHaveTextContent(
      '/my-issues/executing/A?view=list&q=keep#reply',
    );
    expect(screen.getByText(/my-issues\/executing\/A/u)).not.toHaveTextContent(
      'issue=',
    );
  });
  it.each([
    [401, '/my-issues/owned?view=list&issue=A'],
    [403, '/my-issues/owned?view=list&issue=A'],
    [401, '/my-issues/executing/A?view=list&issue=A&q=keep#reply'],
    [403, '/my-issues/executing/A?view=list&issue=A&q=keep#reply'],
  ])(
    'closes active content and operations after overview %s before detail fails at %s, retaining local drafts',
    async (status, url) => {
      acknowledge(['A']);
      const drafts = new IssueDrafts();
      drafts.ensure('A');
      const session = drafts.sessions.get('A')!;
      session.setter('content', '')('My unsent text');
      const reply = { id: 'reply-to' };
      session.setter('replyTo', null as unknown)(reply);
      const uploads = {
        uploads: [
          { key: 'pending', name: 'Uploading.txt', attachment: null },
          { key: 'done', name: 'Completed.txt', attachment: { id: 'file' } },
        ],
      };
      session.setter('issueUploads', null as unknown)(uploads);
      const client = await mount(url, false, drafts, true);
      await screen.findByText('Cached private title');
      expect(
        screen.getByRole('button', { name: 'Send comment' }),
      ).toBeVisible();
      mocks.request.mockImplementation(({ path }: { path: string }) => {
        if (path === 'followUps')
          return Promise.reject(
            new ApiClientError('Denied', {
              status,
              method: 'GET',
              url: '/followUps',
            }),
          );
        throw new Error(`Unexpected request after denial: ${path}`);
      });
      const seenBefore = mocks.seen.mock.calls.length;
      await act(async () => {
        await client.invalidateQueries({ queryKey: followUpsKeys.overview });
      });
      expect(await screen.findByRole('alert')).toHaveTextContent(
        status === 401 ? 'Your session has expired' : 'permission',
      );
      // Detail still has successful private data: its own error cannot account for the hidden content.
      expect(client.getQueryState(['cached-detail', 'A'])?.status).toBe(
        'success',
      );
      expect(client.getQueryData(['cached-detail', 'A'])).toEqual({
        title: 'Cached private title',
      });
      expect(screen.queryByText('Cached private title')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Send comment' })).toBeNull();
      expect(screen.queryByTestId('panel')).toBeNull();
      expect(screen.queryByTestId('tasks')).toBeNull();
      const toggle = screen.getByTestId('follow-toggle');
      expect(toggle).toHaveAttribute('aria-disabled', 'true');
      expect(toggle).toHaveAttribute(
        'title',
        expect.stringContaining(
          status === 401 ? 'Your session has expired' : 'permission',
        ),
      );
      const requestsBefore = mocks.request.mock.calls.length;
      fireEvent.click(toggle);
      expect(mocks.request).toHaveBeenCalledTimes(requestsBefore);
      expect(mocks.send).not.toHaveBeenCalled();
      expect(mocks.seen).toHaveBeenCalledTimes(seenBefore);
      if (url.startsWith('/my-issues/executing/A')) {
        fireEvent.click(
          screen.getByRole('button', { name: /Return to unsent draft/ }),
        );
        expect(screen.getByText('My unsent text')).toBeVisible();
      } else {
        expect(screen.getByText('My unsent text')).toBeVisible();
        fireEvent.click(
          screen.getByRole('button', { name: 'Back to the list' }),
        );
        fireEvent.click(
          screen.getByRole('button', { name: /Return to unsent draft/ }),
        );
      }
      expect(screen.getByText('Uploading.txt')).toBeVisible();
      expect(screen.getByText('Completed.txt')).toBeVisible();
      expect(screen.getByText(/sending is unavailable/)).toBeVisible();
      expect(session.read('replyTo', null)).toBe(reply);
      expect(session.read('issueUploads', null)).toBe(uploads);
      expect(screen.queryByTestId('panel')).toBeNull();
      expect(mocks.request).toHaveBeenCalledTimes(requestsBefore);
      expect(mocks.seen).toHaveBeenCalledTimes(seenBefore);
    },
  );
  it('waits for first save success, then selects it; last unfollow restores the same task input and query', async () => {
    let finish!: (answer: unknown) => void;
    const normal = mocks.request.getMockImplementation()!;
    mocks.request.mockImplementation((request: { path: string }) =>
      request.path.endsWith('/follow')
        ? new Promise((resolve) => {
            finish = resolve;
          })
        : normal(request),
    );
    await mount('/my-issues/executing?view=list&sort=title&q=keep');
    const input = screen.getByRole('textbox', { name: 'Search' });
    fireEvent.change(input, { target: { value: 'kept draft search' } });
    fireEvent.click(screen.getByTestId('follow-toggle'));
    await waitFor(() => expect(finish).toBeDefined());
    expect(screen.queryByTestId('panel')).toBeNull();
    expect(screen.queryByTestId('follow-ups-following')).toBeNull();
    acknowledge(['A']);
    await act(async () => finish({ data: { issueIds: ['A'] } }));
    expect(await screen.findByTestId('panel')).toHaveTextContent('A');
    expect(screen.getByText('Full detail')).toHaveAttribute(
      'href',
      expect.stringContaining('/my-issues/executing/A?'),
    );
    fireEvent.click(screen.getAllByTestId('follow-toggle')[0]!);
    await waitFor(() => expect(screen.queryByTestId('panel')).toBeNull());
    expect(screen.getByRole('textbox', { name: 'Search' })).toBe(input);
    expect(input).toHaveValue('kept draft search');
    expect(screen.getByText(/sort=title/)).toHaveTextContent('q=keep');
  });
  it('keeps zero-follow layout and selection after a rejected first save', async () => {
    const normal = mocks.request.getMockImplementation()!;
    mocks.request.mockImplementation((request: { path: string }) =>
      request.path.endsWith('/follow')
        ? Promise.reject(new Error('Save failed'))
        : normal(request),
    );
    await mount();
    fireEvent.click(screen.getByTestId('follow-toggle'));
    await waitFor(() => expect(mocks.show).toHaveBeenCalled());
    expect(screen.queryByTestId('follow-ups-following')).toBeNull();
    expect(screen.queryByTestId('panel')).toBeNull();
  });
  it('preserves a temporary deep link, selects remaining follows on removal and supports history', async () => {
    acknowledge(['B', 'C']);
    const client = await mount('/my-issues/owned?view=list&issue=TEMP&q=saved');
    expect(screen.getByTestId('panel')).toHaveTextContent('TEMP');
    fireEvent.click(screen.getByRole('button', { name: /^B\b/ }));
    expect(screen.getByTestId('panel')).toHaveTextContent('B');
    fireEvent.click(screen.getByRole('button', { name: 'History back' }));
    await waitFor(() =>
      expect(screen.getByTestId('panel')).toHaveTextContent('TEMP'),
    );
    fireEvent.click(screen.getByRole('button', { name: /^B\b/ }));
    acknowledge(['C']);
    await act(async () => {
      await client.invalidateQueries();
    });
    await waitFor(() =>
      expect(screen.getByTestId('panel')).toHaveTextContent('C'),
    );
  });
  it('narrow screens use partitions and return, and permission removal selects the next task', async () => {
    acknowledge(['B', 'C']);
    availableWidth = 390;
    await mount('/my-issues/owned?view=list&tab=following');
    act(() => width(390));
    expect(screen.queryByTestId('panel')).toBeNull();
    expect(screen.getByRole('button', { name: /^B\b/ })).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getAllByTestId('follow-ups-unread')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: /^B\b/ }));
    expect(screen.getByTestId('panel')).toHaveTextContent('B');
    expect(screen.queryByTestId('follow-ups-following')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Deny' }));
    await waitFor(() =>
      expect(screen.getByTestId('panel')).toHaveTextContent('C'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.queryByTestId('panel')).toBeNull();
    expect(screen.getByRole('button', { name: /^C\b/ })).toBeVisible();
    expect(screen.getByRole('button', { name: /^C\b/ })).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByTestId('follow-ups-unread')).toBeVisible();
  });
  it('shows read failures with retry and retains confirmed follows on a background error', async () => {
    acknowledge(['B']);
    const client = await mount();
    mocks.request.mockRejectedValue(new Error('Offline'));
    await act(async () => {
      await client.invalidateQueries();
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load your follow-ups',
    );
    expect(screen.getByTestId('follow-ups-following')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeVisible();
    expect(screen.getByTestId('panel')).toBeVisible();
    expect(screen.getAllByTestId('follow-toggle')[0]).not.toHaveAttribute(
      'aria-disabled',
    );
  });
  it('keeps all queries and fragment for old personal links', async () => {
    await mount('/follow-ups?tab=mine&issue=A&view=list&q=saved#anchor', true);
    await waitFor(() =>
      expect(screen.getByText(/my-issues\/owned/u)).toHaveTextContent(
        'tab=mine&issue=A&view=list&q=saved#anchor',
      ),
    );
  });
  it('does not force a non-table explicit view into columns', async () => {
    acknowledge(['B']);
    await mount('/my-issues/owned?view=board');
    expect(screen.queryByTestId('panel')).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Search' })).toBeVisible();
  });
  it('retains desktop default selection when content width shrinks and preserves fragments during navigation', async () => {
    acknowledge(['B', 'C']);
    await mount('/my-issues/owned?view=list#reply');
    expect(await screen.findByTestId('panel')).toHaveTextContent('B');
    expect(screen.getByRole('button', { name: /^B\b/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.getAllByTestId('follow-ups-unread')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /^C\b/ }));
    expect(screen.getByRole('button', { name: /^C\b/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.getByRole('button', { name: /^B\b/ })).not.toHaveAttribute(
      'aria-current',
    );
    act(() => width(390));
    expect(screen.getByTestId('panel')).toHaveTextContent('C');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.queryByTestId('panel')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Following' }));
    fireEvent.click(screen.getByRole('button', { name: /^C\b/ }));
    expect(screen.getByText('Full detail')).toHaveAttribute(
      'href',
      expect.stringContaining('#reply'),
    );
  });
  it('does not stack tasks behind a zero-follow temporary panel or compress the outlet under full details', async () => {
    await mount('/my-issues/executing?view=list&issue=TEMP');
    expect(screen.getByTestId('tasks').parentElement).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(screen.getByTestId('tasks').parentElement).toHaveClass('hidden');
    cleanup();
    acknowledge(['B']);
    await mount('/my-issues/executing/B?view=list&issue=B');
    expect(screen.getByTestId('tasks')).toBeVisible();
    expect(screen.getByTestId('personal-task-workspace')).not.toHaveAttribute(
      'data-columns',
    );
    expect(screen.queryByTestId('panel')).toBeNull();
  });
  it('honors saved non-table views and holds the sixth follow with an understandable reason', async () => {
    acknowledge(['B', 'C', 'D', 'E', 'F']);
    localStorage.setItem('pm:issues-view:my-issues', 'board');
    await mount('/my-issues/owned');
    expect(screen.queryByTestId('panel')).toBeNull();
    const toggle = screen.getByTestId('follow-toggle');
    expect(toggle).toHaveAttribute('aria-disabled', 'true');
    expect(toggle).toHaveAttribute(
      'title',
      expect.stringContaining('5 issues'),
    );
    fireEvent.click(toggle);
    expect(
      mocks.request.mock.calls.some(([request]) =>
        request.path.endsWith('/follow'),
      ),
    ).toBe(false);
  });
  it('keeps the last confirmed following workspace after a rejected unfollow', async () => {
    acknowledge(['B']);
    const normal = mocks.request.getMockImplementation()!;
    mocks.request.mockImplementation((request: { path: string }) =>
      request.path.endsWith('/unfollow')
        ? Promise.reject(new Error('Save failed'))
        : normal(request),
    );
    await mount();
    fireEvent.click(screen.getAllByTestId('follow-toggle')[0]!);
    await waitFor(() => expect(mocks.show).toHaveBeenCalled());
    expect(screen.getByTestId('panel')).toHaveTextContent('B');
    expect(screen.getByTestId('follow-ups-following')).toBeVisible();
  });
  it('keeps draft return without following and exposes only local input after permission denial', async () => {
    const drafts = new IssueDrafts();
    drafts.ensure('A');
    drafts.sessions.get('A')!.setter('content', '')('My unsent text');
    await mount('/my-issues/owned?view=list', false, drafts);
    fireEvent.click(
      screen.getByRole('button', { name: /Return to unsent draft/ }),
    );
    expect(screen.getByTestId('panel')).toHaveTextContent('A');
    fireEvent.click(screen.getByRole('button', { name: 'Deny' }));
    expect(screen.queryByTestId('panel')).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: /Return to unsent draft/ }),
    );
    expect(screen.getByText('My unsent text')).toBeVisible();
    expect(screen.getByText(/sending is unavailable/)).toBeVisible();
    expect(screen.queryByTestId('panel')).toBeNull();
  });
});
