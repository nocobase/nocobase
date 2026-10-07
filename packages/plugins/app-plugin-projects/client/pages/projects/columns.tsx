import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { LockIcon } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';

import { PRIORITIES } from '../../../shared/common.js';
import {
  PROJECT_STATUSES,
  type ProjectListItem,
} from '../../../shared/projects.js';
import { DataTableColumnHeader } from '../../components/data-table-column-header.js';
import { PmPriorityLabel } from '../../components/pm-badges.js';
import { usePmFormatters } from '../../lib/format.js';
import { progressFromCounts } from './progress.js';
import { ProjectProgressBar, ProjectStatusBadge } from './project-badges.js';

/**
 * Columns of the project list; the name links to the detail page so rows are keyboard-reachable. Sorting is the
 * table's own: every visible project is loaded.
 */
export function useProjectColumns(): ColumnDef<ProjectListItem, unknown>[] {
  const { t } = useTranslation();
  const format = usePmFormatters();
  return useMemo<ColumnDef<ProjectListItem, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        enableHiding: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('projects.columns.name')}
          />
        ),
        sortingFn: (a, b) => a.original.name.localeCompare(b.original.name),
        cell: ({ row }) => (
          <Link
            to={encodeURIComponent(row.original.id)}
            onClick={(event) => event.stopPropagation()}
            className='inline-flex items-center gap-1.5 font-medium hover:underline'
          >
            {row.original.name}
            {row.original.visibility === 'members' ? (
              <LockIcon
                className='size-3.5 text-muted-foreground'
                aria-label={t('projects.visibility.members')}
              />
            ) : null}
          </Link>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('projects.columns.status')}
          />
        ),
        sortingFn: (a, b) =>
          PROJECT_STATUSES.indexOf(a.original.status) -
          PROJECT_STATUSES.indexOf(b.original.status),
        cell: ({ row }) => <ProjectStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'priority',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('projects.columns.priority')}
          />
        ),
        sortingFn: (a, b) =>
          PRIORITIES.indexOf(a.original.priority) -
          PRIORITIES.indexOf(b.original.priority),
        cell: ({ row }) => <PmPriorityLabel priority={row.original.priority} />,
      },
      {
        id: 'lead',
        enableSorting: false,
        header: t('projects.columns.lead'),
        cell: ({ row }) =>
          row.original.lead ? (
            <span className='truncate text-sm'>{row.original.lead.name}</span>
          ) : (
            <span className='text-muted-foreground'>—</span>
          ),
      },
      {
        id: 'progress',
        enableSorting: false,
        header: t('projects.columns.progress'),
        cell: ({ row }) => {
          const progress = progressFromCounts(row.original.issueCounts);
          return (
            <ProjectProgressBar
              {...progress}
              label={t('projects.progressLabel', {
                done: progress.done,
                total: progress.total,
              })}
            />
          );
        },
      },
      {
        id: 'members',
        enableSorting: false,
        header: t('projects.columns.members'),
        cell: ({ row }) => (
          <span className='text-sm tabular-nums'>
            {row.original.memberCount}
          </span>
        ),
      },
      {
        accessorKey: 'dueDate',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('dates.due')} />
        ),
        // Projects without a due date sort last either way round.
        sortingFn: (a, b) =>
          (a.original.dueDate ?? '9999').localeCompare(
            b.original.dueDate ?? '9999',
          ),
        cell: ({ row }) => (
          <span className='text-sm whitespace-nowrap text-muted-foreground'>
            {format.date(row.original.dueDate)}
          </span>
        ),
      },
    ],
    [t, format],
  );
}
