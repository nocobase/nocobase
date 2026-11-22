/**
 * A list of runs, newest first, as a table on wide screens and cards on narrow ones, with “Load more” for the next
 * page. A row opens the run's sheet. `titleOf` adds the Schedule column for the history of every Schedule.
 */
import { useLocale } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { Button } from '../../components/ui/button.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table.js';
import type { Occurrence } from '../../lib/api.js';
import {
  formatDuration,
  formatFullTime,
  formatTime,
} from '../../lib/format.js';
import { useSchedulerTranslation } from '../../lib/i18n.js';
import { reasonText, summaryText } from './occurrence-text.js';
import { StatusTag } from './parts.js';

export interface OccurrenceListProps {
  readonly items: readonly Occurrence[];
  readonly loading: boolean;
  readonly hasMore: boolean;
  readonly onMore: () => void;
  readonly onOpen: (occurrence: Occurrence) => void;
  readonly now: number;
  readonly emptyText: string;
  readonly titleOf?: (occurrence: Occurrence) => string;
}

const UNFINISHED = new Set(['pending', 'running', 'waiting']);

export function OccurrenceList({
  items,
  loading,
  hasMore,
  onMore,
  onOpen,
  now,
  emptyText,
  titleOf,
}: OccurrenceListProps): ReactElement {
  const { t } = useSchedulerTranslation();
  const { locale } = useLocale();
  const planned = (item: Occurrence) => item.scheduledAt ?? item.startedAt;
  const duration = (item: Occurrence) => {
    const end = item.finishedAt
      ? Date.parse(item.finishedAt)
      : UNFINISHED.has(item.status)
        ? now
        : undefined;
    return end === undefined
      ? undefined
      : formatDuration(end - Date.parse(item.startedAt), locale);
  };
  const footer = hasMore ? (
    <div className='flex justify-center border-t p-3'>
      <Button variant='outline' size='sm' disabled={loading} onClick={onMore}>
        {t('page.loadMore')}
      </Button>
    </div>
  ) : null;
  if (items.length === 0)
    return (
      <p className='rounded-xl border px-4 py-8 text-center text-sm text-muted-foreground'>
        {loading ? '…' : emptyText}
      </p>
    );
  return (
    <div className='overflow-hidden rounded-xl border'>
      <div className='hidden md:block'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='pl-4'>
                {t('runs.columns.planned')}
              </TableHead>
              {titleOf ? <TableHead>{t('runs.columns.task')}</TableHead> : null}
              <TableHead>{t('runs.columns.result')}</TableHead>
              <TableHead>{t('runs.columns.reason')}</TableHead>
              <TableHead>{t('runs.columns.executions')}</TableHead>
              <TableHead>{t('runs.columns.duration')}</TableHead>
              <TableHead className='pr-4'>
                {t('runs.columns.summary')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow
                key={item.id}
                className='cursor-pointer'
                onClick={() => onOpen(item)}
              >
                <TableCell className='pl-4'>
                  <button
                    type='button'
                    className='underline underline-offset-4'
                    title={formatFullTime(planned(item), locale)}
                  >
                    {formatTime(planned(item), locale, new Date(now), true)}
                  </button>
                </TableCell>
                {titleOf ? (
                  <TableCell className='font-medium whitespace-normal'>
                    {titleOf(item)}
                  </TableCell>
                ) : null}
                <TableCell>
                  <StatusTag status={item.status} />
                </TableCell>
                <TableCell className='max-w-72 truncate text-muted-foreground'>
                  {reasonText(t, item.reason) ?? t('page.none')}
                </TableCell>
                <TableCell className='tabular-nums'>
                  {item.executionCount}
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {duration(item) ?? t('page.none')}
                </TableCell>
                <TableCell className='max-w-64 truncate pr-4 text-muted-foreground'>
                  {summaryText(item.resultSummary) ?? t('page.none')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className='divide-y md:hidden'>
        {items.map((item) => (
          <li key={item.id}>
            <button
              type='button'
              className='w-full space-y-1.5 p-4 text-left'
              onClick={() => onOpen(item)}
            >
              <div className='flex items-center justify-between gap-2'>
                <span className='text-sm font-medium'>
                  {formatTime(planned(item), locale, new Date(now), true)}
                </span>
                <StatusTag status={item.status} />
              </div>
              {titleOf ? <div className='text-sm'>{titleOf(item)}</div> : null}
              {item.reason ? (
                <div className='text-xs text-muted-foreground'>
                  {reasonText(t, item.reason)}
                </div>
              ) : null}
              <div className='text-xs text-muted-foreground'>
                {[
                  `${t('runs.columns.executions')} ${item.executionCount}`,
                  duration(item),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </button>
          </li>
        ))}
      </ul>
      {footer}
    </div>
  );
}
