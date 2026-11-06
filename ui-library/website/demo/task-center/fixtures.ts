import {
  CalendarDays,
  ClipboardCheck,
  FilePen,
  ListTodo,
  MailOpen,
  ReceiptText,
  SendHorizontal,
  ShoppingCart,
} from 'lucide-react';

import type {
  TaskCenterIcon,
  TaskCenterStatus,
} from '#extensions/nocobase-task-center-ui/index';

/**
 * A person's task index as an application would read it from `/api/userTasks`, plus the business details each task
 * type would load for its summary. Times count from a fixed instant so that day groups stay stable.
 */

export const NOW: Date = new Date('2026-10-21T11:30:00+08:00');

export interface DemoSource {
  readonly key: string;
  readonly label: string;
  readonly icon: TaskCenterIcon;
  readonly statusLabels: Readonly<Record<TaskCenterStatus, string>>;
}

export const SOURCES: readonly DemoSource[] = [
  {
    key: 'approval.task',
    label: 'Waiting for my approval',
    icon: ClipboardCheck,
    statusLabels: {
      pending: 'To approve',
      completed: 'Handled',
      cancelled: 'Cancelled',
    },
  },
  {
    key: 'approval.mine',
    label: 'My requests',
    icon: SendHorizontal,
    statusLabels: {
      pending: 'In review',
      completed: 'Finished',
      cancelled: 'Withdrawn',
    },
  },
  {
    key: 'approval.cc',
    label: 'Copied to me',
    icon: MailOpen,
    statusLabels: { pending: 'Unread', completed: 'Read', cancelled: 'Read' },
  },
  {
    key: 'work.item',
    label: 'Work items',
    icon: ListTodo,
    statusLabels: {
      pending: 'Open',
      completed: 'Done',
      cancelled: 'Cancelled',
    },
  },
];

export const SUBJECTS: Readonly<
  Record<string, { readonly label: string; readonly icon: TaskCenterIcon }>
> = {
  leave: { label: 'Leave', icon: CalendarDays },
  expense: { label: 'Expense claim', icon: ReceiptText },
  purchase: { label: 'Purchase', icon: ShoppingCart },
  contract: { label: 'Contract', icon: FilePen },
  workItem: { label: 'Work item', icon: ListTodo },
};

export interface DemoTask {
  readonly id: string;
  readonly source: string;
  readonly subject: string;
  readonly status: TaskCenterStatus;
  readonly title: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly details?: Readonly<Record<string, string | number>>;
}

let sequence = 0;
function task(
  source: string,
  subject: string,
  status: TaskCenterStatus,
  title: string,
  createdAt: string,
  details?: DemoTask['details'],
): DemoTask {
  sequence += 1;
  const created = new Date(createdAt);
  const updated =
    status === 'pending'
      ? created
      : new Date(created.getTime() + (sequence % 5) * 3_600_000 + 1_800_000);
  return {
    id: `task-${sequence}`,
    source,
    subject,
    status,
    title,
    createdAt: created.toISOString(),
    updatedAt: updated.toISOString(),
    ...(details ? { details } : {}),
  };
}

const leave = (type: string, from: string, to: string, days: number) => ({
  type,
  from,
  to,
  days,
});
const expense = (amount: number, category: string, reason: string) => ({
  amount,
  category,
  reason,
});
const purchase = (item: string, quantity: number, budget: number) => ({
  item,
  quantity,
  budget,
});

export const TASKS: readonly DemoTask[] = [
  task(
    'approval.task',
    'leave',
    'pending',
    'Annual leave for Li Na',
    '2026-10-21T09:12:00+08:00',
    leave('Annual', '2026-10-27', '2026-10-29', 3),
  ),
  task(
    'approval.task',
    'expense',
    'pending',
    'Travel expenses of Ming Chen (client visit)',
    '2026-10-21T08:40:00+08:00',
    expense(
      4280.5,
      'Travel',
      'Round trip and hotel for the Shanghai client visit',
    ),
  ),
  task(
    'approval.task',
    'purchase',
    'pending',
    'R&D purchase: test servers',
    '2026-10-20T17:05:00+08:00',
    purchase('Rack test server', 2, 56000),
  ),
  task(
    'approval.task',
    'leave',
    'pending',
    'Sick leave for Wang Wei',
    '2026-10-20T15:22:00+08:00',
    leave('Sick', '2026-10-21', '2026-10-21', 1),
  ),
  task(
    'approval.task',
    'contract',
    'pending',
    'Annual logistics service contract, East region',
    '2026-10-20T11:48:00+08:00',
  ),
  task(
    'approval.task',
    'expense',
    'pending',
    'Office supplies of Chen Jie',
    '2026-10-19T16:30:00+08:00',
    expense(368, 'Office supplies', 'Quarterly supplies for the team'),
  ),
  task(
    'approval.task',
    'leave',
    'completed',
    'Time off in lieu for Zhao Lei',
    '2026-10-18T10:15:00+08:00',
    leave('Time off in lieu', '2026-10-20', '2026-10-20', 0.5),
  ),
  task(
    'approval.task',
    'expense',
    'completed',
    'Client dinner of Zhou Xin',
    '2026-10-17T14:02:00+08:00',
    expense(1560, 'Entertainment', 'Quarterly review dinner with a partner'),
  ),
  task(
    'approval.task',
    'purchase',
    'cancelled',
    'Marketing purchase: trade show materials',
    '2026-10-16T09:45:00+08:00',
    purchase('Booth build and prints', 1, 18000),
  ),
  task(
    'approval.mine',
    'leave',
    'pending',
    'My annual leave after the holiday',
    '2026-10-20T10:00:00+08:00',
    leave('Annual', '2026-11-03', '2026-11-05', 3),
  ),
  task(
    'approval.mine',
    'expense',
    'pending',
    'My travel expenses (Beijing training)',
    '2026-10-19T18:20:00+08:00',
    expense(2365, 'Travel', 'Train and hotel for the product training'),
  ),
  task(
    'approval.mine',
    'purchase',
    'completed',
    'My purchase: monitor',
    '2026-10-12T09:30:00+08:00',
    purchase('27-inch monitor', 1, 2199),
  ),
  task(
    'approval.cc',
    'contract',
    'pending',
    'Copy: annual software license contract',
    '2026-10-21T07:55:00+08:00',
  ),
  task(
    'approval.cc',
    'expense',
    'pending',
    'Copy: sales team building expenses',
    '2026-10-20T19:10:00+08:00',
    expense(6400, 'Team building', 'Sales team event for the third quarter'),
  ),
  task(
    'approval.cc',
    'leave',
    'completed',
    'Copy: wedding leave for Liu Yang',
    '2026-10-14T11:00:00+08:00',
    leave('Wedding', '2026-10-24', '2026-11-04', 10),
  ),
  task(
    'work.item',
    'workItem',
    'pending',
    'Summarize the Q4 department budget',
    '2026-10-21T10:05:00+08:00',
  ),
  task(
    'work.item',
    'workItem',
    'pending',
    'Confirm equipment for new hires',
    '2026-10-20T14:40:00+08:00',
  ),
  task(
    'work.item',
    'workItem',
    'completed',
    'Explain last month’s attendance exceptions',
    '2026-10-11T09:00:00+08:00',
  ),
];
