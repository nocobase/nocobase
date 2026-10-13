import type { Plan } from '@nocobase/app-plugin-projects/shared/plans';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@nocobase/app-plugin-projects/client/kit', () => ({
  PlanListItem: ({ plan, to }: { plan: Plan; to?: unknown }) => (
    <span data-to={JSON.stringify(to)}>{plan.title}</span>
  ),
  planKeys: {},
  usePlanApi: () => null,
  useViewer: () => ({ userId: 'u1' }),
}));

const { IssuePlansPanel } =
  await import('../../client/issues/detail/issue-plans');
const { PLANS_OPEN_KEY, awaitsViewer } =
  await import('../../client/issues/detail/plans-state');

const NOW = Date.parse('2026-10-06T10:00:00.000Z');

function plan(values: Partial<Plan> = {}): Plan {
  return {
    id: 'p1',
    title: 'Assign the executor',
    status: 'pending',
    deciderUserId: 'u1',
    source: { kind: 'conversation' },
    expiresAt: '2026-10-07T10:00:00.000Z',
    ...values,
  } as Plan;
}

function renderPanel(awaiting: number): void {
  render(
    <MemoryRouter initialEntries={['/issues/PM-12?comment=c1']}>
      <Routes>
        <Route
          path='/issues/:issueId'
          element={
            <IssuePlansPanel
              plans={[plan()]}
              awaiting={awaiting}
              hasMore={false}
              loadingMore={false}
              onMore={() => {}}
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

const header = () => screen.getByRole('button', { name: /issuePlans.title/u });
const listed = () => screen.queryByText('Assign the executor');

afterEach(() => localStorage.clear());

describe('awaitsViewer', () => {
  it('counts the open, unexpired plans the viewer decides, and a status rule’s plan for the issue owner', () => {
    expect(awaitsViewer(plan(), 'u1', 'u2', NOW)).toBe(true);
    expect(awaitsViewer(plan({ status: 'stale' }), 'u1', 'u2', NOW)).toBe(true);
    expect(awaitsViewer(plan({ status: 'executed' }), 'u1', 'u2', NOW)).toBe(
      false,
    );
    expect(
      awaitsViewer(
        plan({ expiresAt: '2026-10-06T09:00:00.000Z' }),
        'u1',
        'u2',
        NOW,
      ),
    ).toBe(false);
    expect(awaitsViewer(plan({ deciderUserId: 'u3' }), 'u1', 'u2', NOW)).toBe(
      false,
    );
    expect(
      awaitsViewer(
        plan({
          deciderUserId: 'u3',
          source: { kind: 'statusRule', issueId: 'i1' },
        }),
        'u1',
        'u1',
        NOW,
      ),
    ).toBe(true);
    expect(awaitsViewer(plan(), undefined, 'u2', NOW)).toBe(false);
  });
});

describe('IssuePlansPanel', () => {
  it('starts closed, with the count, when nothing awaits the viewer', () => {
    renderPanel(0);
    expect(header()).toHaveAttribute('aria-expanded', 'false');
    expect(header()).toHaveTextContent('1');
    expect(listed()).toBeNull();
    expect(screen.queryByText('issuePlans.awaiting')).toBeNull();
  });

  it('starts open, and says so in the header, when a plan awaits the viewer', () => {
    renderPanel(2);
    expect(header()).toHaveAttribute('aria-expanded', 'true');
    expect(header()).toHaveTextContent('issuePlans.awaiting');
    expect(listed()).not.toBeNull();
  });

  it('opens each plan over the issue page, so leaving it returns there', () => {
    renderPanel(1);
    expect(listed()).toHaveAttribute(
      'data-to',
      JSON.stringify({
        pathname: '/issues/PM-12/plans/p1',
        search: '?comment=c1',
      }),
    );
  });

  it('remembers the person’s choice for the next issue', () => {
    renderPanel(0);
    fireEvent.click(header());
    expect(listed()).not.toBeNull();
    expect(localStorage.getItem(PLANS_OPEN_KEY)).toBe('true');
    cleanupAndRender(0);
    expect(header()).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(header());
    expect(localStorage.getItem(PLANS_OPEN_KEY)).toBe('false');
    cleanupAndRender(0);
    expect(header()).toHaveAttribute('aria-expanded', 'false');
    // A decision waiting for the viewer opens it anyway.
    cleanupAndRender(1);
    expect(header()).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens and closes without storage', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    renderPanel(0);
    fireEvent.click(header());
    expect(header()).toHaveAttribute('aria-expanded', 'true');
    setItem.mockRestore();
    getItem.mockRestore();
  });
});

function cleanupAndRender(awaiting: number): void {
  cleanup();
  renderPanel(awaiting);
}
