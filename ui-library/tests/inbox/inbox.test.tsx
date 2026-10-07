import { fireEvent, render, screen, within } from '@testing-library/react';
import { useTranslation } from '@nocobase/i18n/client';
import { FlaskConicalIcon } from 'lucide-react';
import { useMemo, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { DecisionActionsBar } from '../../registry/inbox/inbox/decision-actions-bar';
import { InboxDetail } from '../../registry/inbox/inbox/inbox-detail';
import {
  InboxList,
  type InboxListProps,
} from '../../registry/inbox/inbox/inbox-list';
import {
  entriesOf,
  freshIds,
  groupEntries,
  inboxFilterParams,
  isSettled,
  kindsOf,
  mergeWaiting,
  readInboxFilter,
  shownEntries,
  stepSelection,
  unreadByCategory,
  waitingByCategory,
  type InboxCategory,
  type InboxCollectionCategory,
  type InboxEntry,
} from '../../registry/inbox/inbox/model';
import {
  defaultInboxCategories,
  defineInboxRenderer,
  type InboxRegistry,
} from '../../registry/inbox/inbox/registry';
import { InboxRegistryProvider } from '../../registry/inbox/inbox/registry-scope';
import { item, notice } from './fixtures';
import { Frame } from './frame';

/** A collection of records kept in another API, listed after the decisions. */
const plans: InboxCollectionCategory = {
  type: 'collection',
  id: 'plans',
  label: () => 'Plans',
  param: 'plan',
  params: ['status'],
  after: 'decision',
  // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix -- the category's hook, which needs no other hook here
  useCollection: () => ({ count: 0, loaded: true, group: null, list: null }),
  Detail: () => null,
};
const withPlans: readonly InboxCategory[] = [...defaultInboxCategories, plans];

describe('the inbox model', () => {
  it('lists waiting decisions first, settled ones after, and everything else as notifications', () => {
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
        notice('d', { kind: 'info' }),
      ],
    );
    const groups = groupEntries(entries, defaultInboxCategories);
    expect(groups.decision?.map((entry) => entry.item.id)).toEqual(['b', 'a']);
    // An item the source knows nothing about is information.
    expect(groups.info?.map((entry) => entry.item.id)).toEqual(['c', 'd']);
    expect(unreadByCategory(groups)).toEqual({ decision: 2, info: 1 });
    expect(isSettled(entries[0]!)).toBe(true);
  });

  it('counts what waits from the source, else from the items not yet settled', () => {
    const groups = groupEntries(
      entriesOf(
        [item('a'), item('b')],
        [notice('a'), notice('b', { resolvedAt: '2026-10-01T09:00:00.000Z' })],
      ),
      defaultInboxCategories,
    );
    expect(
      waitingByCategory(groups, defaultInboxCategories, undefined),
    ).toEqual({ decision: 1 });
    expect(
      waitingByCategory(groups, defaultInboxCategories, { decision: 7 }),
    ).toEqual({ decision: 7 });
  });

  it('reads the view and the kind from the URL, offering in To do only what waits', () => {
    const read = (search: string) =>
      readInboxFilter(new URLSearchParams(search), withPlans);
    expect(read('')).toEqual({ view: 'all', kind: 'all' });
    expect(read('view=todo&kind=plans')).toEqual({
      view: 'todo',
      kind: 'plans',
    });
    expect(read('kind=info')).toEqual({ view: 'all', kind: 'info' });
    expect(read('view=todo&kind=info')).toEqual({ view: 'todo', kind: 'all' });
    expect(read('view=bogus&kind=bogus')).toEqual({ view: 'all', kind: 'all' });
    expect(kindsOf('todo', withPlans)).toEqual(['all', 'decision', 'plans']);
    expect(kindsOf('all', withPlans)).toEqual([
      'all',
      'decision',
      'info',
      'plans',
    ]);
  });

  it("writes a filter over the URL, dropping the collections' parameters and selection", () => {
    const params = new URLSearchParams(
      'kind=plans&status=voided&plan=p1&item=i1',
    );
    expect(
      inboxFilterParams(
        params,
        { view: 'todo', kind: 'decision' },
        withPlans,
      ).toString(),
    ).toBe('kind=decision&item=i1&view=todo');
    expect(
      inboxFilterParams(
        params,
        { view: 'all', kind: 'all' },
        withPlans,
      ).toString(),
    ).toBe('item=i1');
  });

  it('shows what still waits in To do, and everything in All', () => {
    const groups = groupEntries(
      entriesOf(
        [item('a'), item('b'), item('c')],
        [
          notice('a', { resolvedAt: '2026-10-01T09:00:00.000Z' }),
          notice('b'),
          notice('c', { kind: 'info' }),
        ],
      ),
      withPlans,
    );
    const ids = (view: 'all' | 'todo', kind: string) =>
      shownEntries({ view, kind }, groups, withPlans).map(
        (entry) => entry.item.id,
      );
    expect(ids('all', 'all')).toEqual(['b', 'a', 'c']);
    expect(ids('all', 'decision')).toEqual(['b', 'a']);
    expect(ids('all', 'info')).toEqual(['c']);
    expect(ids('todo', 'all')).toEqual(['b']);
    expect(ids('all', 'plans')).toEqual([]);
  });

  it('lists what waits in full before the pages, each once', () => {
    const waiting = entriesOf([item('w')], [notice('w')]);
    const paged = entriesOf([item('a'), item('w')], [notice('w')]);
    expect(mergeWaiting(waiting, paged).map((entry) => entry.item.id)).toEqual([
      'w',
      'a',
    ]);
  });

  it('steps the selection, and marks as fresh only what arrived later', () => {
    expect(stepSelection(['a', 'b', 'c'], 'b', 1)).toBe('c');
    expect(stepSelection(['a', 'b', 'c'], 'c', 1)).toBe('c');
    expect(stepSelection(['a', 'b'], null, -1)).toBe('a');
    expect(stepSelection([], null, 1)).toBeNull();
    const entries = entriesOf([item('a'), item('b')], []);
    expect(freshIds(entries, null).size).toBe(0);
    expect([...freshIds(entries, new Set(['a']))]).toEqual(['b']);
  });
});

