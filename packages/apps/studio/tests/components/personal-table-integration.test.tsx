import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  MemoryRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import enUS from '../../client/locales/en-US.js';
import { PersonalTaskWorkspace } from '../../client/follow-ups/workspace.js';
import { MyIssuesTab } from '../../client/pages/my-issues/tab.js';
import { followUpsKeys } from '../../client/follow-ups/model.js';
import type { TaskTreeRow, TaskTrees } from '../../shared/task-trees.js';
import type { FollowUpsView } from '../../shared/follow-ups.js';
import type { IssuesPage } from '../../client/issues/use-issues-page.js';

const transport = vi.hoisted(() => ({
  request: vi.fn(),
  toast: vi.fn(),
  realtime: { subscribe: () => () => {}, onOpen: () => () => {} },
  pm: {
    projects: async () => [],
    labels: async () => [],
    members: async () => [],
    statuses: async () => [],
  },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => ({ request: transport.request }),
  useService: () => transport.realtime,
  useToaster: () => ({ show: transport.toast }),
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-projects/client/kit')
  >()),
  useViewer: () => ({
    userId: 'viewer',
    permissions: { scopes: {}, pages: [] },
  }),
  usePmApi: () => transport.pm,
  NewIssueButton: () => <button>Create task</button>,
}));
vi.mock('@nocobase/app-plugin-projects/client/issues', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-projects/client/issues')
  >()),
  useExecutorOptions: () => [],
  useStatusName: () => (_: unknown, key: string) => key,
}));
vi.mock('../../client/issues/issue-marks.js', () => ({
  IssueMarks: () => null,
}));
vi.mock('../../client/issues/detail/issue-parent-outlet.js', () => ({
  IssueParentOutlet: () => null,
}));
vi.mock('../../client/issues/board-view.js', () => ({
  IssueBoardView: () => <p>Board chosen</p>,
}));
vi.mock('../../client/issues/agent-view.js', () => ({
  AgentQueueView: () => <p>Agent chosen</p>,
}));
vi.mock('../../client/follow-ups/issue-panel.js', () => ({
  IssuePanel: ({
    issueId,
    onBack,
  }: {
    issueId: string;
    onBack?: () => void;
  }) => (
    <section aria-label='Preview'>
      {issueId}
      {onBack ? <button onClick={onBack}>Back</button> : null}
    </section>
  ),
}));
vi.mock('../../client/issues/toolbar.js', () => ({
  IssueToolbar: ({ page }: { page: IssuesPage }) => (
    <div>
      <input
        aria-label='Search tasks'
        value={page.searchText}
        onChange={(event) => {
          page.setSearchText(event.target.value);
          page.scheduleSearch(event.target.value);
        }}
      />
      <button onClick={() => page.setView('board')}>Board</button>
      <button onClick={() => page.setView('list')}>Table</button>
      <output data-testid='identity'>{page.queryIdentity}</output>
    </div>
  ),
}));

