import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import type { InboxItem } from '@nocobase/app-plugin-notification-in-app/client/inbox';

import {
  inboxBadge,
  inboxBadgeText,
  inboxTitle,
} from '@/components/inbox-badge';
import { DecisionActionsBar } from '@/extensions/nocobase-inbox/decision-actions-bar';
import { InboxDetail } from '@/extensions/nocobase-inbox/inbox-detail';
import { InboxList } from '@/extensions/nocobase-inbox/inbox-list';
import {
  activeCollection,
  entriesOf,
  freshIds,
  groupEntries as groupWith,
  inboxFilterParams as filterParamsWith,
  isSettled,
  kindsOf as kindsWith,
  mergeWaiting,
  readInboxFilter as readFilterWith,
  shownEntries as shownWith,
  unreadByCategory,
  type InboxEntry,
  type InboxView,
} from '@/extensions/nocobase-inbox/model';
import type { InboxRegistry } from '@/extensions/nocobase-inbox/registry';
import { InboxRegistryProvider } from '@/extensions/nocobase-inbox/registry-scope';

import type { InboxNotice } from '../../shared/inbox';
import { studioInboxRegistry } from '../../client/inbox/contributions/index';
import {
  issueTitleOf,
  useParamsOf,
} from '../../client/inbox/contributions/projects-wording';
import { recentEvents } from '../../client/inbox/contributions/recent-events';
import { studioInboxCategories } from '../../client/pages/inbox/categories';

/** Studio's contributors and kinds, as its inbox page gives them to the block. */
const registry: InboxRegistry = {
  ...studioInboxRegistry,
  categories: studioInboxCategories,
};
const groupEntries = (entries: readonly InboxEntry[]) =>
  groupWith(entries, studioInboxCategories);
const kindsOf = (view: InboxView) => kindsWith(view, studioInboxCategories);
const readInboxFilter = (params: URLSearchParams) =>
  readFilterWith(params, studioInboxCategories);
const inboxFilterParams = (
  params: URLSearchParams,
  filter: { view: 'all' | 'todo'; kind: string },
) => filterParamsWith(params, filter, studioInboxCategories);
const shownEntries = (
  filter: { view: 'all' | 'todo'; kind: string },
  groups: ReturnType<typeof groupEntries>,
) => shownWith(filter, groups, studioInboxCategories);
const unreadByKind = (entries: readonly InboxEntry[]) =>
  unreadByCategory(groupEntries(entries));
const unreadCount = (entries: readonly InboxEntry[]) =>
  entries.filter((entry) => !entry.item.readAt).length;

const decideApproval = vi.fn();
const issue = vi.fn();
const createComment = vi.fn();
const updateIssue = vi.fn();

vi.mock('@nocobase/app-plugin-projects/client/kit', () => ({
  PmEmpty: ({ title, action }: { title: string; action?: ReactNode }) => (
    <div>
      <p>{title}</p>
      {action}
    </div>
  ),
  PmLoadError: ({ title }: { title: string }) => <p>{title}</p>,
  PmTag: ({
    children,
    'aria-label': label,
  }: {
    children: ReactNode;
    'aria-label'?: string;
  }) => <span aria-label={label}>{children}</span>,
  PmStatusBadge: ({ statusKey }: { statusKey: string }) => (
    <span>{`status:${statusKey}`}</span>
  ),
  PmActorAvatar: ({ name }: { name: string }) => <span>{name}</span>,
  pmKeys: {
    issue: (id: string) => ['pm', 'issue', id],
    issues: ['pm', 'issues'],
  },
  usePmApi: () => ({ issue, decideApproval, createComment, updateIssue }),
  useViewer: () => ({ userId: 'lead' }),
  // The page context and the "Ask agent" slot are inert without a provider and a fill.
  usePageContextSource: () => undefined,
}));

// Keys stand for their text, even where a default is given, so a test can tell which text was chosen.
vi.mock('@nocobase/i18n/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/i18n/client')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'en-US' },
    }),
  };
});

