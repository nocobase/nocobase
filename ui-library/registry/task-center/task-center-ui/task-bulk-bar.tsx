import { useTranslation } from '@nocobase/i18n/client';
import { X } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#components/ui/alert-dialog';
import { Button } from '#components/ui/button';
import { Spinner } from '#components/ui/spinner';
import { cn } from 'cn';

import type { TaskBulkActionView } from './types.js';

export interface TaskBulkBarProps {
  /** Checked tasks; the bar shows while it is more than 0. */
  readonly count: number;
  /** The batch actions the selected type contributes. */
  readonly actions: readonly TaskBulkActionView[];
  readonly onRun: (key: string) => void;
  readonly onClear: () => void;
  /** The row the bar takes the place of while tasks are checked, usually `TaskStatusTabs`. */
  readonly children?: ReactNode;
}

/**
 * The top of the list: normally its children, usually the status tabs, on the page's own background, and while tasks
 * are checked an opaque toolbar in their place, kept in view while the list scrolls — how many, a button that clears them, and one button per contributed action
 * with the count it applies to. Taking the row's place rather than adding one keeps the cards from moving under the
 * pointer when the first task is checked.
 */
export function TaskBulkBar({
  actions,
  children,
  count,
  onClear,
  onRun,
}: TaskBulkBarProps): ReactElement {
  const { t } = useTranslation();
  const clear = t('taskCenterUi.bulk.clear', {
    defaultValue: 'Clear selection',
  });
  return (
    <div className={cn('relative', count > 0 && 'sticky top-0 z-10')}>
      <div
        inert={count > 0}
        aria-hidden={count > 0 || undefined}
        className={cn(count > 0 && 'invisible')}
      >
        {children}
      </div>
      {count > 0 ? (
        <div
          role='toolbar'
          aria-label={t('taskCenterUi.bulk.label', {
            defaultValue: 'Batch actions',
          })}
          className='absolute inset-0 flex items-center gap-2 overflow-x-auto border-b border-primary/40 bg-background bg-linear-to-r from-primary/5 to-primary/5 px-2'
        >
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={clear}
            title={clear}
            onClick={onClear}
          >
            <X />
          </Button>
          <span className='shrink-0 text-sm font-medium tabular-nums'>
            {t('taskCenterUi.bulk.selected', {
              count,
              defaultValue: '{{count}} selected',
            })}
          </span>
          <div className='ml-auto flex shrink-0 items-center gap-2'>
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.key}
                  size='sm'
                  variant={action.primary ? 'default' : 'outline'}
                  disabled={!action.count}
                  onClick={() => onRun(action.key)}
                >
                  {Icon ? <Icon aria-hidden data-icon='inline-start' /> : null}
                  {action.label}
                </Button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export interface TaskBulkConfirmProps {
  readonly open: boolean;
  /** Translated, such as "Approve 3 requests?". */
  readonly title: string;
  /** What the action will do to each task. */
  readonly description?: string;
  /** Checked tasks the action does not apply to and leaves as they are. */
  readonly skipped?: number;
  /** The tasks the action will run on. */
  readonly tasks: readonly { readonly id: string; readonly title: string }[];
  /** The confirming button's label, usually the action's. */
  readonly confirmLabel: string;
  /** While the action runs: a spinner, and the dialog stays open. */
  readonly running?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

/** Confirms a batch action, listing every task it will run on. */
export function TaskBulkConfirm({
  confirmLabel,
  description,
  onCancel,
  onConfirm,
  open,
  running = false,
  skipped = 0,
  tasks,
  title,
}: TaskBulkConfirmProps): ReactElement {
  const { t } = useTranslation();
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !running) onCancel();
      }}
    >
      <AlertDialogContent className='max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden'>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
            {skipped
              ? ` ${t('taskCenterUi.bulk.skipped', {
                  count: skipped,
                  defaultValue:
                    '{{count}} other selected tasks do not support it and stay as they are.',
                })}`
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ul className='flex min-h-0 flex-col divide-y overflow-y-auto rounded-lg border text-sm'>
          {tasks.map((task) => (
            <li key={task.id} className='truncate px-3 py-2' title={task.title}>
              {task.title}
            </li>
          ))}
        </ul>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={running}>
            {t('taskCenterUi.bulk.cancel', { defaultValue: 'Cancel' })}
          </AlertDialogCancel>
          <Button disabled={running} onClick={onConfirm}>
            {running ? <Spinner data-icon='inline-start' /> : null}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
