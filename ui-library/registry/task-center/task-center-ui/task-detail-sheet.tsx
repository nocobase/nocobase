import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement, ReactNode } from 'react';

import { cn } from 'cn';

import { Badge } from '#components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#components/ui/sheet';

import type { TaskCardData } from './types.js';
import { useTaskTime } from './use-task-time.js';

export interface TaskDetailSheetProps {
  /** The task to show; the drawer is open while it is set. */
  readonly task?: TaskCardData;
  readonly onClose: () => void;
  /**
   * What the task's type contributes: its detail and form in a `TaskDetailBody`, and its actions in a
   * `TaskDetailFooter`, from one component so that the actions can read the form.
   */
  readonly children?: ReactNode;
  /** Keeps the drawer open, such as while an action submits. */
  readonly busy?: boolean;
  readonly now?: Date;
}

/**
 * A right-side drawer for one task: its title, status, subject and time in a fixed header, then whatever its type
 * contributes — the business detail and the form for handling it in a `TaskDetailBody` that scrolls, and the type's
 * actions in a fixed `TaskDetailFooter`. The drawer knows nothing about the business; the page picks the content by
 * the task's source and subject.
 */
export function TaskDetailSheet({
  busy = false,
  children,
  now,
  onClose,
  task,
}: TaskDetailSheetProps): ReactElement {
  const { t } = useTranslation();
  const time = useTaskTime(now);
  const when = task ? time(task.time) : undefined;
  return (
    <Sheet
      open={Boolean(task)}
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <SheetContent
        side='right'
        className='w-full gap-0 data-[side=right]:sm:max-w-lg'
      >
        {task ? (
          <>
            <SheetHeader className='gap-2 border-b pr-12'>
              <div className='flex items-start gap-3'>
                <SheetTitle className='min-w-0 flex-1 text-base'>
                  {task.title}
                </SheetTitle>
                <Badge
                  variant={
                    task.statusVariant ??
                    (task.status === 'pending' ? 'secondary' : 'outline')
                  }
                  className='shrink-0'
                >
                  {task.statusLabel}
                </Badge>
              </div>
              <SheetDescription>
                {[
                  task.subjectLabel,
                  task.status === 'pending'
                    ? t('taskCenterUi.time.received', {
                        time: when?.absolute,
                        defaultValue: 'Arrived {{time}}',
                      })
                    : t('taskCenterUi.time.closed', {
                        time: when?.absolute,
                        defaultValue: 'Closed {{time}}',
                      }),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </SheetDescription>
            </SheetHeader>
            {children}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export interface TaskDetailSectionProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

/** The scrolling part of the drawer, for the detail and the form. */
export function TaskDetailBody({
  children,
  className,
}: TaskDetailSectionProps): ReactElement {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The drawer's fixed actions; put the primary one last. */
export function TaskDetailFooter({
  children,
  className,
}: TaskDetailSectionProps): ReactElement {
  return (
    <SheetFooter
      className={cn('border-t sm:flex-row sm:justify-end', className)}
    >
      {children}
    </SheetFooter>
  );
}