// The chime preference lives on the server with the person (`inbox/chime.ts`); here it is simply on.
vi.mock('@nocobase/app-plugin-users/client/preferences', () => ({
  useUserPreference: (_key: string, options: { defaultValue: unknown }) => [
    options.defaultValue,
    () => undefined,
    { loaded: true, stored: false },
  ],
}));
vi.mock('../../client/access/notify', () => ({
  useNotify: () => ({ success: vi.fn(), error: vi.fn() }),
}));

function item(id: string, overrides: Partial<InboxItem> = {}): InboxItem {
  return {
    id,
    deliveryId: `d-${id}`,
    notificationId: `n-${id}`,
    title: `Title ${id}`,
    body: `Body ${id}`,
    target: { type: 'route', path: '/issues/PM-1' },
    createdAt: '2026-10-01T08:00:00.000Z',
    ...overrides,
  };
}

function notice(id: string, overrides: Partial<InboxNotice> = {}): InboxNotice {
  return {
    notificationId: `n-${id}`,
    source: 'projects',
    kind: 'decision',
    type: 'approval_requested',
    subject: { type: 'issue', id: 'i1', label: 'PM-1' },
    decisionKey: 'r1',
    data: null,
    count: 1,
    resolvedAt: null,
    outcome: null,
    ...overrides,
  };
}

const wrap = (ui: ReactElement) => (
  <QueryClientProvider client={new QueryClient()}>
    <MemoryRouter>
      <InboxRegistryProvider registry={registry}>{ui}</InboxRegistryProvider>
    </MemoryRouter>
  </QueryClientProvider>
);

