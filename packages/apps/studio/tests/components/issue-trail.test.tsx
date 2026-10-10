/**
 * An issue's trail follows the list it is opened over: the issue page is declared under each list (`issueDetailRoute`),
 * and the list's page declares its trail and address to it (`IssueParentOutlet`). At its own address the issue is under
 * the issues list as last seen.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';

import { PageBreadcrumbProvider } from '@nocobase/app-client';

import { Breadcrumbs } from '../../client/components/breadcrumbs';
import { IssueParentOutlet } from '../../client/issues/detail/issue-parent-outlet';
import {
  useIssueTrail,
  type IssueTrailIssue,
  type IssueTrailOptions,
} from '../../client/issues/detail/issue-trail';
import {
  ReturnLocationsContext,
  useTrackReturnLocations,
} from '../../client/layouts/return-locations';

const PARENT = { id: 'i1', identifier: 'PM-1', title: 'Board' };

/** An issue page, or a page under it: it declares the trail, which the header shows. */
function IssuePage({
  issue,
  options,
}: {
  readonly issue: IssueTrailIssue;
  readonly options?: IssueTrailOptions;
}): ReactElement {
  useIssueTrail(issue, options);
  return <h1>{issue.identifier}</h1>;
}

/** A list that opens issues over itself, declaring its trail and address as the tabs of `/my-issues` do. */
function ListPage({
  path,
  levels,
}: {
  readonly path: string;
  readonly levels: (search: string) => { label: string; to: string }[];
}): ReactElement {
  const { search } = useLocation();
  return (
    <IssueParentOutlet parent={{ levels: levels(search), path, search }} />
  );
}

function Where(): ReactElement {
  const { pathname, search } = useLocation();
  return <output data-testid='where'>{pathname + search}</output>;
}

/** What the layout does: follows the locations and renders the trail in its header; the issue page declares it. */
function Shell({
  issue,
  visits,
  options,
}: {
  readonly issue: IssueTrailIssue;
  readonly visits: readonly string[];
  readonly options?: IssueTrailOptions;
}): ReactElement {
  const returns = useTrackReturnLocations(useLocation());
  const page = <IssuePage issue={issue} {...(options ? { options } : {})} />;
  return (
    <PageBreadcrumbProvider>
      <ReturnLocationsContext.Provider value={returns}>
        <header>
          <Breadcrumbs />
        </header>
        <nav aria-label='visits'>
          {visits.map((to) => (
            <Link key={to} to={to}>
              {to}
            </Link>
          ))}
        </nav>
        <Routes>
          <Route path='/issues/:issueId' element={page} />
          <Route
            path='/my-issues/owned'
            element={
              <ListPage
                path='/my-issues/owned'
                levels={(search) => [
                  { label: 'My issues', to: `/my-issues/owned${search}` },
                ]}
              />
            }
          >
            <Route path=':issueId' element={page} />
          </Route>
          <Route
            path='/projects/p1/issues'
            element={
              <ListPage
                path='/projects/p1/issues'
                levels={(search) => [
                  { label: 'Projects', to: '/projects' },
                  { label: 'Studio', to: `/projects/p1/issues${search}` },
                ]}
              />
            }
          >
            <Route path=':issueId' element={page} />
          </Route>
          <Route path='*' element={null} />
        </Routes>
        <Where />
      </ReturnLocationsContext.Provider>
    </PageBreadcrumbProvider>
  );
}

/** Opens `visits` in turn, the last being the issue. */
function renderTrail(
  issue: IssueTrailIssue,
  visits: readonly string[],
  options?: IssueTrailOptions,
): void {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Shell issue={issue} visits={visits} {...(options ? { options } : {})} />
    </MemoryRouter>,
  );
  const nav = screen.getByRole('navigation', { name: 'visits' });
  for (const to of visits)
    fireEvent.click(within(nav).getByRole('link', { name: to }));
}

const trail = () => within(screen.getByRole('banner')).getByRole('navigation');
// Each level is a link but the last, the current page, which the primitives mark as a disabled link.
const levels = () =>
  within(trail())
    .getAllByRole('link')
    .map((item) => item.textContent);
const where = () => screen.getByTestId('where').textContent;
const follow = (name: string) => {
  fireEvent.click(within(trail()).getByRole('link', { name }));
};

describe('IssueTrail', () => {
  it('leads an issue at its own address back to the issues list as it was left', () => {
    renderTrail({ identifier: 'PM-2', parent: null }, [
      '/issues?view=list&q=board',
      '/inbox',
      '/issues/i2',
    ]);
    expect(levels()).toEqual(['nav.issues', 'PM-2']);
    follow('nav.issues');
    expect(where()).toBe('/issues?view=list&q=board');
  });

  it('falls back to the plain issues list before it was seen', () => {
    renderTrail({ identifier: 'PM-3', parent: PARENT }, ['/issues/i3']);
    expect(levels()).toEqual(['nav.issues', 'PM-1', 'PM-3']);
    follow('nav.issues');
    expect(where()).toBe('/issues');
  });

  it('leads an issue opened from My issues back to the tab, and its parent over the same tab', () => {
    renderTrail({ identifier: 'PM-2', parent: PARENT }, [
      '/my-issues/owned/i2?q=board',
    ]);
    expect(levels()).toEqual(['My issues', 'PM-1', 'PM-2']);
    follow('PM-1');
    expect(where()).toBe('/my-issues/owned/i1?q=board');
    follow('My issues');
    expect(where()).toBe('/my-issues/owned?q=board');
  });

  it("leads an issue opened from a project's Issues tab through the project", () => {
    renderTrail({ identifier: 'PM-2', parent: null }, [
      '/projects/p1/issues/i2?status=open',
    ]);
    expect(levels()).toEqual(['Projects', 'Studio', 'PM-2']);
    follow('Studio');
    expect(where()).toBe('/projects/p1/issues?status=open');
  });

  it('leads the identifier to the issue, not the list, under a page beneath it', () => {
    renderTrail({ identifier: 'PM-2', parent: null }, ['/issues/i2'], {
      current: 'Plan',
      issueTo: '/issues/i2?tab=activity',
    });
    expect(levels()).toEqual(['nav.issues', 'PM-2', 'Plan']);
    follow('PM-2');
    expect(where()).toBe('/issues/i2?tab=activity');
  });

  it('leads the identifier to the issue over the same list under a page beneath it by default', () => {
    renderTrail({ identifier: 'PM-2', parent: null }, ['/my-issues/owned/i2'], {
      current: 'Plan',
    });
    expect(levels()).toEqual(['My issues', 'PM-2', 'Plan']);
    follow('PM-2');
    expect(where()).toBe('/my-issues/owned/PM-2');
  });
});
