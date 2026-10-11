/**
 * The list an issue's page is opened over. The issue page is declared under each list that opens it (`/issues`, the
 * tabs of `/my-issues`, a project's Issues tab; `issueDetailRoute` in `routes.ts`), so where it was opened from is
 * its URL: a refresh, the browser's Back and a copied link keep it. The list's page renders `IssueParentOutlet`
 * (`issue-parent-outlet.tsx`) with its own trail and address, and the issue page, the pages under it and its links to
 * other issues build on them; an issue opened at its own address (`/issues/:issueId`, from the inbox, the dashboard, a
 * link) is under the issues list.
 */
import type { PageBreadcrumbLevel } from '@nocobase/app-client';
import { ACCESS_NAMESPACE as PROJECTS_NS } from '@nocobase/app-plugin-projects/shared/access';
import { useTranslation } from '@nocobase/i18n/client';
import { useOutletContext, type Path } from 'react-router';

import { useReturnLocations } from '../../layouts/return-locations.js';

export interface IssueParent {
  /** The list's trail, leading back to it as it was left; the issue's levels follow. */
  readonly levels: readonly PageBreadcrumbLevel[];
  /** The list's address: an issue opened over it is at `<path>/<issue>`. */
  readonly path: string;
  /** The list's query string, which an issue opened over it keeps so the way back restores the list. */
  readonly search: string;
}

/** What the list page's outlet carries to the issue opened over it (`IssueParentOutlet`). */
export interface IssueParentContext {
  readonly issueParent: IssueParent;
}

function isIssueParentContext(value: unknown): value is IssueParentContext {
  return typeof value === 'object' && value !== null && 'issueParent' in value;
}

/** The list the current issue page is opened over; the issues list as last seen when no list declared itself. */
export function useIssueParent(): IssueParent {
  const context: unknown = useOutletContext();
  const { t } = useTranslation(PROJECTS_NS);
  const { issuesList } = useReturnLocations();
  if (isIssueParentContext(context)) return context.issueParent;
  return {
    levels: [{ label: t('nav.issues'), to: issuesList }],
    path: '/issues',
    search: issuesList.search,
  };
}

/** The issue `issueId` (an id or an identifier) over the same list. */
export function issueUnder(
  parent: IssueParent,
  issueId: string,
): Pick<Path, 'pathname' | 'search'> {
  return {
    pathname: `${parent.path}/${encodeURIComponent(issueId)}`,
    search: parent.search,
  };
}

/** `issueUnder` as one string, for the components that take an `href`. */
export function issueHrefUnder(parent: IssueParent, issueId: string): string {
  const { pathname, search } = issueUnder(parent, issueId);
  return pathname + search;
}