describe('the inbox model', () => {
  it('lists waiting decisions first, settled ones after, and notifications apart', () => {
    const entries = entriesOf(
      [
        item('a'),
        item('b'),
        item('c'),
        item('d', { readAt: '2026-10-01T09:00:00.000Z' }),
      ],
      [
        notice('a', {
          resolvedAt: '2026-10-01T09:00:00.000Z',
          outcome: 'approved',
        }),
        notice('b'),
        notice('d', { kind: 'info', type: 'approval_decided' }),
      ],
    );
    const groups = groupEntries(entries);
    expect(groups.decision.map((entry) => entry.item.id)).toEqual(['b', 'a']);
    // An item Studio did not send is information.
    expect(groups.info.map((entry) => entry.item.id)).toEqual(['c', 'd']);
    expect(unreadByKind(entries)).toEqual({ decision: 2, info: 1 });
  });

  it('reads the view and the kind from the URL, and offers no notifications in To do', () => {
    const read = (search: string) =>
      readInboxFilter(new URLSearchParams(search));
    expect(read('')).toEqual({ view: 'all', kind: 'all' });
    expect(read('view=todo&kind=plans')).toEqual({
      view: 'todo',
      kind: 'plans',
    });
    expect(read('kind=info')).toEqual({ view: 'all', kind: 'info' });
    expect(read('view=todo&kind=info')).toEqual({ view: 'todo', kind: 'all' });
    // The old tab parameter means nothing any more.
    expect(read('tab=decision')).toEqual({ view: 'all', kind: 'all' });
    expect(read('view=bogus&kind=bogus')).toEqual({ view: 'all', kind: 'all' });
    expect(kindsOf('todo')).toEqual(['all', 'decision', 'plans']);
    expect(kindsOf('all')).toEqual(['all', 'decision', 'info', 'plans']);
    expect(kindsOf('notifications')).toEqual(['all', 'info']);
    expect(read('view=notifications&kind=plans')).toEqual({
      view: 'notifications',
      kind: 'all',
    });
    expect(
      activeCollection(
        { view: 'notifications', kind: 'all' },
        new URLSearchParams('plan=p1'),
        studioInboxCategories,
      ),
    ).toBeNull();
  });

  it('writes a filter over the URL, leaving the defaults out and dropping the plan status and selection', () => {
    const params = new URLSearchParams(
      'kind=plans&status=voided&plan=p1&item=i1',
    );
    expect(
      inboxFilterParams(params, { view: 'todo', kind: 'decision' }).toString(),
    ).toBe('kind=decision&view=todo');
    expect(
      inboxFilterParams(params, { view: 'all', kind: 'all' }).toString(),
    ).toBe('');
  });

  it('shows what still waits in To do, and everything in All', () => {
    const entries = entriesOf(
      [item('a'), item('b'), item('c')],
      [
        notice('a', {
          resolvedAt: '2026-10-01T09:00:00.000Z',
          outcome: 'approved',
        }),
        notice('b'),
        notice('c', { kind: 'info', type: 'approval_decided' }),
      ],
    );
    const groups = groupEntries(entries);
    const ids = (view: 'all' | 'todo', kind: 'all' | 'decision' | 'info') =>
      shownEntries({ view, kind }, groups).map((entry) => entry.item.id);
    expect(ids('all', 'all')).toEqual(['b', 'a', 'c']);
    expect(ids('all', 'decision')).toEqual(['b', 'a']);
    expect(ids('all', 'info')).toEqual(['c']);
    expect(ids('todo', 'all')).toEqual(['b']);
    expect(ids('todo', 'decision')).toEqual(['b']);
    expect(shownEntries({ view: 'all', kind: 'plans' }, groups)).toEqual([]);
  });

  it('lists every waiting decision the server gives before the pages, each once', () => {
    const waiting = entriesOf([item('w')], [notice('w')]);
    const paged = entriesOf(
      [item('a'), item('w')],
      [
        notice('a', {
          resolvedAt: '2026-10-01T09:00:00.000Z',
          outcome: 'approved',
        }),
        notice('w'),
      ],
    );
    expect(
      groupEntries(mergeWaiting(waiting, paged)).decision.map(
        (entry) => entry.item.id,
      ),
    ).toEqual(['w', 'a']);
  });

  it('settles information its contributor settled, as a decided card', () => {
    const [upgraded, current] = entriesOf(
      [item('a'), item('b')],
      [
        notice('a', {
          kind: 'info',
          type: 'runner_upgrade_required',
          resolvedAt: '2026-10-01T09:00:00.000Z',
          outcome: 'upgraded',
        }),
        notice('b', { kind: 'info', type: 'commented' }),
      ],
    );
    expect(isSettled(upgraded)).toBe(true);
    expect(isSettled(current)).toBe(false);
  });

  it('shows the badge as a count, capped at 99+, and prefixes the tab title once', () => {
    expect(inboxBadgeText(0)).toBeNull();
    expect(inboxBadgeText(3)).toBe('3');
    expect(inboxBadgeText(120)).toBe('99+');
    expect(inboxTitle(inboxTitle('Studio', '3'), '4')).toBe('(4) Studio');
    expect(inboxTitle('(4) Studio', null)).toBe('Studio');
  });

  it('counts waiting decisions on the header badge, and the unread items only with none waiting', () => {
    expect(inboxBadge(3, 7)).toEqual({
      kind: 'decisions',
      count: 3,
      text: '3',
    });
    expect(inboxBadge(150, 0)).toEqual({
      kind: 'decisions',
      count: 150,
      text: '99+',
    });
    expect(inboxBadge(0, 2)).toEqual({ kind: 'unread', count: 2, text: '2' });
    expect(inboxBadge(0, 100)).toEqual({
      kind: 'unread',
      count: 100,
      text: '99+',
    });
    expect(inboxBadge(0, 0)).toBeNull();
  });

  it("knows the issue's title from the body, except where the body quotes a comment", () => {
    const [requested, commented, described] = entriesOf(
      [item('a'), item('b'), item('c')],
      [
        notice('a'),
        notice('b', {
          kind: 'info',
          type: 'commented',
          data: { excerpt: 'Hi' },
        }),
        notice('c', {
          kind: 'info',
          type: 'mentioned',
          data: { excerpt: 'Hi', source: 'description' },
        }),
      ],
    );
    expect(issueTitleOf(requested)).toBe('Body a');
    expect(issueTitleOf(commented)).toBeNull();
    expect(issueTitleOf(described)).toBe('Body c');
  });

  it('marks as fresh only what arrived after the first load', () => {
    const entries = entriesOf([item('a'), item('b')], []);
    expect(freshIds(entries, null).size).toBe(0);
    expect([...freshIds(entries, new Set(['a']))]).toEqual(['b']);
  });

  it('lists the latest five changes and comments, newest first', () => {
    const at = (minute: number) =>
      `2026-10-01T08:${String(minute).padStart(2, '0')}:00.000Z`;
    const comment = (id: string, minute: number, deleted = false) => ({
      id,
      createdAt: at(minute),
      deleted,
    });
    const events = recentEvents({
      activities: [1, 2, 3, 4].map((minute) => ({
        id: `a${minute}`,
        createdAt: at(minute),
      })),
      threads: [
        { root: comment('c5', 5), replies: [comment('c6', 6, true)] },
        { root: comment('c7', 7), replies: [] },
      ],
    } as never);
    expect(events.map((event) => event.key)).toEqual([
      'c:c7',
      'c:c5',
      'a:a4',
      'a:a3',
      'a:a2',
    ]);
  });
});