function node(id: string, parentId: string | null = null): TaskTreeRow {
  return {
    issue: {
      id,
      identifier: `PM-${id}`,
      title: `Task ${id}`,
      labels: [],
      priority: 'high',
      statusKey: 'in_progress',
      owner: { name: 'Owner name' },
      executor: null,
      updatedAt: '2026-10-13T12:00:00Z',
    } as TaskTreeRow['issue'],
    parentId,
    rootId: 'A',
    matchesFilter: true,
    hasChildren: id === 'A',
    progress: { total: 2, finished: 0 },
    attention: { reasons: [], needsHumanAction: true, waitingForViewer: true },
    explanation: null,
  };
}
let following: string[];
let empty: boolean;
let width: (value: number) => void;
let denied: boolean;
function overview(): FollowUpsView {
  return {
    following,
    followingStored: true,
    issues: following.map((id) => ({
      id,
      identifier: `PM-${id}`,
      title: `Task ${id}`,
      statusKey: 'in_progress',
      followed: true,
      unread: 2,
      lastActivityAt: '2026-10-13T12:00:00Z',
      progress: null,
    })),
  } as FollowUpsView;
}
beforeEach(() => {
  following = [];
  empty = false;
  denied = false;
  transport.request.mockReset();
  transport.request.mockImplementation(
    async ({
      path,
      query,
      json,
    }: {
      path: string;
      query?: Record<string, string>;
      json?: unknown;
    }) => {
      if (path === 'followUps') {
        if (denied)
          throw new ApiClientError('Expired', {
            status: 401,
            reason: 'AUTH_REQUIRED',
            data: {},
          });
        return { data: overview() };
      }
      if (path.endsWith('/follow') || path.endsWith('/unfollow')) {
        const id = path.split('/')[2]!;
        following = path.endsWith('/unfollow')
          ? following.filter((value) => value !== id)
          : [...following, id];
        return { data: { issueIds: following } };
      }
      if (path === 'taskTrees')
        return {
          data: {
            generation: 'generation',
            groups: ['input', 'review', 'decision', 'routine'].map((group) => ({
              group,
              generation: 'generation',
              data: group === 'input' && !empty && !query?.q ? [node('A')] : [],
              nextCursor: null,
              totals: {
                tasks: group === 'input' && !empty && !query?.q ? 3 : 0,
                trees: group === 'input' && !empty && !query?.q ? 1 : 0,
                needsHumanAction: 1,
                waitingForViewer: 1,
              },
            })),
          } as TaskTrees,
        };
      if (path === 'taskTrees/children')
        return {
          data: {
            generation: 'generation',
            data: query?.cursor ? [node('C', 'A')] : [node('B', 'A')],
            nextCursor: query?.cursor ? null : 'page-2',
          },
        };
      throw new Error(`Unexpected request ${path} ${JSON.stringify(json)}`);
    },
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(
        callback: (entries: { contentRect: { width: number } }[]) => void,
      ) {
        width = (value) => callback([{ contentRect: { width: value } }]);
      }
      observe() {
        width(1500);
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
function History() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid='location'>
        {location.pathname}
        {location.search}
        {location.hash}
      </output>
      <button onClick={() => navigate(-1)}>History back</button>
      <button onClick={() => navigate(1)}>History forward</button>
    </>
  );
}
async function mount(role: 'owned' | 'executing' = 'owned', search = '') {
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
        <MemoryRouter initialEntries={[`/my-issues/${role}${search}`]}>
          <Routes>
            <Route
              path='/my-issues/:role'
              element={
                <>
                  <History />
                  <PersonalTaskWorkspace>
                    <MyIssuesTab role={role} />
                  </PersonalTaskWorkspace>
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </TestI18nProvider>,
  );
  await waitFor(() =>
    expect(transport.request).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'followUps' }),
    ),
  );
  return client;
}

