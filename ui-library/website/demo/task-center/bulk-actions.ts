import { BellRing, Check, MailCheck } from 'lucide-react';

import type {
  TaskCenterIcon,
  TaskCenterStatus,
} from '#extensions/nocobase-task-center-ui/index';

import type { DemoTask } from './fixtures.js';

/** Batch actions each task type contributes, keyed by source and optionally narrowed to some subjects. */
export interface DemoBulkAction {
  readonly key: string;
  readonly source: string;
  /** Leaving it out means every subject of the source. */
  readonly subjects?: readonly string[];
  readonly label: (count: number) => string;
  readonly confirmTitle: (count: number) => string;
  readonly confirmDescription: string;
  readonly icon: TaskCenterIcon;
  readonly primary?: boolean;
  /** The status the tasks move to; leaving it out keeps them as they are. */
  readonly result?: TaskCenterStatus;
}

export const BULK_ACTIONS: readonly DemoBulkAction[] = [
  {
    key: 'approve',
    source: 'approval.task',
    // A contract needs a review of its own, so its type contributes no batch approval.
    subjects: ['leave', 'expense', 'purchase'],
    label: (count) => `Approve (${count})`,
    confirmTitle: (count) => `Approve ${count} requests?`,
    confirmDescription:
      'Each request is approved in your name, without a comment.',
    icon: Check,
    primary: true,
    result: 'completed',
  },
  {
    key: 'remind',
    source: 'approval.mine',
    label: (count) => `Remind (${count})`,
    confirmTitle: (count) => `Remind the approvers of ${count} requests?`,
    confirmDescription: 'The current approvers get a reminder.',
    icon: BellRing,
  },
  {
    key: 'markRead',
    source: 'approval.cc',
    label: (count) => `Mark as read (${count})`,
    confirmTitle: (count) => `Mark ${count} copies as read?`,
    confirmDescription: 'They move to Done.',
    icon: MailCheck,
    primary: true,
    result: 'completed',
  },
];

export function bulkActionApplies(
  action: DemoBulkAction,
  task: DemoTask,
): boolean {
  return (
    task.status === 'pending' &&
    task.source === action.source &&
    (!action.subjects || action.subjects.includes(task.subject))
  );
}
