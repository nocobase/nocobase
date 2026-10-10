import type { Plan } from '@nocobase/app-plugin-projects/shared/plans';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  planQueryOf,
  readPlanFilter,
  usePlanPages,
} from '../../client/inbox/plans';
import { InboxList } from '@/extensions/nocobase-inbox/inbox-list';
import { InboxRegistryProvider } from '@/extensions/nocobase-inbox/registry-scope';

import { IssuePlansSection } from '../../client/issues/detail/issue-plans';
import { studioInboxCategories } from '../../client/pages/inbox/categories';
import {
  InboxOpenPlans,
  InboxPlanDetail,
  InboxPlans,
} from '../../client/pages/inbox/inbox-plans';

const plans = vi.fn();

const planQuery = vi.fn();

vi.mock('@/extensions/nocobase-plan-card/plan-card', () => ({
  // The card's own layout, or its parts in the caller's frame, as the real card hands them over.
  PlanCard: ({
    planId,
    frame,
  }: {
    planId: string;
    frame?: (parts: Record<string, ReactNode>) => ReactElement;
  }) =>
    frame ? (
      frame({
        title: `Plan ${planId}`,
        href: `/issues/plans/${planId}`,
        meta: <span>4 changes</span>,
        actions: (
          <>
            <button type='button'>Execute</button>
            <button type='button'>Void</button>
          </>
        ),
        content: <p>{`card:${planId}`}</p>,
      })
    ) : (
      <p>{`card:${planId}`}</p>
    ),
}));

vi.mock('@nocobase/app-plugin-projects/client/kit', () => ({
  PmEmpty: ({ title, action }: { title: string; action?: ReactNode }) => (
    <div>
      <p>{title}</p>
      {action}
    </div>
  ),
  PmLoadError: ({ title }: { title: string }) => <p>{title}</p>,
  PmTag: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  PlanListItem: ({
    plan,
    selected,
    onSelect,
  }: {
    plan: Plan;
    selected?: boolean;
    onSelect?: (plan: Plan) => void;
  }) =>
    onSelect ? (
      <button
        type='button'
        aria-current={selected ? 'true' : undefined}
        onClick={() => onSelect(plan)}
      >
        {`${plan.title} · ${plan.status}`}
      </button>
    ) : (
      <a
        href={`/issues/plans/${plan.id}`}
      >{`${plan.title} · ${plan.status}`}</a>
    ),
  planHref: (id: string) => `/issues/plans/${id}`,
  usePlanQuery: (id: string) => planQuery(id),
  planKeys: {
    list: (query: object) => ['pm', 'plans', 'list', query],
  },
  usePlanApi: () => ({ plans }),
  useViewer: () => ({ userId: 'u1' }),
}));

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

vi.mock('@nocobase/app-plugin-users/client/preferences', () => ({
  useUserPreference: (_key: string, options: { defaultValue: unknown }) => [
    options.defaultValue,
    () => undefined,
    { loaded: true, stored: false },
  ],
}));

function plan(id: string, overrides: Partial<Plan> = {}): Plan {
  return {
    id,
    title: `Plan ${id}`,
    description: '',
    status: 'pending',
    voidReason: null,
    source: { kind: 'conversation' },
    proposer: null,
    proposerName: 'Coder',
    deciderUserId: 'u1',
    deciderName: 'u1',
    createdBy: { type: 'user', id: 'u1' },
    revision: 1,
    rows: [],
    failure: null,
    expiresAt: '2026-10-07T00:00:00.000Z',
    rehearsedAt: '2026-10-06T00:00:00.000Z',
    executedAt: null,
    executedById: null,
    undoableUntil: null,
    skipped: [],
    createdAt: '2026-10-06T00:00:00.000Z',
    updatedAt: '2026-10-06T00:00:00.000Z',
    ...overrides,
  };
}

const wrap = (ui: ReactElement) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );

beforeEach(() => {
  plans.mockReset();
});

describe('the plans filter', () => {
  it('maps each status filter onto the list query', () => {
    expect(readPlanFilter(null)).toBe('all');
    expect(readPlanFilter('bogus')).toBe('all');
    expect(readPlanFilter('open')).toBe('open');
    expect(planQueryOf('all')).toEqual({});
    expect(planQueryOf('open')).toEqual({ status: 'open' });
    expect(planQueryOf('voided')).toEqual({ status: 'voided' });
    expect(planQueryOf('expired')).toEqual({ status: 'expired' });
  });
});

