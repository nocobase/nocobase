/** An issue status as a badge, in its workflow's name and colour. */
import {
  statusTone,
  useStatusName,
} from '@nocobase/app-plugin-projects/client/issues';
import type { StatusDefinition } from '@nocobase/app-plugin-projects/shared/issues';
import type { ReactElement } from 'react';

import { IssueStatusBadge } from '@/components/issue-table';

import { toneColor } from '../rows.js';

export function StatusBadge({
  statusKey,
  statuses,
}: {
  readonly statusKey: string;
  readonly statuses: readonly StatusDefinition[];
}): ReactElement {
  const statusName = useStatusName();
  return (
    <IssueStatusBadge
      status={{
        name: statusName(statuses, statusKey),
        color: toneColor(statusTone(statuses, statusKey)),
      }}
    />
  );
}
