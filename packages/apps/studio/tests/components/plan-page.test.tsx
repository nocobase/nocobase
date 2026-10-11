/**
 * A plan's page leads back to the issue it belongs to: opened over an issue page, its trail in the header and its issue
 * link return to that page as it was left, under whichever list the issue is opened; opened on its own, its trail still
 * runs through the issue it is about.
 */
import { PageBreadcrumbProvider } from '@nocobase/app-client';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import type { Plan } from '@nocobase/app-plugin-projects/shared/plans';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { Breadcrumbs } from '../../client/components/breadcrumbs';
import { IssueParentOutlet } from '../../client/issues/detail/issue-parent-outlet';
import {
  issueBeneathPlan,
  issuePlanLocation,
} from '../../client/issues/detail/plan-links';

const PROJECT = { id: 'p1', name: 'Studio', leadUserId: null };
const ISSUES: Record<string, IssueDetail> = {
  i12: {
    id: 'i12',
    identifier: 'PM-12',
    title: 'Export',
    parent: null,
    project: PROJECT,
  } as unknown as IssueDetail,
  i30: {
    id: 'i30',
    identifier: 'PM-30',
    title: 'Loose',
    parent: null,
    project: null,
  } as unknown as IssueDetail,
};
ISSUES['PM-12'] = ISSUES.i12 as IssueDetail;

const PLANS: Record<string, Plan> = {
  // About PM-12 by its source, and PM-30 by a row.
  p1: {
    id: 'p1',
    title: 'Assign the executor',
    source: { kind: 'statusRule', issueId: 'i12' },
    rows: [
      {
        id: 'r1',
        position: 0,
        op: 'issue.update',
        ref: null,
        params: { issue: 'i30', set: { priority: 'high' } },
        check: null,
        result: null,
      },
    ],
  } as unknown as Plan,
  // About no issue.
  p2: {
    id: 'p2',
    title: 'Create a project',
    source: { kind: 'conversation' },
    rows: [],
  } as unknown as Plan,
};

vi.mock('@nocobase/app-plugin-projects/client/kit', () => ({
  PmDetailSkeleton: () => <p>loading</p>,
  PmLoadError: ({ title }: { title: string }) => <p>{title}</p>,
  usePageContextSource: () => undefined,
  usePlanQuery: (planId: string) => ({
    data: PLANS[planId],
    isError: false,
  }),
  usePlanIssue: (issueId: string | null) => ({
    data: issueId ? ISSUES[issueId] : undefined,
  }),
  usePlanWording: () => (plan: Plan) => ({
    title: plan.title,
    description: '',
  }),
}));

// The card's issue links, as the real card hands each issue to `issueHref`, the first one first.
vi.mock('@/extensions/nocobase-plan-card/plan-card', () => ({
  PlanCard: ({
    firstIssueId,
    issueHref,
  }: {
    firstIssueId?: string | null;
    issueHref: (issue: { id: string; identifier: string }) => string;
  }) => {
    const first = firstIssueId ? ISSUES[firstIssueId] : undefined;
    return first ? (
      <Link
        to={issueHref({ id: first.id, identifier: first.identifier })}
        data-testid='card-issue'
      >
        {first.identifier}
      </Link>
    ) : null;
  },
}));

const { default: PlanPage } = await import('../../client/pages/issues/plan');

function Where(): ReactElement {
  const { pathname, search } = useLocation();
  return <output data-testid='where'>{pathname + search}</output>;
}

function MyIssuesTab(): ReactElement {
  const { search } = useLocation();
  return (
    <IssueParentOutlet
      parent={{
        levels: [
          {
            label: 'My issues',
            to: { pathname: '/my-issues/owned', search },
          },
        ],
        path: '/my-issues/owned',
        search,
      }}
    />
  );
}

function renderAt(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      {/* What the layout does: the page declares its trail and the header shows it. */}
      <PageBreadcrumbProvider>
        <header>
          <Breadcrumbs />
        </header>
        <Routes>
          <Route path='/issues/plans/:planId' element={<PlanPage />} />
          <Route path='/issues/:issueId/plans/:planId' element={<PlanPage />} />
          {/* An issue opened over a tab of My issues: the tab declares itself to what opens over it. */}
          <Route path='/my-issues/owned' element={<MyIssuesTab />}>
            <Route path=':issueId/plans/:planId' element={<PlanPage />} />
          </Route>
          <Route path='*' element={null} />
        </Routes>
        <Where />
      </PageBreadcrumbProvider>
    </MemoryRouter>,
  );
}

const trail = () => within(screen.getByRole('banner')).getByRole('navigation');
// Each level is a link but the last, the current page, which the primitives mark as a disabled link.
const levels = () =>
  within(trail())
    .getAllByRole('link')
    .map((item) => item.textContent);
const where = () => screen.getByTestId('where').textContent;

describe('plan links', () => {
  it('opens a plan over the issue page with its search, and finds that page again', () => {
    const location = issuePlanLocation('/issues/PM-12', 'p 1', '?comment=c1');
    expect(location).toEqual({
      pathname: '/issues/PM-12/plans/p%201',
      search: '?comment=c1',
    });
    expect(issueBeneathPlan(location)).toEqual({
      pathname: '/issues/PM-12',
      search: '?comment=c1',
    });
    expect(
      issueBeneathPlan({ pathname: '/issues/plans/p1', search: '' }),
    ).toBeNull();
    expect(
      issueBeneathPlan({
        pathname: '/my-issues/owned/PM-12/plans/p1',
        search: '?q=a',
      }),
    ).toEqual({ pathname: '/my-issues/owned/PM-12', search: '?q=a' });
  });
});

describe('the plan page', () => {
  it('over an issue: trails through the list to the issue, which returns to the issue page as it was left', () => {
    renderAt('/issues/PM-12/plans/p1?comment=c1');
    expect(levels()).toEqual(['nav.issues', 'PM-12', 'Assign the executor']);
    fireEvent.click(within(trail()).getByRole('link', { name: 'PM-12' }));
    expect(where()).toBe('/issues/PM-12?comment=c1');
  });

  it('over an issue: lists that issue first, linking back to the page beneath', () => {
    renderAt('/issues/PM-12/plans/p1?comment=c1');
    fireEvent.click(screen.getByTestId('card-issue'));
    expect(where()).toBe('/issues/PM-12?comment=c1');
  });

  it('over an issue opened from My issues: trails through that list and returns to the issue under it', () => {
    renderAt('/my-issues/owned/PM-12/plans/p1?q=export');
    expect(levels()).toEqual(['My issues', 'PM-12', 'Assign the executor']);
    fireEvent.click(within(trail()).getByRole('link', { name: 'PM-12' }));
    expect(where()).toBe('/my-issues/owned/PM-12?q=export');
  });

  it('on its own: trails through the issue it is about, linking to that issue rather than the list', () => {
    renderAt('/issues/plans/p1');
    expect(levels()).toEqual(['nav.issues', 'PM-12', 'Assign the executor']);
    fireEvent.click(within(trail()).getByRole('link', { name: 'PM-12' }));
    expect(where()).toBe('/issues/PM-12');
  });

  it('about no issue: keeps the issues list as its trail', () => {
    renderAt('/issues/plans/p2');
    expect(levels()).toEqual(['nav.issues', 'Create a project']);
  });
});
