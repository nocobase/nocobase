/**
 * The issues a plan is about (`planIssues`) as a labelled line of links under the card's title, the one it was opened
 * from first. An issue a rehearsal or the execution named carries its key and title; one named only by its id or key is
 * read from the cached issue (`usePlanIssue`) and left out while unknown or not visible to the viewer.
 */
import { usePlanIssue } from '@nocobase/app-plugin-projects/client/kit';
import type { Plan } from '@nocobase/app-plugin-projects/shared/plans';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

import {
  defaultPlanIssueHref,
  planIssues,
  type PlanIssueHref,
  type PlanIssueRef,
} from './plan-issues.js';

function PlanIssueLink({
  issue,
  href,
}: {
  readonly issue: PlanIssueRef;
  readonly href: PlanIssueHref;
}): ReactElement | null {
  const read = usePlanIssue(issue.identifier ? null : issue.id).data;
  const identifier = issue.identifier ?? read?.identifier;
  if (!identifier) return null;
  const title = issue.title ?? read?.title;
  return (
    <li className='min-w-0 max-w-full'>
      <Link
        to={href({ id: read?.id ?? issue.id, identifier })}
        className='inline-flex max-w-full items-center gap-1.5 hover:underline'
      >
        <span className='shrink-0 font-mono text-muted-foreground'>
          {identifier}
        </span>{' '}
        {title ? <span className='truncate'>{title}</span> : null}
      </Link>
    </li>
  );
}

/** The plan's issues as a labelled line of links; nothing while it names none the viewer can see. */
export function PlanIssueLinks({
  plan,
  firstIssueId = null,
  href = defaultPlanIssueHref,
  label,
}: {
  readonly plan: Plan;
  readonly firstIssueId?: string | null;
  readonly href?: PlanIssueHref;
  /** Such as "Issues". */
  readonly label: string;
}): ReactElement | null {
  const issues = planIssues(plan, firstIssueId);
  if (issues.length === 0) return null;
  return (
    <div
      className='hidden min-w-0 items-baseline gap-2 text-xs has-[li]:flex'
      data-slot='plan-issues'
    >
      <span className='shrink-0 text-muted-foreground'>{label}</span>
      <ul
        aria-label={label}
        className='flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1'
      >
        {issues.map((issue) => (
          <PlanIssueLink key={issue.id} issue={issue} href={href} />
        ))}
      </ul>
    </div>
  );
}
