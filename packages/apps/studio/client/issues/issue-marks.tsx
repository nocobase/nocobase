/**
 * Studio's marks on an issue, after its title in a list row, under the labels on a board card and in the issue page's
 * meta line: its pull requests in one badge, then where it is deployed. Each reads its own data; nothing renders when
 * neither has anything to say.
 */
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import type { ReactElement } from 'react';

import { cn } from 'cn';

import { DeployMarkTags, type IssueMarkPlacement } from '../deploys/marks.js';
import { PullRequestMarkBadge } from '../git/pull-requests.js';

export function IssueMarks({
  issue,
  placement,
  className,
}: {
  readonly issue: Pick<Issue, 'id' | 'revision'>;
  readonly placement: IssueMarkPlacement;
  readonly className?: string;
}): ReactElement {
  return (
    <span
      data-issue-marks={placement}
      className={cn(
        'inline-flex min-w-0 flex-wrap items-center gap-1 empty:hidden',
        className,
      )}
    >
      <PullRequestMarkBadge issue={issue} />
      <DeployMarkTags issue={issue} placement={placement} />
    </span>
  );
}