function renderList(entries: ReturnType<typeof entriesOf>): void {
  render(
    wrap(
      <InboxList
        filter={{ view: 'all', kind: 'all' }}
        unread={unreadCount(entries)}
        groups={groupEntries(entries)}
        loaded
        query={{
          isError: false,
          error: null,
          hasNextPage: false,
          isFetchingNextPage: false,
          refetch: vi.fn(),
          fetchNextPage: vi.fn(),
        }}
        pending={0}
        selectedId={null}
        busy={false}
        onFilter={vi.fn()}
        onSelect={vi.fn()}
        onOpen={vi.fn()}
        onAction={vi.fn()}
      />,
    ),
  );
}

describe('an item card', () => {
  it("is titled with the issue's title, and says what happened in one sentence", () => {
    const [entry] = entriesOf(
      [item('a', { body: 'Retry callbacks' })],
      [
        notice('a', {
          data: { identifier: 'PM-1', status: 'done', statusName: 'Done' },
        }),
      ],
    );
    renderList([entry]);
    expect(screen.getByText('Retry callbacks')).toBeInTheDocument();
    expect(
      screen.getByText('inbox.text.approval_requested'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Title a')).not.toBeInTheDocument();
  });

  it('words comments and mentions by type, and counts merged comments beside the type', () => {
    const entries = entriesOf(
      [item('a', { body: 'Looks good' }), item('b', { body: 'Ping' })],
      [
        notice('a', {
          kind: 'info',
          type: 'commented',
          decisionKey: null,
          count: 3,
          data: {
            identifier: 'PM-1',
            actorName: 'Ann',
            excerpt: 'Looks good',
          },
        }),
        notice('b', {
          kind: 'info',
          type: 'mentioned',
          decisionKey: null,
          data: {
            identifier: 'PM-1',
            actorName: 'Ann',
            source: 'comment',
            excerpt: 'Ping',
          },
        }),
      ],
    );
    renderList(entries);
    // The body quotes the comment, so the title falls back to the worded one.
    expect(screen.getByText('inbox.text.commented_many')).toBeInTheDocument();
    expect(screen.getByText('inbox.body.commented')).toBeInTheDocument();
    expect(screen.getByText('inbox.body.mentioned')).toBeInTheDocument();
    expect(screen.getByText('inbox.count').parentElement).toHaveTextContent(
      'inbox.types.commented',
    );
  });
});

describe('the inbox list', () => {
  const entries = entriesOf(
    [item('a'), item('b')],
    [notice('a'), notice('b', { kind: 'info', type: 'approval_decided' })],
  );
  const query = {
    isError: false,
    error: null,
    hasNextPage: false,
    isFetchingNextPage: false,
    refetch: vi.fn(),
    fetchNextPage: vi.fn(),
  };

  it('offers notifications alone, hides decision feeds and plans, and shows server counts including zero', () => {
    const props = {
      filter: { view: 'notifications' as const, kind: 'all' },
      unread: 3,
      notifications: 42,
      pending: 0,
      groups: groupEntries(entries),
      loaded: true,
      query,
      selectedId: null,
      busy: false,
      onFilter: vi.fn(),
      onSelect: vi.fn(),
      onOpen: vi.fn(),
      onAction: vi.fn(),
      feeds: <p>decision feed</p>,
      feedCount: 1,
      collections: { plans: { group: <p>open plans</p>, count: 1 } },
    };
    const { rerender } = render(wrap(<InboxList {...props} />));
    expect(screen.getByText('Title b')).toBeInTheDocument();
    expect(screen.queryByText('Title a')).not.toBeInTheDocument();
    expect(screen.queryByText('decision feed')).not.toBeInTheDocument();
    expect(screen.queryByText('open plans')).not.toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /inbox\.views\.notifications/u }),
    ).toHaveTextContent('42');
    expect(
      screen.getByRole('tab', { name: /inbox\.views\.todo/u }),
    ).toHaveTextContent('0');
    rerender(wrap(<InboxList {...props} notifications={0} />));
    expect(
      screen.getByRole('tab', { name: /inbox\.views\.notifications/u }),
    ).toHaveTextContent('0');
    fireEvent.click(screen.getByRole('tab', { name: /inbox\.views\.todo/u }));
    expect(props.onFilter).toHaveBeenCalledWith({ view: 'todo', kind: 'all' });
    rerender(
      wrap(
        <InboxList
          {...props}
          groups={{ decision: entries, info: [] }}
          query={{ ...query, hasNextPage: true }}
        />,
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'inbox.loadMore' }));
    expect(query.fetchNextPage).toHaveBeenCalled();
  });

  it('shows decisions, then notifications, with the pending count on To do and the unread count on All', () => {
    render(
      wrap(
        <InboxList
          filter={{ view: 'all', kind: 'all' }}
          unread={unreadCount(entries)}
          pending={4}
          groups={groupEntries(entries)}
          loaded
          query={query}
          selectedId={null}
          busy={false}
          onFilter={vi.fn()}
          onSelect={vi.fn()}
          onOpen={vi.fn()}
          onAction={vi.fn()}
        />,
      ),
    );
    const [decisions, notices] = screen.getAllByRole('list');
    expect(within(decisions).getByText('Title a')).toBeInTheDocument();
    expect(within(notices).getByText('Title b')).toBeInTheDocument();
    expect(screen.getByLabelText('inbox.pendingDecisions')).toHaveTextContent(
      '4',
    );
    expect(
      within(
        screen.getByRole('tab', { name: /inbox\.views\.all/u }),
      ).getByLabelText('inbox.unreadCount'),
    ).toHaveTextContent('2');
    expect(
      screen.getByRole('combobox', { name: 'inbox.kinds.label' }),
    ).toHaveTextContent('inbox.kinds.all');
  });

  it('switches views keeping a kind the view offers, and narrows by kind', () => {
    const onFilter = vi.fn();
    render(
      wrap(
        <InboxList
          filter={{ view: 'all', kind: 'info' }}
          unread={unreadCount(entries)}
          pending={1}
          groups={groupEntries(entries)}
          loaded
          query={query}
          selectedId={null}
          busy={false}
          onFilter={onFilter}
          onSelect={vi.fn()}
          onOpen={vi.fn()}
          onAction={vi.fn()}
        />,
      ),
    );
    expect(screen.queryByText('Title a')).not.toBeInTheDocument();
    expect(screen.getByText('Title b')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /inbox\.views\.todo/u }));
    // To do has no notifications, so the kind goes back to every kind.
    expect(onFilter).toHaveBeenLastCalledWith({ view: 'todo', kind: 'all' });
  });

  it('lists only what waits in To do, with the open plans after the decisions', () => {
    const settled = entriesOf(
      [item('a'), item('s'), item('b')],
      [
        notice('a'),
        notice('s', {
          resolvedAt: '2026-10-01T09:00:00.000Z',
          outcome: 'approved',
        }),
        notice('b', { kind: 'info', type: 'approval_decided' }),
      ],
    );
    render(
      wrap(
        <InboxList
          filter={{ view: 'todo', kind: 'all' }}
          unread={unreadCount(settled)}
          pending={1}
          groups={groupEntries(settled)}
          loaded
          query={query}
          selectedId={null}
          busy={false}
          onFilter={vi.fn()}
          onSelect={vi.fn()}
          onOpen={vi.fn()}
          onAction={vi.fn()}
          collections={{ plans: { group: <p>open plans</p>, count: 1 } }}
        />,
      ),
    );
    expect(screen.getByText('Title a')).toBeInTheDocument();
    expect(screen.queryByText('Title s')).not.toBeInTheDocument();
    expect(screen.queryByText('Title b')).not.toBeInTheDocument();
    const plans = screen.getByText('open plans');
    expect(
      screen.getByText('Title a').compareDocumentPosition(plans) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      screen.getByRole('tab', { name: /inbox\.views\.todo/u }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('says nothing waits, or that no item of the kind matches with a way to clear it', () => {
    const onFilter = vi.fn();
    const props = {
      unread: 0,
      pending: 0,
      groups: { decision: [], info: [] },
      loaded: true,
      query,
      selectedId: null,
      busy: false,
      onFilter,
      onSelect: vi.fn(),
      onOpen: vi.fn(),
      onAction: vi.fn(),
    };
    const { unmount } = render(
      wrap(<InboxList {...props} filter={{ view: 'todo', kind: 'all' }} />),
    );
    expect(screen.getByText('inbox.empty.todo')).toBeInTheDocument();
    expect(screen.queryByText('inbox.clearFilter')).toBeNull();
    unmount();
    render(
      wrap(<InboxList {...props} filter={{ view: 'all', kind: 'info' }} />),
    );
    expect(screen.getByText('inbox.empty.info')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'inbox.clearFilter' }));
    expect(onFilter).toHaveBeenCalledWith({ view: 'all', kind: 'all' });
  });

  it('selects an item when its card is clicked', () => {
    const onSelect = vi.fn();
    render(
      wrap(
        <InboxList
          filter={{ view: 'all', kind: 'decision' }}
          unread={unreadCount(entries)}
          pending={1}
          groups={groupEntries(entries)}
          loaded
          query={query}
          selectedId={null}
          busy={false}
          onFilter={vi.fn()}
          onSelect={onSelect}
          onOpen={vi.fn()}
          onAction={vi.fn()}
        />,
      ),
    );
    expect(screen.queryByText('Title b')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Title a'));
    expect((onSelect.mock.calls[0]?.[0] as InboxEntry).item.id).toBe('a');
  });
});

describe('the decision bar', () => {
  it('approves at once, and rejects only with a reason', () => {
    const onRun = vi.fn();
    render(
      <DecisionActionsBar
        itemTitle='PM-1'
        pending={null}
        disabled={false}
        onRun={onRun}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'inbox.request.approve' }),
    );
    expect(onRun).toHaveBeenLastCalledWith('approve', '');

    fireEvent.click(
      screen.getByRole('button', { name: 'inbox.request.reject' }),
    );
    const send = screen.getByRole('button', { name: 'inbox.request.reject' });
    expect(send).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: ' Not yet ' },
    });
    fireEvent.click(send);
    expect(onRun).toHaveBeenLastCalledWith('reject', 'Not yet');
  });

  it('sends a reason with Enter, and keeps Shift + Enter for a new line', () => {
    const onRun = vi.fn();
    render(
      <DecisionActionsBar
        itemTitle='PM-1'
        pending={null}
        disabled={false}
        onRun={onRun}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'inbox.request.reject' }),
    );
    expect(screen.getByText(/inbox\.request\.quickSend/u)).toBeInTheDocument();
    const box = screen.getByRole('textbox');
    fireEvent.change(box, { target: { value: 'No' } });
    fireEvent.keyDown(box, { key: 'Enter', shiftKey: true });
    expect(onRun).not.toHaveBeenCalled();
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(onRun).toHaveBeenLastCalledWith('reject', 'No');
  });
});

