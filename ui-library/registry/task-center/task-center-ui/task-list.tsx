import { useTranslation } from '@nocobase/i18n/client';
import { ChevronLeft, ChevronRight, CircleCheckBig, Inbox } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Button } from '#components/ui/button';
import { Card } from '#components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#components/ui/empty';
import { Skeleton } from '#components/ui/skeleton';

import { TaskCard } from './task-card.js';
import type {
  TaskCardData,
  TaskCenterStatusTab,
  TaskListSelection,
} from './types.js';

const DAY = 86_400_000;
type DayGroup = 'today' | 'yesterday' | 'earlier';

export interface TaskListProps {
  /** Tasks in display order, newest first. */
  readonly tasks: readonly TaskCardData[];
  readonly showSubject?: boolean;
  readonly selection?: TaskListSelection;
  readonly onOpen?: (task: TaskCardData) => void;
  /** Groups the cards under Today, Yesterday and Earlier. Defaults to true. */
  readonly groupByDay?: boolean;
  /** The instant days and relative times count from. Defaults to the current time. */
  readonly now?: Date;
}

/** Task cards grouped by the day of their time. */
export function TaskList({
  groupByDay = true,
  now,
  onOpen,
  selection,
  showSubject,
  tasks,
}: TaskListProps): ReactElement {
  const { t } = useTranslation();
  const [mounted] = useState(() => new Date());
  const reference = now ?? mounted;
  const names: Record<DayGroup, string> = {
    today: t('taskCenterUi.groups.today', { defaultValue: 'Today' }),
    yesterday: t('taskCenterUi.groups.yesterday', {
      defaultValue: 'Yesterday',
    }),
    earlier: t('taskCenterUi.groups.earlier', { defaultValue: 'Earlier' }),
  };
  const cards = (items: readonly TaskCardData[]): ReactElement => (
    <ul className='flex flex-col gap-3'>
      {items.map((task) => (
        <li key={task.id}>
          <TaskCard
            task={task}
            now={reference}
            showSubject={showSubject}
            selection={selection}
            onOpen={onOpen}
          />
        </li>
      ))}
    </ul>
  );
  if (!groupByDay) return cards(tasks);

  const groups = new Map<DayGroup, TaskCardData[]>();
  for (const task of tasks) {
    const key = dayGroupOf(task.time, reference);
    groups.set(key, [...(groups.get(key) ?? []), task]);
  }
  return (
    <div className='flex flex-col gap-6'>
      {[...groups].map(([key, group]) => (
        <section
          key={key}
          aria-label={names[key]}
          className='flex flex-col gap-3'
        >
          <h3 className='text-xs font-medium text-muted-foreground'>
            {names[key]}
          </h3>
          {cards(group)}
        </section>
      ))}
    </div>
  );
}

function dayGroupOf(time: string, now: Date): DayGroup {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const value = new Date(time).getTime();
  if (value >= start.getTime()) return 'today';
  if (value >= start.getTime() - DAY) return 'yesterday';
  return 'earlier';
}

export interface TaskListEmptyProps {
  /** The tab that came back empty; it picks the wording and the icon. */
  readonly status: TaskCenterStatusTab;
  /** Offers to show every status; leave it out on the All tab. */
  readonly onShowAll?: () => void;
  readonly title?: string;
  readonly description?: string;
}

/** An empty tab: "all done" for To do, and a neutral message for the others. */
export function TaskListEmpty({
  description,
  onShowAll,
  status,
  title,
}: TaskListEmptyProps): ReactElement {
  const { t } = useTranslation();
  const Icon = status === 'pending' ? CircleCheckBig : Inbox;
  const wording: Record<TaskCenterStatusTab, [string, string]> = {
    pending: [
      t('taskCenterUi.empty.pending.title', { defaultValue: 'All caught up' }),
      t('taskCenterUi.empty.pending.description', {
        defaultValue: 'Nothing here is waiting for you.',
      }),
    ],
    closed: [
      t('taskCenterUi.empty.closed.title', {
        defaultValue: 'Nothing done yet',
      }),
      t('taskCenterUi.empty.closed.description', {
        defaultValue: 'Tasks you finish or that are cancelled appear here.',
      }),
    ],
    all: [
      t('taskCenterUi.empty.all.title', { defaultValue: 'No tasks' }),
      t('taskCenterUi.empty.all.description', {
        defaultValue: 'Tasks of this type appear here when they reach you.',
      }),
    ],
  };
  return (
    <Empty className='min-h-64 border border-dashed'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title ?? wording[status][0]}</EmptyTitle>
        <EmptyDescription>{description ?? wording[status][1]}</EmptyDescription>
      </EmptyHeader>
      {onShowAll ? (
        <EmptyContent>
          <Button variant='outline' size='sm' onClick={onShowAll}>
            {t('taskCenterUi.empty.showAll', { defaultValue: 'Show all' })}
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

/** Three placeholder cards while a page of tasks loads. */
export function TaskListSkeleton(): ReactElement {
  const { t } = useTranslation();
  return (
    <ul
      className='flex flex-col gap-3'
      aria-label={t('taskCenterUi.loading', { defaultValue: 'Loading tasks' })}
      aria-busy
    >
      {[0, 1, 2].map((index) => (
        <li key={index}>
          <Card className='px-4'>
            <div className='flex items-start gap-3'>
              <Skeleton className='size-9 rounded-lg' />
              <div className='flex flex-1 flex-col gap-2'>
                <div className='flex items-center justify-between gap-3'>
                  <Skeleton className='h-4 w-2/3' />
                  <Skeleton className='h-5 w-14' />
                </div>
                <Skeleton className='h-3 w-32' />
                <Skeleton className='h-12 w-full rounded-lg' />
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export interface TaskPaginationProps {
  /** One-based. */
  readonly page: number;
  readonly pageCount: number;
  readonly total: number;
  readonly onPageChange: (page: number) => void;
}

/** Previous and next below the list, with where the reader is. Renders nothing for a single page. */
export function TaskPagination({
  onPageChange,
  page,
  pageCount,
  total,
}: TaskPaginationProps): ReactElement | null {
  const { t } = useTranslation();
  if (pageCount <= 1) return null;
  return (
    <nav
      aria-label={t('taskCenterUi.pagination.label', {
        defaultValue: 'Pages',
      })}
      className='flex items-center justify-between gap-2 text-sm text-muted-foreground'
    >
      <span>
        {t('taskCenterUi.pagination.summary', {
          page,
          pages: pageCount,
          total,
          defaultValue: 'Page {{page}} of {{pages}}, {{total}} tasks',
        })}
      </span>
      <div className='flex gap-2'>
        <Button
          variant='outline'
          size='sm'
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft data-icon='inline-start' />
          {t('taskCenterUi.pagination.previous', { defaultValue: 'Previous' })}
        </Button>
        <Button
          variant='outline'
          size='sm'
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          {t('taskCenterUi.pagination.next', { defaultValue: 'Next' })}
          <ChevronRight data-icon='inline-end' />
        </Button>
      </div>
    </nav>
  );
}
