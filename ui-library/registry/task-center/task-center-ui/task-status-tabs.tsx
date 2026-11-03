import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { Tabs, TabsList, TabsTrigger } from '#components/ui/tabs';
import { cn } from 'cn';

import { taskStatusTabs } from './status.js';
import type { TaskCenterStatusTab } from './types.js';

export interface TaskStatusTabsProps {
  readonly value: TaskCenterStatusTab;
  readonly onValueChange: (value: TaskCenterStatusTab) => void;
  /** Tasks in each tab within the selected source and subject. */
  readonly counts?: Partial<Record<TaskCenterStatusTab, number>>;
  /** Replaces the tab names. */
  readonly labels?: Partial<Record<TaskCenterStatusTab, string>>;
  readonly className?: string;
}

/**
 * The third layer: To do, Done and All, over a full-width divider. The tabs keep their own width from the small
 * breakpoint up and share the full width on a phone.
 */
export function TaskStatusTabs({
  className,
  counts,
  labels,
  onValueChange,
  value,
}: TaskStatusTabsProps): ReactElement {
  const { t } = useTranslation();
  const names: Record<TaskCenterStatusTab, string> = {
    pending: t('taskCenterUi.tabs.pending', { defaultValue: 'To do' }),
    closed: t('taskCenterUi.tabs.closed', { defaultValue: 'Done' }),
    all: t('taskCenterUi.tabs.all', { defaultValue: 'All' }),
  };
  return (
    <div className={cn('border-b', className)}>
      <Tabs
        value={value}
        onValueChange={(next) => onValueChange(next as TaskCenterStatusTab)}
      >
        <TabsList variant='line' className='h-10 w-full sm:w-fit'>
          {taskStatusTabs.map((tab) => {
            const count = counts?.[tab];
            return (
              <TabsTrigger key={tab} value={tab} className='px-3'>
                {labels?.[tab] ?? names[tab]}
                {count === undefined ? null : (
                  <span
                    className={cn(
                      'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs leading-5 font-medium tabular-nums',
                      tab === 'pending' && value === 'pending' && count
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}