describe('shared personal table integration', () => {
  it.each(['owned', 'executing'] as const)(
    'defaults to the same grouped table with %s permission scope and explicit row following',
    async (role) => {
      await mount(role);
      const row = await screen.findByRole('row', { name: /PM-A/ });
      const query = transport.request.mock.calls.find(
        ([call]) => call.path === 'taskTrees',
      )![0].query;
      expect(query).toMatchObject(
        role === 'owned' ? { ownerUserId: 'viewer' } : { executorId: 'viewer' },
      );
      expect(row.querySelector('[data-testid="follow-toggle"]')).not.toBeNull();
      expect(screen.getByTestId('personal-task-workspace')).not.toHaveAttribute(
        'data-columns',
      );
    },
  );
  it('uses real saved and explicit view priority instead of a workspace fallback', async () => {
    // Store via the real public helper below: its storage key is deliberately not part of this test contract.
    const { storeIssueView } =
      await import('@nocobase/app-plugin-projects/client/issues');
    storeIssueView('my-issues', 'board');
    following = ['A'];
    await mount();
    expect(await screen.findByText('Board chosen')).toBeVisible();
    expect(screen.getByTestId('personal-task-workspace')).not.toHaveAttribute(
      'data-columns',
    );
    cleanup();
    await mount('owned', '?view=list');
    expect(await screen.findByRole('table')).toHaveAttribute(
      'data-compact',
      'true',
    );
  });
  it('keeps disclosures, loaded child pages, query identity and native links while previewing and switching layout', async () => {
    following = ['A'];
    await mount('executing', '?view=list#reply');
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('issue=A'),
    );
    const expand = await screen.findByRole('button', {
      name: 'Expand subtasks of PM-A',
    });
    fireEvent.click(expand);
    await screen.findByRole('link', { name: 'PM-B' }, { timeout: 4000 });
    const more = await screen.findByRole('button', {
      name: /Load more subtasks/,
    });
    fireEvent.click(more);
    await screen.findByRole('link', { name: 'PM-C' });
    const identity = screen.getByTestId('identity').textContent;
    const href = screen
      .getByRole('link', { name: 'PM-B' })
      .getAttribute('href');
    expect(href).toContain('/my-issues/executing/B?');
    expect(href).toContain('#reply');
    fireEvent.click(screen.getByRole('link', { name: 'PM-B' }));
    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'Preview' })).toHaveTextContent(
        'B',
      ),
    );
    expect(following).toEqual(['A']);
    expect(screen.getByTestId('identity').textContent).toBe(identity);
    expect(
      screen.getByRole('button', { name: 'Collapse subtasks of PM-A' }),
    ).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'History back' }));
    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'Preview' })).toHaveTextContent(
        'A',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'History forward' }));
    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'Preview' })).toHaveTextContent(
        'B',
      ),
    );
    act(() => width(800));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'PM-C' })).toBeVisible(),
    );
    act(() => width(1500));
    expect(screen.getByRole('link', { name: 'PM-C' })).toBeVisible();
    const before = screen.getByTestId('location').textContent;
    fireEvent.click(screen.getByRole('link', { name: 'PM-C' }), {
      ctrlKey: true,
    });
    expect(screen.getByTestId('location').textContent).toBe(before);
  });
  it('acknowledges first/last follow without resetting expanded rows and exposes secondary fields without navigation', async () => {
    await mount();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Expand subtasks of PM-A' }),
    );
    await screen.findByRole('link', { name: 'PM-B' }, { timeout: 4000 });
    const row = screen.getByRole('link', { name: 'PM-A' }).closest('tr')!;
    fireEvent.click(within(row).getByTestId('follow-toggle'));
    await waitFor(() =>
      expect(screen.getByRole('table')).toHaveAttribute('data-compact', 'true'),
    );
    expect(screen.getByRole('link', { name: 'PM-B' })).toBeVisible();
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('issue=A'),
    );
    const before = screen.getByTestId('location').textContent;
    fireEvent.click(
      screen.getByRole('button', { name: 'Task information: PM-A' }),
    );
    expect(await screen.findByText('Owner name')).toBeVisible();
    expect(screen.getByTestId('location').textContent).toBe(before);
    fireEvent.keyDown(screen.getByText('Owner name'), { key: 'Escape' });
    fireEvent.click(
      within(
        screen.getByRole('link', { name: 'PM-A' }).closest('tr')!,
      ).getByTestId('follow-toggle'),
    );
    await waitFor(() =>
      expect(screen.getByRole('table')).not.toHaveAttribute('data-compact'),
    );
    expect(screen.getByRole('link', { name: 'PM-B' })).toBeVisible();
  });
  it('does not filter away the following workspace and stops the actual table on overview denial', async () => {
    following = ['A'];
    const client = await mount('owned', '?q=no-results');
    expect(
      await screen.findByRole('region', { name: 'Preview' }),
    ).toHaveTextContent('A');
    expect(screen.getByRole('table')).toHaveAttribute('data-compact', 'true');
    denied = true;
    await act(async () => {
      await client.invalidateQueries({ queryKey: followUpsKeys.overview });
    });
    await waitFor(() => expect(screen.queryByRole('table')).toBeNull());
    expect(screen.queryByRole('region', { name: 'Preview' })).toBeNull();
  });
  it('moves keyboard focus into narrow previews and restores the task link on back', async () => {
    await mount();
    await screen.findByRole('link', { name: 'PM-A' });
    act(() => width(800));
    const link = screen.getByRole('link', { name: 'PM-A' });
    link.focus();
    fireEvent.click(link);
    await waitFor(() =>
      expect(document.activeElement).toHaveAttribute('data-preview-focus'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(link).toHaveFocus());
  });
  it('reports the real explicit creation sort and keeps supported compact sorts actionable', async () => {
    following = ['A'];
    await mount('owned', '?view=list&sort=created&direction=asc');
    await waitFor(() =>
      expect(screen.getByRole('table')).toHaveAttribute('data-compact', 'true'),
    );
    expect(
      screen.getByRole('table').querySelector('caption'),
    ).toHaveTextContent('Created · ascending');
    fireEvent.click(
      screen.getByRole('button', { name: 'Sort: Created · ascending' }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Priority' }));
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('sort=priority'),
    );
    expect(
      screen.getByRole('table').querySelector('caption'),
    ).toHaveTextContent('Priority · descending');
  });
});
