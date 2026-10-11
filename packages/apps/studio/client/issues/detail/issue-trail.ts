/**
 * An issue's trail in the header: the trail of the list it is opened over (`issue-parent.tsx`) — `Issues`, `My issues`
 * or `Projects › <project>`, each leading back to the list as it was left — then `[<parent>] › <identifier>`, the
 * parent over the same list. A page under the issue, such as a plan opened from it, adds itself as `current`, and the
 * identifier then links to the issue (`issueTo`), not the list.
 */
import {
  usePageBreadcrumb,
  type PageBreadcrumbLevel,
} from '@nocobase/app-client';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import type { To } from 'react-router';

import {
  issueUnder,
  useIssueParent,
  type IssueParent,
} from './issue-parent.js';

export type IssueTrailIssue = Pick<IssueDetail, 'identifier' | 'parent'>;

export interface IssueTrailOptions {
  /** A page under the issue, the last level. */
  readonly current?: string;
  /** Where the identifier leads under `current`; the issue's page by default. */
  readonly issueTo?: To;
}

export function issueTrailLevels(
  issue: IssueTrailIssue,
  parent: IssueParent,
  { current, issueTo }: IssueTrailOptions = {},
): PageBreadcrumbLevel[] {
  const levels: PageBreadcrumbLevel[] = [...parent.levels];
  if (issue.parent)
    levels.push({
      label: issue.parent.identifier,
      to: issueUnder(parent, issue.parent.id),
    });
  if (current === undefined) levels.push({ label: issue.identifier });
  else
    levels.push(
      {
        label: issue.identifier,
        to: issueTo ?? issueUnder(parent, issue.identifier),
      },
      { label: current },
    );
  return levels;
}

/** Puts the issue's trail in the header; nothing until the issue has loaded. */
export function useIssueTrail(
  issue: IssueTrailIssue | undefined,
  options: IssueTrailOptions = {},
): void {
  const parent = useIssueParent();
  usePageBreadcrumb(
    issue ? issueTrailLevels(issue, parent, options) : undefined,
  );
}