const query = {
  isError: false,
  error: null,
  hasNextPage: false,
  isFetchingNextPage: false,
  refetch: vi.fn(),
  fetchNextPage: vi.fn(),
};

function renderList(
  entries: readonly InboxEntry[],
  props: Partial<InboxListProps> = {},
  registry?: InboxRegistry,
): void {
  const categories = registry?.categories ?? defaultInboxCategories;
  const list = (
    <InboxList
      filter={{ view: 'all', kind: 'all' }}
      unread={entries.filter((entry) => !entry.item.readAt).length}
      pending={0}
      groups={groupEntries(entries, categories)}
      loaded
      query={query}
      selectedId={null}
      busy={false}
      onFilter={vi.fn()}
      onSelect={vi.fn()}
      onOpen={vi.fn()}
      onAction={vi.fn()}
      {...props}
    />
  );
  render(
    <Frame>
      {registry ? (
        <InboxRegistryProvider registry={registry}>
          {list}
        </InboxRegistryProvider>
      ) : (
        list
      )}
    </Frame>,
  );
}

describe('the inbox list', () => {
  const entries = entriesOf(
    [item('a'), item('b')],
    [notice('a'), notice('b', { kind: 'info' })],
  );

  it('shows decisions, then notifications, with what waits on To do and the unread count on All', () => {
    renderList(entries, { pending: 4, waiting: { decision: 4 } });
    const [decisions, notices] = screen.getAllByRole('list');
    expect(within(decisions!).getByText('Title a')).toBeInTheDocument();
    expect(within(notices!).getByText('Title b')).toBeInTheDocument();
    expect(screen.getByLabelText('4 waiting')).toHaveTextContent('4');
    expect(screen.getByLabelText('2 unread')).toHaveTextContent('2');
    expect(
      screen.getByRole('heading', { name: /Needs my decision/u }),
    ).toHaveTextContent('4');
    expect(screen.getByRole('combobox', { name: 'Type' })).toHaveTextContent(
      'All types',
    );
  });

  it('switches views keeping a kind the view offers', () => {
    const onFilter = vi.fn();
    renderList(entries, { filter: { view: 'all', kind: 'info' }, onFilter });
    expect(screen.queryByText('Title a')).not.toBeInTheDocument();
    expect(screen.getByText('Title b')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /To do/u }));
    // To do has no notifications, so the kind goes back to every kind.
    expect(onFilter).toHaveBeenLastCalledWith({ view: 'todo', kind: 'all' });
  });

  it("places a collection's group after the category it follows, and its list in place of the items", () => {
    const registry: InboxRegistry = {
      renderers: [],
      feeds: [],
      categories: withPlans,
    };
    const settled = entriesOf(
      [item('a'), item('s'), item('b')],
      [
        notice('a'),
        notice('s', { resolvedAt: '2026-10-01T09:00:00.000Z' }),
        notice('b', { kind: 'info' }),
      ],
    );
    renderList(
      settled,
      {
        filter: { view: 'todo', kind: 'all' },
        collections: { plans: { group: <p>open plans</p>, count: 1 } },
      },
      registry,
    );
    expect(screen.getByText('Title a')).toBeInTheDocument();
    expect(screen.queryByText('Title s')).not.toBeInTheDocument();
    expect(screen.queryByText('Title b')).not.toBeInTheDocument();
    expect(
      screen
        .getByText('Title a')
        .compareDocumentPosition(screen.getByText('open plans')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('shows a collection selected by the kind filter instead of the items', () => {
    renderList(
      entries,
      {
        filter: { view: 'all', kind: 'plans' },
        collections: { plans: { list: <p>plans list</p> } },
      },
      { renderers: [], feeds: [], categories: withPlans },
    );
    expect(screen.getByText('plans list')).toBeInTheDocument();
    expect(screen.queryByText('Title a')).toBeNull();
    expect(screen.getByRole('combobox', { name: 'Type' })).toHaveTextContent(
      'Plans',
    );
  });

  it('says nothing waits, or that no item of the kind matches with a way to clear it', () => {
    const onFilter = vi.fn();
    const { unmount } = render(
      <Frame>
        <InboxList
          filter={{ view: 'todo', kind: 'all' }}
          unread={0}
          pending={0}
          groups={{ decision: [], info: [] }}
          loaded
          query={query}
          selectedId={null}
          busy={false}
          onFilter={onFilter}
          onSelect={vi.fn()}
          onOpen={vi.fn()}
          onAction={vi.fn()}
        />
      </Frame>,
    );
    expect(screen.getByText('Nothing waiting for you')).toBeInTheDocument();
    expect(screen.queryByText('Clear filter')).toBeNull();
    unmount();
    renderList([], { filter: { view: 'all', kind: 'info' }, onFilter });
    expect(screen.getByText('No notifications')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filter' }));
    expect(onFilter).toHaveBeenCalledWith({ view: 'all', kind: 'all' });
  });

  it('selects an item when its card is clicked', () => {
    const onSelect = vi.fn();
    renderList(entries, { onSelect });
    fireEvent.click(screen.getByText('Title a'));
    expect((onSelect.mock.calls[0]?.[0] as InboxEntry).item.id).toBe('a');
  });
});

const signOff = vi.fn();

/** A contributor's renderer, in a namespace of its own: QA sign-offs worded from their data, with one action. */
const qaRenderer = defineInboxRenderer<{ readonly build: string }>({
  source: 'qa',
  namespace: '@acme/qa',
  resources: {
    'en-US': { label: 'QA sign-off', detail: 'QA sign-off waiting' },
  },
  icon: () => FlaskConicalIcon,
  useWording() {
    const { t } = useTranslation();
    return {
      label: (_entry, where) => (where === 'detail' ? t('detail') : t('label')),
      text: (entry, model) => ({
        title: `Sign off ${String(entry.notice?.data?.build)}`,
        sentence: model ? `Loaded ${model.build}` : null,
      }),
      outcome: (outcome) => `QA ${outcome}`,
    };
  },
  useModel(entry) {
    const build = String(entry.notice?.data?.build);
    return useMemo(() => ({ build }), [build]);
  },
  // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix -- the renderer's hook, which needs no other hook here
  useCanAct: (entry) =>
    entry.notice?.resolvedAt ? { state: 'none' } : { state: 'yes' },
  Actions: ({ entry, onDecided }) => (
    <button
      type='button'
      onClick={() => {
        signOff(entry.notice?.decisionKey);
        onDecided();
      }}
    >
      Sign off
    </button>
  ),
  Body: ({ model }) => <p>{`Build ${model.build} passed every check`}</p>,
});

function renderDetail(
  entry: InboxEntry,
  toolbar?: (input: { readonly title: string }) => ReactElement,
  onOpen = vi.fn(),
): ReturnType<typeof vi.fn> {
  const onAction = vi.fn();
  render(
    <Frame>
      <InboxRegistryProvider registry={{ renderers: [qaRenderer], feeds: [] }}>
        <InboxDetail
          entry={entry}
          busy={false}
          onBack={vi.fn()}
          onAction={onAction}
          onOpen={onOpen}
          toolbar={toolbar}
        />
      </InboxRegistryProvider>
    </Frame>,
  );
  return onAction;
}

describe('the inbox detail', () => {
  it('shows an item nobody renders as sent, with only read and delete, and its title opening it', () => {
    const [entry] = entriesOf(
      [item('a', { body: 'Something needs you' })],
      [notice('a', { data: { nested: { deep: [1, { x: null }] } } })],
    );
    const onOpen = vi.fn();
    renderDetail(entry!, undefined, onOpen);
    const title = screen.getByRole('heading', { name: 'Title a' });
    expect(screen.getByText('Something needs you')).toBeInTheDocument();
    expect(screen.getByText('Needs my decision')).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('button')
        .map((button) => button.ariaLabel ?? button.textContent),
    ).toEqual(['Back to the list', 'Mark as read', 'Delete']);
    // The title is the way to what the item is about.
    const link = within(title).getByRole('link', { name: 'Title a' });
    expect(link).toHaveAttribute('href', '/things/a');
    fireEvent.click(link);
    expect(onOpen).toHaveBeenCalledWith(entry);
  });

  it('keeps one header for every kind: the kind line, the title linking out, and the decision right under it', () => {
    const [entry] = entriesOf(
      [item('a')],
      [notice('a', { source: 'qa', data: { build: '#88' } })],
    );
    renderDetail(entry!);
    const header = screen
      .getByTestId('nocobase-inbox-detail')
      .querySelector('header')!;
    expect(within(header).getByText('QA sign-off waiting')).toBeInTheDocument();
    expect(
      within(
        within(header).getByRole('heading', { name: 'Sign off #88' }),
      ).getByRole('link'),
    ).toHaveAttribute('href', '/things/a');
    expect(
      within(header).getByRole('button', { name: 'Sign off' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Open' })).toBeNull();
  });

  it('shows a plain title for an item with nowhere to go', () => {
    const [entry] = entriesOf(
      [item('a', { target: null })],
      [notice('a', { kind: 'info' })],
    );
    renderDetail(entry!);
    expect(
      screen.getByRole('heading', { name: 'Title a' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it("words, renders and decides a contributor's item in its namespace, with the toolbar slot", () => {
    const [entry] = entriesOf(
      [item('a')],
      [notice('a', { source: 'qa', data: { build: '#88' } })],
    );
    const onAction = renderDetail(entry!, ({ title }) => (
      <span>{`Ask about ${title}`}</span>
    ));
    expect(screen.getByText('QA sign-off waiting')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Sign off #88' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Loaded #88')).toBeInTheDocument();
    expect(
      screen.getByText('Build #88 passed every check'),
    ).toBeInTheDocument();
    expect(screen.getByText('Ask about Sign off #88')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sign off' }));
    expect(signOff).toHaveBeenCalledWith('k-a');
    // Deciding marks the item read.
    expect(onAction).toHaveBeenCalledWith(entry, 'read');
  });

  it('says how a settled decision ended, in its own words', () => {
    const [entry] = entriesOf(
      [item('a', { readAt: '2026-10-01T09:00:00.000Z' })],
      [
        notice('a', {
          source: 'qa',
          data: { build: '#88' },
          resolvedAt: '2026-10-01T09:00:00.000Z',
          outcome: 'passed',
        }),
      ],
    );
    renderDetail(entry!);
    expect(screen.getByText(/Handled/u)).toHaveTextContent('QA passed');
    expect(screen.queryByRole('button', { name: 'Sign off' })).toBeNull();
  });

  it('says what to do while nothing is selected', () => {
    render(
      <Frame>
        <InboxDetail
          entry={null}
          busy={false}
          onBack={vi.fn()}
          onAction={vi.fn()}
          onOpen={vi.fn()}
        />
      </Frame>,
    );
    expect(screen.getByText('Select an item to view it')).toBeInTheDocument();
  });
});

describe('the decision bar', () => {
  it('approves at once, and rejects only with a reason sent by Enter', () => {
    const onRun = vi.fn();
    render(
      <Frame>
        <DecisionActionsBar
          itemTitle='PM-1'
          pending={null}
          disabled={false}
          onRun={onRun}
        />
      </Frame>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(onRun).toHaveBeenLastCalledWith('approve', '');
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    expect(screen.getByRole('button', { name: 'Reject' })).toBeDisabled();
    const box = screen.getByRole('textbox', { name: 'Reject: PM-1' });
    fireEvent.change(box, { target: { value: ' Not yet ' } });
    fireEvent.keyDown(box, { key: 'Enter', shiftKey: true });
    expect(onRun).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(onRun).toHaveBeenLastCalledWith('reject', 'Not yet');
  });
});
