/**
 * By project: one row per project the viewer may see (cancelled ones left out), those that delivered in the period
 * first: progress now (done over its live issues, with a thin bar), issues completed in the period, their median cycle
 * time and the issues blocked now. The project's name opens it.
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { FolderKanbanIcon } from 'lucide-react';
import { useMemo, type ReactElement } from 'react';
import { Link } from 'react-router';

import { DataTable } from '@/components/data-table';
import { cn } from 'cn';

import type {
  DashboardProject,
  DashboardReport,
} from '../../../shared/reports.js';
import {
  formatDuration,
  formatPercent,
  progressOf,
  PROJECTS_SHOWN,
} from './model.js';
import {
  CardEmpty,
  DashboardCard,
  ListSkeleton,
  ViewAllLink,
} from './parts.js';
import { useFormatLocale } from './use-format-locale.js';

export function ByProject({
  report,
}: {
  readonly report: UseQueryResult<DashboardReport>;
}): ReactElement | null {
  const { t } = useTranslation();
  const locale = useFormatLocale();
  const columns = useMemo<ColumnDef<DashboardProject>[]>(
    () => [
      {
        id: 'name',
        header: t('dashboard.projects.columns.project'),
        cell: ({ row }) => (
          <Link
            to={`/projects/${encodeURIComponent(row.original.id)}`}
            className='block max-w-64 truncate font-medium rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring'
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        id: 'progress',
        header: t('dashboard.projects.columns.progress'),
        cell: ({ row }) => {
          const share = progressOf(row.original);
          return (
            <div className='flex min-w-36 items-center gap-3'>
              <div
                role='progressbar'
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(share * 100)}
                aria-label={t('dashboard.projects.columns.progress')}
                className='h-1.5 w-20 overflow-hidden rounded-full bg-muted'
              >
                <div
                  className='h-full rounded-full bg-primary'
                  style={{ width: `${share * 100}%` }}
                />
              </div>
              <span className='text-muted-foreground tabular-nums'>
                {t('dashboard.projects.progress', {
                  done: row.original.done,
                  total: row.original.total,
                  percent: formatPercent(share, locale),
                })}
              </span>
            </div>
          );
        },
      },
      {
        id: 'completed',
        header: t('dashboard.projects.columns.completed'),
        cell: ({ row }) => (
          <span className='tabular-nums'>{row.original.completed}</span>
        ),
      },
      {
        id: 'cycleTime',
        header: t('dashboard.projects.columns.cycleTime'),
        cell: ({ row }) => (
          <span className='tabular-nums'>
            {row.original.cycleTimeP50Ms === null
              ? '—'
              : formatDuration(row.original.cycleTimeP50Ms, locale)}
          </span>
        ),
      },
      {
        id: 'blocked',
        header: t('dashboard.projects.columns.blocked'),
        cell: ({ row }) => (
          <span
            className={cn(
              'tabular-nums',
              row.original.blocked > 0 && 'font-medium text-destructive',
            )}
          >
            {row.original.blocked}
          </span>
        ),
      },
    ],
    [t, locale],
  );
  const data = report.data;
  // The headline figures show a failure once for the whole report.
  if (report.isError && !data) return null;
  if (data && !data.subjects) return null;
  return (
    <DashboardCard
      title={t('dashboard.projects.title')}
      description={t('dashboard.projects.description')}
      action={<ViewAllLink to='/projects' />}
    >
      {!data ? (
        <ListSkeleton rows={4} />
      ) : data.projects.length === 0 ? (
        <CardEmpty
          icon={FolderKanbanIcon}
          title={t('dashboard.projects.emptyTitle')}
          description={t('dashboard.projects.emptyDescription')}
        />
      ) : (
        <div
          className={cn(
            'transition-opacity',
            report.isPlaceholderData && 'opacity-60',
          )}
        >
          <DataTable
            columns={columns}
            data={data.projects.slice(0, PROJECTS_SHOWN)}
            getRowId={(project) => project.id}
            pagination={false}
          />
        </div>
      )}
    </DashboardCard>
  );
}