describe('the inbox detail', () => {
  const detail = {
    id: 'i1',
    identifier: 'PM-1',
    title: 'Retry callbacks',
    statusKey: 'in_review',
    statuses: [],
    owner: { id: 'alice', name: 'alice' },
    activities: [
      {
        id: 'act1',
        actorType: 'user',
        actorId: 'alice',
        actorName: 'alice',
        action: 'approval_requested',
        details: { from: 'in_review', to: 'done' },
        createdAt: '2026-10-01T07:00:00.000Z',
      },
    ],
    threads: [
      {
        root: {
          id: 'c1',
          authorType: 'user',
          authorName: 'bob',
          content: 'Ready **now**',
          deleted: false,
          createdAt: '2026-10-01T07:30:00.000Z',
        },
        replies: [],
      },
    ],
    pendingApproval: {
      id: 'r1',
      issueTitle: 'Retry callbacks',
      createdAt: '2026-10-01T07:00:00.000Z',
      fromStatus: 'in_review',
      toStatus: 'done',
      requestedByType: 'user',
      requestedByName: 'alice',
      approverUserIds: ['lead'],
      approverNames: ['lead'],
    },
  };

  it('lets an approver decide a waiting request', async () => {
    issue.mockResolvedValue(detail);
    decideApproval.mockResolvedValue({ status: 'approved' });
    const [entry] = entriesOf([item('a')], [notice('a')]);
    render(
      wrap(
        <InboxDetail
          entry={entry}
          busy={false}
          onBack={vi.fn()}
          onAction={vi.fn()}
          onOpen={vi.fn()}
        />,
      ),
    );
    const approve = await screen.findByRole('button', {
      name: 'inbox.request.approve',
    });
    // The heading is the issue's title, the sentence says who asks for which move.
    expect(
      screen.getByRole('heading', { name: 'Retry callbacks' }),
    ).toBeInTheDocument();
    expect(screen.getByText('inbox.request.move')).toBeInTheDocument();
    expect(screen.getByText('inbox.request.since')).toBeInTheDocument();
    // The latest activity: the comment as a snippet, then the request.
    expect(screen.getByText('inbox.recent')).toBeInTheDocument();
    expect(screen.getByText('Ready now')).toBeInTheDocument();
    fireEvent.click(approve);
    await waitFor(() =>
      expect(decideApproval).toHaveBeenCalledWith('r1', 'approve', undefined),
    );
  });

  it('shows a settled decision as handled, without its buttons', async () => {
    issue.mockResolvedValue({ ...detail, pendingApproval: null });
    const [entry] = entriesOf(
      [item('a')],
      [
        notice('a', {
          resolvedAt: '2026-10-01T09:00:00.000Z',
          outcome: 'rejected',
        }),
      ],
    );
    render(
      wrap(
        <InboxDetail
          entry={entry}
          busy={false}
          onBack={vi.fn()}
          onAction={vi.fn()}
          onOpen={vi.fn()}
        />,
      ),
    );
    expect(await screen.findByText(/inbox\.resolved/u)).toHaveTextContent(
      'inbox.outcomes.rejected',
    );
    expect(
      screen.queryByRole('button', { name: 'inbox.request.approve' }),
    ).not.toBeInTheDocument();
  });

  it('holds the decision bar while the issue loads, and says why when the viewer may not decide', async () => {
    let resolve: (value: unknown) => void = () => undefined;
    issue.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const [entry] = entriesOf([item('a')], [notice('a')]);
    render(
      wrap(
        <InboxDetail
          entry={entry}
          busy={false}
          onBack={vi.fn()}
          onAction={vi.fn()}
          onOpen={vi.fn()}
        />,
      ),
    );
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    resolve({
      ...detail,
      pendingApproval: { ...detail.pendingApproval, approverUserIds: ['x'] },
    });
    expect(
      await screen.findByText('inbox.request.forbidden'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'inbox.request.approve' }),
    ).not.toBeInTheDocument();
  });

  it('quotes the comment a notification is about', async () => {
    issue.mockResolvedValue(detail);
    const [entry] = entriesOf(
      [item('a')],
      [
        notice('a', {
          kind: 'info',
          type: 'commented',
          decisionKey: null,
          data: { identifier: 'PM-1', actorName: 'bob', excerpt: 'Quoted' },
        }),
      ],
    );
    render(
      wrap(
        <InboxDetail
          entry={entry}
          busy={false}
          onBack={vi.fn()}
          onAction={vi.fn()}
          onOpen={vi.fn()}
        />,
      ),
    );
    expect(await screen.findByText('Quoted')).toBeInTheDocument();
  });
});

