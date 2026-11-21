# List page: `index.tsx`

Part of the [projects worked example](../example.md). Start a new page from the runnable [executable list and edit example](../executable-list-edit.md); this file shows what it leaves out: a status filter, server pagination and sorting, a status column, a delete action and permission-dependent actions.

**Depends on**: [types](types.md), [delete dialog](delete-dialog.md). **Links to**: `new` ([create dialog](create-dialog.md)), `:projectId` ([detail drawer](detail-drawer.md)) and `:projectId/edit` ([edit dialog](edit-dialog.md)); the routes are listed in the [example index](../example.md#routes).

Rules: [`table.md`](../table.md) and guidelines T1 (list template, T1.5 row actions). Search is `DataTableSearch`, the filter a `DataTableFilter`, and both live in the URL through `useListLocation` (the covered list keeps its query) and `useTableUrlState` (page, page size, `orderBy`). The list declares the `projects` scope, so every write announced by the overlays refreshes it, at once when visible or once on return ([data changes](../data-changes.md)); no callbacks pass through the `Outlet`. Create is the page header's action, shown only with the `create` permission; Edit and Delete appear in the row's "⋮" menu only with their permissions. On a phone `DataTable` shows `renderCard`, which ends with the row's own menu.

```tsx
// client/pages/projects/index.tsx
import { resolveListState } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useLocale, useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { PlusIcon } from 'lucide-react';
import { type ReactElement, useMemo, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';

import {
  DataTable,
  DataTableColumnHeader,
  DataTableFilter,
  DataTableSearch,
} from '#components/data-table';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { RecordLink } from '#components/record-link';
import { RowActions } from '#components/row-actions';
import { Button } from '#components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { useListData } from '#hooks/use-list-data';
import { useListLocation } from '#hooks/use-list-location';
import { useTableUrlState } from '#hooks/use-table-url-state';

import { ProjectDeleteDialog } from './project-delete-dialog.js';
import { ProjectStatusBadge } from './status-badge.js';
import {
  PROJECT_STATUSES,
  type Project,
  type ProjectList,
  projectPermission,
  projectsScope,
} from './types.js';

const SORTABLE = ['name', 'updatedAt'];

export default function ProjectsPage(): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const location = useLocation();
  const canCreate = useCan(projectPermission('create')).can;
  const canUpdate = useCan(projectPermission('update')).can;
  const canDelete = useCan(projectPermission('delete')).can;

  const { params, setParams, active } = useListLocation();
  const q = params.get('q') ?? '';
  const statusParam = params.get('status');
  const status = PROJECT_STATUSES.find((value) => value === statusParam);
  const table = useTableUrlState({
    active,
    sortColumns: SORTABLE,
    sortFormat: 'orderBy',
    defaultSorting: [{ id: 'updatedAt', desc: true }],
  });
  const { pageIndex, pageSize } = table.paginationState;
  const orderBy = table.sortingState
    .map((sort) => `${sort.id}${sort.desc ? ' desc' : ''}`)
    .join(',');
  const query = new URLSearchParams({
    page: String(pageIndex + 1),
    pageSize: String(pageSize),
    orderBy,
    ...(q ? { q } : {}),
    ...(status ? { status } : {}),
  });
  const path = `projects?${query}`;
  const request = useListData<ProjectList>(path, {
    active,
    keepPreviousData: true,
    scopes: [projectsScope],
  });
  const current = request.path === path ? request.data : undefined;
  const rows = current?.data ?? [];
  const filtered = Boolean(q || status);
  const listState = resolveListState(
    {
      data: current,
      error: request.error,
      isPending: request.loading && !current,
    },
    rows.length,
    filtered,
  );

  // Every filter change starts again on the first page.
  function setFilter(key: string, value: string | undefined): void {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next, { replace: true });
  }

  // The confirmation keeps its target while closing, so the title does not go blank during the exit animation.
  const [deletion, setDeletion] = useState<{
    readonly open: boolean;
    readonly project: Project | null;
  }>({ open: false, project: null });

  const statusItems = [
    { value: 'all', label: t('projects.filters.allStatuses') },
    ...PROJECT_STATUSES.map((value) => ({
      value,
      label: t(`projects.status.${value}`),
    })),
  ];
  const dateFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [locale],
  );
  const columns = useMemo<ColumnDef<Project>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('projects.fields.name')}
          />
        ),
        // The name opens the detail drawer and keeps the list's query.
        cell: ({ row }) => (
          <RecordLink
            to={{ pathname: row.original.id, search: location.search }}
          >
            {row.original.name}
          </RecordLink>
        ),
      },
      {
        accessorKey: 'owner',
        header: t('projects.fields.owner'),
        cell: ({ row }) => row.original.owner ?? '—',
      },
      {
        accessorKey: 'status',
        header: t('projects.fields.status'),
        cell: ({ row }) => <ProjectStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('projects.fields.updatedAt')}
          />
        ),
        cell: ({ row }) => dateFormat.format(new Date(row.original.updatedAt)),
      },
      {
        id: 'actions',
        header: () => (
          <span className='sr-only'>{t('projects.actions.label')}</span>
        ),
        // All row actions live in the "⋮" menu (T1.5); a page plan may name up to two for `exposed`.
        cell: ({ row }) => (
          <RowActions
            label={t('projects.actions.for', { name: row.original.name })}
            actions={[
              canUpdate && {
                key: 'edit',
                label: t('projects.actions.edit'),
                render: (
                  <Link
                    to={{
                      pathname: `${row.original.id}/edit`,
                      search: location.search,
                    }}
                  />
                ),
              },
              canDelete && {
                key: 'delete',
                label: t('projects.actions.delete'),
                destructive: true,
                onClick: () =>
                  setDeletion({ open: true, project: row.original }),
              },
            ]}
          />
        ),
      },
    ],
    [t, location.search, dateFormat, canUpdate, canDelete],
  );

  return (
    <PageContainer>
      <PageHeader
        title={t('projects.title')}
        description={t('projects.description')}
        actions={
          canCreate ? (
            <Button
              nativeButton={false}
              render={
                <Link to={{ pathname: 'new', search: location.search }} />
              }
            >
              <PlusIcon data-icon='inline-start' />
              {t('projects.create.action')}
            </Button>
          ) : null
        }
      />
      <DataTable
        {...table}
        columns={columns}
        data={rows}
        manualPagination
        manualSorting
        rowCount={current?.meta.total ?? 0}
        getRowId={(row) => row.id}
        showSelectedCount={false}
        listState={listState}
        loading={active && request.loading}
        loadingIdentity={path}
        onRetry={request.reload}
        search={
          <DataTableSearch
            value={q}
            label={t('projects.search')}
            onSearch={(value) => setFilter('q', value)}
          />
        }
        filters={
          <DataTableFilter label={t('projects.fields.status')}>
            <Select
              items={statusItems}
              value={status ?? 'all'}
              onValueChange={(value) =>
                setFilter(
                  'status',
                  value && value !== 'all' ? value : undefined,
                )
              }
            >
              <SelectTrigger
                className='w-40'
                aria-label={t('projects.fields.status')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DataTableFilter>
        }
        filterCount={status ? 1 : 0}
        filtered={filtered}
        onClearFilters={() => {
          const next = new URLSearchParams(params);
          for (const key of ['q', 'status', 'page']) next.delete(key);
          setParams(next, { replace: true });
        }}
        getColumnLabel={(column) => t(`projects.fields.${column.id}`)}
        renderCard={(row, card) => (
          <div className='flex items-start gap-3 rounded-lg border p-4'>
            <div className='flex min-w-0 flex-1 flex-col gap-1'>
              <RecordLink
                to={{ pathname: row.original.id, search: location.search }}
              >
                {row.original.name}
              </RecordLink>
              <div className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
                <ProjectStatusBadge status={row.original.status} />
                {row.original.owner}
              </div>
            </div>
            {card.actions}
          </div>
        )}
      />
      <ProjectDeleteDialog
        open={deletion.open}
        project={deletion.project}
        onOpenChange={(open) => setDeletion((old) => ({ ...old, open }))}
      />
      <Outlet />
    </PageContainer>
  );
}
```

- **Without a detail view**, render the name as plain text: a link to a route that does not exist lands on the home page.
- **Without delete**, drop the `deletion` state, the `delete` action and `ProjectDeleteDialog`.
- **A small capped dataset** may page and sort in the browser instead, without `manualPagination` and `manualSorting`; say so when more records match than it shows.
