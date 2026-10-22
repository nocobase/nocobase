import type { TaskCenterStatusTab } from './types.js';

/** The status tabs in display order. */
export const taskStatusTabs: readonly TaskCenterStatusTab[] = [
  'pending',
  'closed',
  'all',
];

/** Whether a task's status belongs in a tab. */
export function matchesTaskStatusTab(
  status: string,
  tab: TaskCenterStatusTab,
): boolean {
  if (tab === 'all') return true;
  return tab === 'pending' ? status === 'pending' : status !== 'pending';
}
