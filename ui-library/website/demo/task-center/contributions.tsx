import {
  createElement,
  useState,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';

import { Button } from '#components/ui/button';
import { Spinner } from '#components/ui/spinner';
import { Textarea } from '#components/ui/textarea';
import {
  TaskDetailBody,
  TaskDetailFooter,
  TaskSummaryFields,
  type TaskCenterStatus,
} from '#extensions/nocobase-task-center-ui/index';

import type { DemoTask } from './fixtures.js';

/**
 * What each task type contributes, keyed by source and subject. In an application every business module registers its
 * own entries; the page only looks them up.
 */

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'CNY',
});

function details(task: DemoTask): Readonly<Record<string, string | number>> {
  return task.details ?? {};
}

function period(from: unknown, to: unknown): string {
  return from === to ? String(from) : `${String(from)} – ${String(to)}`;
}

/** Summary fields per subject; contracts and work items contribute none, so their cards have no summary. */
const summaryFields: Readonly<
  Record<string, (task: DemoTask) => readonly (readonly [string, ReactNode])[]>
> = {
  leave: (task) => {
    const value = details(task);
    return [
      ['Type', value.type],
      ['Period', period(value.from, value.to)],
      ['Duration', `${value.days} days`],
    ];
  },
  expense: (task) => {
    const value = details(task);
    return [
      ['Amount', money.format(Number(value.amount))],
      ['Category', value.category],
      ['Reason', value.reason],
    ];
  },
  purchase: (task) => {
    const value = details(task);
    return [
      ['Item', value.item],
      ['Quantity', value.quantity],
      ['Budget', money.format(Number(value.budget))],
    ];
  },
};

/** The summary the task's subject contributes, or nothing. */
export function TaskSummary({
  task,
}: {
  readonly task: DemoTask;
}): ReactElement | null {
  const fields = task.details ? summaryFields[task.subject] : undefined;
  return fields ? <TaskSummaryFields items={fields(task)} /> : null;
}

export interface DemoDetailProps {
  readonly task: DemoTask;
  /** Reports the outcome; the page updates the index and closes the drawer. */
  readonly onDone: (message: string, status?: TaskCenterStatus) => void;
  readonly onBusyChange: (busy: boolean) => void;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function DetailFields({ task }: { readonly task: DemoTask }): ReactElement {
  const fields = summaryFields[task.subject]?.(task);
  return fields ? (
    <TaskSummaryFields items={fields} className='mt-0' />
  ) : (
    <p className='text-sm text-muted-foreground'>
      The business page shows this task&apos;s full record here.
    </p>
  );
}

/** Approve or reject, with a comment that rejecting requires. */
function ApprovalDetail({
  onBusyChange,
  onDone,
  task,
}: DemoDetailProps): ReactElement {
  const [comment, setComment] = useState('');
  const [running, setRunning] = useState<'approve' | 'reject'>();
  const [invalid, setInvalid] = useState(false);
  const open = task.status === 'pending';
  const run = async (kind: 'approve' | 'reject'): Promise<void> => {
    if (kind === 'reject' && !comment.trim()) {
      setInvalid(true);
      return;
    }
    setRunning(kind);
    onBusyChange(true);
    await wait(700);
    onBusyChange(false);
    setRunning(undefined);
    onDone(kind === 'approve' ? 'Approved' : 'Rejected', 'completed');
  };
  return (
    <>
      <TaskDetailBody>
        <DetailFields task={task} />
        {open ? (
          <label className='flex flex-col gap-2 text-sm font-medium'>
            Comment
            <Textarea
              value={comment}
              aria-invalid={invalid}
              placeholder='Required when rejecting'
              onChange={(event) => {
                setComment(event.target.value);
                setInvalid(false);
              }}
            />
            {invalid ? (
              <span className='text-xs font-normal text-destructive'>
                Say why you reject it.
              </span>
            ) : null}
          </label>
        ) : null}
      </TaskDetailBody>
      {open ? (
        <TaskDetailFooter>
          <Button
            variant='outline'
            disabled={Boolean(running)}
            onClick={() => void run('reject')}
          >
            {running === 'reject' ? <Spinner data-icon='inline-start' /> : null}
            Reject
          </Button>
          <Button
            disabled={Boolean(running)}
            onClick={() => void run('approve')}
          >
            {running === 'approve' ? (
              <Spinner data-icon='inline-start' />
            ) : null}
            Approve
          </Button>
        </TaskDetailFooter>
      ) : null}
    </>
  );
}

/** One action that finishes the task, such as withdrawing a request or completing a work item. */
function singleAction(
  label: string,
  done: string,
  status: TaskCenterStatus,
  variant: 'default' | 'outline' = 'default',
): ComponentType<DemoDetailProps> {
  return function SingleActionDetail({
    onBusyChange,
    onDone,
    task,
  }: DemoDetailProps): ReactElement {
    const [running, setRunning] = useState(false);
    return (
      <>
        <TaskDetailBody>
          <DetailFields task={task} />
        </TaskDetailBody>
        {task.status === 'pending' ? (
          <TaskDetailFooter>
            <Button
              variant={variant}
              disabled={running}
              onClick={() => {
                setRunning(true);
                onBusyChange(true);
                void wait(700).then(() => {
                  onBusyChange(false);
                  setRunning(false);
                  onDone(done, status);
                });
              }}
            >
              {running ? <Spinner data-icon='inline-start' /> : null}
              {label}
            </Button>
          </TaskDetailFooter>
        ) : null}
      </>
    );
  };
}

const detailComponents: Readonly<
  Record<string, ComponentType<DemoDetailProps>>
> = {
  'approval.task': ApprovalDetail,
  'approval.mine': singleAction(
    'Withdraw',
    'Withdrawn',
    'cancelled',
    'outline',
  ),
  'approval.cc': singleAction('Mark as read', 'Marked as read', 'completed'),
  'work.item': singleAction('Complete', 'Completed', 'completed'),
};

/** The drawer content the task's source contributes, or nothing. */
export function TaskDetail(props: DemoDetailProps): ReactElement | null {
  const detail = detailComponents[props.task.source];
  return detail ? createElement(detail, props) : null;
}
