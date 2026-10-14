/** An issue status as a dot or a badge, in the colour the issue lists give it. */
import type { ReactElement } from 'react';

import { IssueStatusBadge } from '@/components/issue-table';
import { cn } from 'cn';

import {
  STATUS_DOT,
  statusColor,
  useFollowUpStatusName,
} from './status-colors.js';

export function StatusDot({
  statusKey,
  className,
}: {
  readonly statusKey: string;
  readonly className?: string;
}): ReactElement {
  return (
    <span
      aria-hidden
      className={cn(
        'size-2 shrink-0 rounded-full',
        STATUS_DOT[statusColor(statusKey)],
        className,
      )}
    />
  );
}

export function StatusPill({
  statusKey,
}: {
  readonly statusKey: string;
}): ReactElement {
  const statusName = useFollowUpStatusName();
  return (
    <IssueStatusBadge
      status={{ name: statusName(statusKey), color: statusColor(statusKey) }}
    />
  );
}