describe("a notice's values", () => {
  it("word a built-in agent's name from its key, and leave a named agent's as sent", () => {
    const { result } = renderHook(() => useParamsOf());
    const [builtIn, named] = entriesOf(
      [item('a'), item('b')],
      [
        notice('a', {
          type: 'agent_blocked',
          data: {
            identifier: 'PM-1',
            actorName: 'Coder',
            agentNameKey: 'studioAgents.presets.coder.name',
            agentNameNs: 'studio',
          },
        }),
        notice('b', {
          type: 'run_failed_final',
          data: { identifier: 'PM-2', agentName: 'Reviewer' },
        }),
      ],
    );
    expect(result.current(builtIn!)).toMatchObject({
      actorName: 'studioAgents.presets.coder.name',
    });
    expect(result.current(named!)).toMatchObject({ agentName: 'Reviewer' });
  });
});

describe("a blocked agent's card", () => {
  const blocked = {
    id: 'i1',
    identifier: 'PM-1',
    title: 'Migrate',
    revision: 7,
    statusKey: 'blocked',
    statuses: [],
    ownerUserId: 'lead',
    owner: { id: 'lead', name: 'lead' },
    activities: [],
    threads: [],
    pendingApproval: null,
  };
  const entry = () =>
    entriesOf(
      [item('a')],
      [
        notice('a', {
          type: 'agent_blocked',
          decisionKey: 'agents:blocked:i1:7',
          data: {
            identifier: 'PM-1',
            actorName: 'Coder',
            agentId: 'ag1',
            from: 'in_progress',
            question: 'Which database?',
          },
        }),
      ],
    )[0]!;

  it("shows the agent's question and lets the owner answer it or unblock the issue", async () => {
    issue.mockResolvedValue(blocked);
    createComment.mockResolvedValue({});
    updateIssue.mockResolvedValue({ issue: blocked, pendingApproval: null });
    render(
      wrap(
        <InboxDetail
          entry={entry()}
          busy={false}
          onBack={vi.fn()}
          onAction={vi.fn()}
          onOpen={vi.fn()}
        />,
      ),
    );
    expect(await screen.findByText('Which database?')).toBeInTheDocument();
    expect(screen.getByText('inbox.body.agent_blocked')).toBeInTheDocument();
    fireEvent.click(
      await screen.findByRole('button', { name: /inbox\.blocked\.unblock/u }),
    );
    await waitFor(() =>
      expect(updateIssue).toHaveBeenCalledWith('i1', {
        revision: 7,
        statusKey: 'in_progress',
      }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /inbox\.blocked\.answer/u }),
    );
    fireEvent.change(
      await screen.findByRole('textbox', { name: 'inbox.blocked.answerTitle' }),
      { target: { value: ' Postgres ' } },
    );
    fireEvent.click(screen.getByRole('button', { name: 'inbox.blocked.send' }));
    await waitFor(() =>
      expect(createComment).toHaveBeenCalledWith('i1', { content: 'Postgres' }),
    );
    expect(
      screen.getByRole('button', { name: /inbox\.blocked\.reassign/u }),
    ).toBeInTheDocument();
  });
});