describe('the inbox plans', () => {
  it('lists the plans newest first, selects one, and loads more by cursor', async () => {
    plans
      .mockResolvedValueOnce({
        data: [plan('2'), plan('1', { status: 'executed' })],
        nextCursor: 'c1',
      })
      .mockResolvedValueOnce({ data: [plan('0')], nextCursor: null });
    const onSelect = vi.fn();
    wrap(
      <InboxPlans
        filter='all'
        selectedId='1'
        onFilter={vi.fn()}
        onSelect={onSelect}
      />,
    );
    const first = await screen.findByRole('button', {
      name: 'Plan 2 · pending',
    });
    expect(
      screen.getByRole('button', { name: 'Plan 1 · executed' }),
    ).toHaveAttribute('aria-current', 'true');
    expect(plans).toHaveBeenCalledWith({ cursor: undefined });
    fireEvent.click(first);
    expect(onSelect).toHaveBeenCalledWith('2');
    fireEvent.click(screen.getByRole('button', { name: 'inbox.loadMore' }));
    expect(
      await screen.findByRole('button', { name: 'Plan 0 · pending' }),
    ).toBeInTheDocument();
    expect(plans).toHaveBeenLastCalledWith({ cursor: 'c1' });
    expect(screen.queryByRole('button', { name: 'inbox.loadMore' })).toBeNull();
  });

  it('asks the server for the status filtered by', async () => {
    plans.mockResolvedValue({ data: [plan('3')], nextCursor: null });
    wrap(
      <InboxPlans
        filter='open'
        selectedId={null}
        onFilter={vi.fn()}
        onSelect={vi.fn()}
      />,
    );
    await screen.findByRole('button', { name: 'Plan 3 · pending' });
    expect(plans).toHaveBeenCalledWith({ status: 'open', cursor: undefined });
  });

  it('says there are no plans yet, or that none matches with a way to clear the filter', async () => {
    plans.mockResolvedValue({ data: [], nextCursor: null });
    const { unmount } = wrap(
      <InboxPlans
        filter='all'
        selectedId={null}
        onFilter={vi.fn()}
        onSelect={vi.fn()}
      />,
    );
    expect(await screen.findByText('inbox.plans.empty')).toBeInTheDocument();
    expect(screen.queryByText('inbox.plans.clearFilter')).toBeNull();
    unmount();
    const onFilter = vi.fn();
    wrap(
      <InboxPlans
        filter='voided'
        selectedId={null}
        onFilter={onFilter}
        onSelect={vi.fn()}
      />,
    );
    expect(await screen.findByText('inbox.plans.noMatch')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'inbox.plans.clearFilter' }),
    );
    expect(onFilter).toHaveBeenCalledWith('all');
  });

  it('shows the selected plan under the shared header: the title links to its page, the actions under it', () => {
    planQuery.mockImplementation((id: string) => ({ data: plan(id) }));
    const { rerender } = wrap(
      <InboxPlanDetail planId={null} onBack={vi.fn()} />,
    );
    expect(screen.getByText('inbox.plans.nothingSelected')).toBeInTheDocument();
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <InboxPlanDetail planId='p1' onBack={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const pane = screen.getByTestId('studio-inbox-plan');
    const header = pane.querySelector('header')!;
    expect(within(header).getByText('inbox.plans.label')).toBeInTheDocument();
    // One title, which is the link to the plan's page: no band above the card, no second header, no open button.
    const titles = screen.getAllByRole('heading');
    expect(titles).toHaveLength(1);
    expect(titles[0]).toHaveTextContent('Plan p1');
    expect(within(titles[0]!).getByRole('link')).toHaveAttribute(
      'href',
      '/issues/plans/p1',
    );
    expect(screen.queryByRole('button', { name: /open/iu })).toBeNull();
    expect(within(header).getByText('4 changes')).toBeInTheDocument();
    expect(
      within(header).getByRole('button', { name: 'Execute' }),
    ).toBeInTheDocument();
    expect(within(header).queryByText('card:p1')).toBeNull();
    expect(screen.getByText('card:p1')).toBeInTheDocument();
  });

  it('keeps the header while the plan fails to load', () => {
    planQuery.mockReturnValue({
      data: undefined,
      isError: true,
      error: new Error('down'),
      refetch: vi.fn(),
    });
    wrap(<InboxPlanDetail planId='p1' onBack={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'inbox.back' }),
    ).toBeInTheDocument();
    expect(screen.getByText('inbox.plans.loadOneFailed')).toBeInTheDocument();
  });

  it('lists only the open plans without a status filter in To do', async () => {
    plans.mockResolvedValue({ data: [], nextCursor: null });
    wrap(<InboxPlans filter='open' selectedId={null} onSelect={vi.fn()} />);
    expect(await screen.findByText('inbox.plans.noneOpen')).toBeInTheDocument();
    expect(plans).toHaveBeenCalledWith({ status: 'open', cursor: undefined });
    expect(
      screen.queryByRole('combobox', { name: 'inbox.plans.filterLabel' }),
    ).toBeNull();
  });

  it('lists the open plans as a group, leaving out those an item stands for', async () => {
    plans.mockResolvedValue({
      data: [plan('5'), plan('6')],
      nextCursor: null,
    });
    const onSelect = vi.fn();
    function Group(): ReactElement {
      const pages = usePlanPages('open');
      return (
        <InboxOpenPlans
          pages={pages}
          exclude={new Set(['6'])}
          selectedId={null}
          onSelect={onSelect}
        />
      );
    }
    wrap(<Group />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Plan 5 · pending' }),
    );
    expect(onSelect).toHaveBeenCalledWith('5');
    expect(
      screen.queryByRole('button', { name: 'Plan 6 · pending' }),
    ).toBeNull();
    expect(
      screen.getByRole('heading', { name: /inbox\.tabs\.plans/u }),
    ).toHaveTextContent('1');
  });

  it('shows no group while no plan is open', async () => {
    plans.mockResolvedValue({ data: [plan('6')], nextCursor: null });
    function Group(): ReactElement {
      const pages = usePlanPages('open');
      return (
        <div data-testid='group'>
          <InboxOpenPlans
            pages={pages}
            exclude={new Set(['6'])}
            selectedId={null}
            onSelect={vi.fn()}
          />
        </div>
      );
    }
    wrap(<Group />);
    await waitFor(() => expect(plans).toHaveBeenCalled());
    expect(screen.getByTestId('group')).toBeEmptyDOMElement();
  });

  it('is the Plans kind of the inbox list, showing the plans in place of the items', () => {
    const onFilter = vi.fn();
    wrap(
      <InboxRegistryProvider
        registry={{
          renderers: [],
          feeds: [],
          categories: studioInboxCategories,
        }}
      >
        <InboxList
          filter={{ view: 'all', kind: 'plans' }}
          unread={2}
          pending={1}
          groups={{ decision: [], info: [] }}
          loaded
          query={{
            isError: false,
            error: null,
            hasNextPage: false,
            isFetchingNextPage: false,
            refetch: vi.fn(),
            fetchNextPage: vi.fn(),
          }}
          selectedId={null}
          busy={false}
          onFilter={onFilter}
          onSelect={vi.fn()}
          onOpen={vi.fn()}
          onAction={vi.fn()}
          collections={{ plans: { list: <p>plans list</p> } }}
        />
      </InboxRegistryProvider>,
    );
    expect(screen.getByText('plans list')).toBeInTheDocument();
    expect(screen.queryByText('inbox.emptyAll')).toBeNull();
    expect(
      screen.getByRole('combobox', { name: 'inbox.kinds.label' }),
    ).toHaveTextContent('inbox.kinds.plans');
    // To do still counts what waits on the viewer, and keeps the kind Plans.
    const todo = screen.getByRole('tab', { name: /inbox\.views\.todo/u });
    expect(todo).toHaveTextContent('1');
    fireEvent.click(todo);
    expect(onFilter).toHaveBeenCalledWith({ view: 'todo', kind: 'plans' });
  });
});

describe('the issue page related plans', () => {
  it('lists the plans about the issue, linking to each', async () => {
    plans.mockResolvedValue({
      data: [plan('9', { status: 'voided' })],
      nextCursor: null,
    });
    wrap(<IssuePlansSection issue={{ id: 'i1', ownerUserId: 'u1' }} />);
    // Closed while no plan awaits the viewer; the header opens it.
    fireEvent.click(
      await screen.findByRole('button', { name: /issuePlans\.title/u }),
    );
    const link = await screen.findByRole('link', { name: 'Plan 9 · voided' });
    expect(link).toHaveAttribute('href', '/issues/plans/9');
    expect(
      screen.getByRole('heading', { name: /issuePlans\.title/u }),
    ).toBeInTheDocument();
    expect(plans).toHaveBeenCalledWith({
      issueId: 'i1',
      limit: 10,
      cursor: undefined,
    });
  });

  it('shows nothing when there are none', async () => {
    plans.mockResolvedValue({ data: [], nextCursor: null });
    const { container } = wrap(
      <IssuePlansSection issue={{ id: 'i1', ownerUserId: 'u1' }} />,
    );
    await waitFor(() => expect(plans).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
