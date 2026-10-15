/** An issue status as a dot or a badge, in the colour the issue lists give it. */
import type { ReactElement } from 'react';

import { IssueStatusBadge } from '@/components/issue-table';
import { cn } from 'cn';

import { StatusIcon } from '@/components/status-icon';

import { statusColor, useFollowUpStatusName } from './status-colors.js';

export function StatusDot({
  statusKey,
  className,
}: {
  readonly statusKey: string;
  readonly className?: string;
}): ReactElement {
  return (
    <StatusIcon statusKey={statusKey} className={cn('size-3.5', className)} />
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
      status={{
        name: statusName(statusKey),
        color: statusColor(statusKey),
        key: statusKey,
      }}
    />
  );
}
