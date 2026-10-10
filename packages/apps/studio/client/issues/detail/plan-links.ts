/**
 * Where a plan opens from an issue page: over that page, at `<issue page>/plans/:planId` with the issue's search kept
 * (`pages/issues/plan`), so the plan's trail and the browser's Back return to exactly the issue it was opened from,
 * whichever list the issue is opened over (`issue-parent.tsx`). Elsewhere a plan opens at its own page,
 * `/issues/plans/:planId`.
 */
import { planHref } from '@nocobase/app-plugin-projects/client/plan-model';
import { useLocation, useParams, type Path } from 'react-router';

import { issueUnder, useIssueParent } from './issue-parent.js';

type Place = Pick<Path, 'pathname' | 'search'>;

/** The plan `planId` over the issue page at `issuePath`, with that page's `search`. */
export function issuePlanLocation(
  issuePath: string,
  planId: string,
  search = '',
): Place {
  return {
    pathname: `${issuePath}/plans/${encodeURIComponent(planId)}`,
    search,
  };
}

/** The issue page a plan over it returns to: its location without `/plans/:planId`; null for a plan's own page. */
export function issueBeneathPlan(location: Place): Place | null {
  const match = /^(\/.+)\/plans\/[^/]+\/?$/u.exec(location.pathname);
  return match?.[1] && match[1] !== '/issues'
    ? { pathname: match[1], search: location.search }
    : null;
}

/** Where a plan link on the current page goes: over the issue page it is on, or the plan's own page. */
export function usePlanLinkTo(): (planId: string) => Place | string {
  const { issueId } = useParams();
  const { search } = useLocation();
  const parent = useIssueParent();
  return (planId) =>
    issueId
      ? issuePlanLocation(issueUnder(parent, issueId).pathname, planId, search)
      : planHref(planId);
}
