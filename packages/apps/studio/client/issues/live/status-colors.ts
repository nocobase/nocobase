/** An issue status’s colour and name, as the issue lists give them (`status.tsx` draws them). */
import {
  statusTone,
  useStatusName,
} from '@nocobase/app-plugin-projects/client/issues';
import { FIXED_STATUSES } from '@nocobase/app-plugin-projects/shared/statuses';

import type { IssueTableColor } from '@/components/issue-table';

import { toneColor } from '../rows.js';

export function statusColor(statusKey: string): IssueTableColor {
  return toneColor(statusTone(FIXED_STATUSES, statusKey));
}

/** The ink alone, for a dot. */
export const STATUS_DOT: Readonly<Record<IssueTableColor, string>> = {
  gray: 'bg-muted-foreground/60',
  red: 'bg-red-500 dark:bg-red-400',
  orange: 'bg-orange-500 dark:bg-orange-400',
  yellow: 'bg-amber-500 dark:bg-amber-400',
  green: 'bg-emerald-500 dark:bg-emerald-400',
  blue: 'bg-blue-500 dark:bg-blue-400',
  purple: 'bg-violet-500 dark:bg-violet-400',
};

/** A selected filter chip: a tint behind a darker ink of the status's colour. */
export const STATUS_CHIP: Readonly<Record<IssueTableColor, string>> = {
  gray: 'border-muted-foreground/40 bg-muted text-foreground',
  red: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
  orange:
    'border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300',
  yellow:
    'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  green:
    'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  blue: 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  purple:
    'border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300',
};

/** The name of a status in the interface language. */
export function useFollowUpStatusName(): (statusKey: string) => string {
  const statusName = useStatusName();
  return (statusKey) => statusName(FIXED_STATUSES, statusKey);
}
