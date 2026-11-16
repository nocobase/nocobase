import { resolveListState } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { useEffect, useMemo, useRef, type ReactElement } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import {
  DataTable,
  DataTableColumnHeader,
  DataTableSearch,
} from '#components/data-table';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { RecordLink } from '#components/record-link';
import { RowActions } from '#components/row-actions';
import { Button } from '#components/ui/button';
import { Card, CardDescription, CardHeader } from '#components/ui/card';
import { Skeleton } from '#components/ui/skeleton';
import { type DataChange } from '#hooks/use-data-changes';
import { useListData } from '#hooks/use-list-data';
import { useListLocation } from '#hooks/use-list-location';
import { useTableUrlState } from '#hooks/use-table-url-state';
import { projectPermissions } from './access.js';
import { projectsScope } from './scopes.js';

export interface SkillProject {
  id: string;
  name: string;
}

export interface SkillProjectList {
  data: SkillProject[];
  meta: { total: number };
}

export default function SkillProjectsPage(): ReactElement {
  const { t } = useTranslation();
  const { active, params, setParams } = useListLocation();
  const location = useLocation();
  const canCreate = useCan(projectPermissions.create).can;
  const canUpdate = useCan(projectPermissions.update).can;
  const q = params.get('q')?.trim() ?? '';
  const sortingQuery = new URLSearchParams();
  if (q) sortingQuery.set('q', q);
  if (params.get('sort') === 'name') {
    sortingQuery.set('sort', 'name');
    sortingQuery.set('order', params.get('order') === 'desc' ? 'desc' : 'asc');
  }
  const requestPath = sortingQuery.size
    ? `${projectsScope}?${sortingQuery}`
    : projectsScope;
  const defaultOrder = !sortingQuery.has('sort') && !q;
  // Every write the overlays announce for `skillProjects` refreshes the list and the metric (data-changes.md).
  const request = useListData<SkillProjectList>(requestPath, {
    active,
    keepPreviousData: true,
    scopes: [projectsScope],
    // Show a confirmed write at once; the verification read follows.
    merge: (current, change) => mergeProjects(current, change, defaultOrder),
  });
  const summary = useListData<{ data: { total: number } }>(
    `${projectsScope}/summary`,
    { active, keepPreviousData: true, scopes: [projectsScope] },
  );
  const current = request.path === requestPath ? request.data : undefined;
  const { error: tableError, ...tableState } = useTableUrlState({
    active,
    revision: request.revision,
    sortColumns: ['name'],
    rowCount:
      current && !request.loading && !request.error
        ? current.data.length
        : undefined,
  });
  // Whether the shown rows answer a search, from the response rather than the URL.
  const filtered = Boolean(
    new URLSearchParams(request.path.split('?')[1]).get('q'),
  );
  const listState = resolveListState(
    {
      data: current,
      error: tableError ?? request.error,
      isPending: request.loading && !current,
    },
    current?.data.length ?? 0,
    filtered,
  );
  const setSearch = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set('q', value);
    else next.delete('q');
    next.delete('page');
    setParams(next, { replace: true });
  };
  const returnTargetRef = useRef<HTMLDivElement>(null);
  const returningRef = useRef(false);
  useEffect(() => {
    if (!active) {
      returningRef.current = true;
      return;
    }
    if (!returningRef.current) return;
    // Let the overlay restore its opener first; direct links and removed rows
    // still need a stable destination after the return read has settled.
    const frame = requestAnimationFrame(() => {
      if (!document.activeElement || document.activeElement === document.body)
        returnTargetRef.current?.focus();
      if (!request.loading) returningRef.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [active, request.loading, request.data]);
  const columns = useMemo<ColumnDef<SkillProject>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('skillProjects.name')}
          />
        ),
        // The name opens the detail drawer and keeps the list's query.
        cell: ({ row }) => (
          <RecordLink
            to={{ pathname: row.original.id, search: location.search }}
            className='block max-w-64 truncate'
            title={row.original.name}
          >
            {row.original.name}
          </RecordLink>
        ),
      },
      {
        id: 'actions',
        enableHiding: false,
        // The actions column keeps a name for screen readers and shows no header text (T1.5).
        header: () => (
          <span className='sr-only'>{t('skillProjects.actions')}</span>
        ),
        cell: ({ row }) => (
          <RowActions
            label={t('skillProjects.actionsFor', { name: row.original.name })}
            actions={[
              canUpdate && {
                key: 'edit',
                label: t('skillProjects.editAction'),
                render: (
                  <Link
                    to={{
                      pathname: `${row.original.id}/edit`,
                      search: location.search,
                    }}
                  />
                ),
              },
            ]}
          />
        ),
      },
    ],
    [t, location.search, canUpdate],
  );
  const showCreate =
    canCreate &&
    ['ready', 'empty', 'no-results', 'refresh-failed'].includes(listState);
  return (
    <PageContainer>
      <div
        ref={returnTargetRef}
        tabIndex={-1}
        role='region'
        aria-label={t('skillProjects.title')}
      >
        <PageHeader
          title={t('skillProjects.title')}
          description={t('skillProjects.description')}
          actions={
            showCreate ? (
              <Button
                render={
                  <Link to={{ pathname: 'new', search: location.search }} />
                }
                nativeButton={false}
              >
                {t('skillProjects.create')}
              </Button>
            ) : undefined
          }
        />
      </div>
      <ProjectsMetric
        total={summary.error ? undefined : summary.data?.data.total}
        failed={Boolean(summary.error)}
      />
      <DataTable
        {...tableState}
        manualSorting
        columns={columns}
        data={current?.data ?? []}
        getRowId={(row) => row.id}
        showSelectedCount={false}
        listState={listState}
        loading={active && request.loading}
        loadingIdentity={requestPath}
        onRetry={request.reload}
        search={
          <DataTableSearch
            value={q}
            label={t('skillProjects.search')}
            onSearch={setSearch}
          />
        }
        filtered={filtered}
        onClearFilters={() => setSearch('')}
        // The endpoint returns at most 100 projects; say so when more match (T1.10).
        summary={
          current && current.meta.total > current.data.length
            ? t('skillProjects.cap')
            : undefined
        }
        emptyMessage={t('skillProjects.empty')}
        getColumnLabel={(column) =>
          t(
            column.id === 'name'
              ? 'skillProjects.name'
              : 'skillProjects.actions',
          )
        }
        // Phones show one card per project (mobile.md M3): the name opens its detail, and the row's own actions
        // cell (the "⋮" menu with Edit) follows it, so the card offers what the row does.
        renderCard={(row, card) => (
          <div className='flex items-center gap-2 rounded-lg border p-4'>
            <RecordLink
              to={{ pathname: row.original.id, search: location.search }}
              className='min-w-0 flex-1 break-words'
            >
              {row.original.name}
            </RecordLink>
            {card.actions}
          </div>
        )}
      />
      <Outlet />
    </PageContainer>
  );
}

/** Applies confirmed results to the shown rows, in the endpoint's order. */
function mergeProjects(
  current: SkillProjectList,
  change: DataChange,
  defaultOrder: boolean,
): SkillProjectList | undefined {
  let rows = current.data;
  let total = current.meta.total;
  let changed = false;
  for (const [scope, value] of Object.entries(change.results ?? {})) {
    const [resource, id, ...rest] = scope.split('/');
    if (resource !== projectsScope || !id || rest.length) continue;
    const existed = rows.some((row) => row.id === id);
    if (value === null) {
      if (!existed) continue;
      rows = rows.filter((row) => row.id !== id);
      total -= 1;
    } else {
      const project = (value as { data: SkillProject }).data;
      if (existed) rows = rows.map((row) => (row.id === id ? project : row));
      else if (defaultOrder) {
        // Searched or re-sorted rows wait for the read to place a new record.
        rows = [...rows, project]
          .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
          .slice(0, 100);
        total += 1;
      } else continue;
    }
    changed = true;
  }
  return changed ? { data: rows, meta: { total } } : undefined;
}

function ProjectsMetric({
  total,
  failed,
}: {
  readonly total: number | undefined;
  readonly failed: boolean;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Card size='sm' className='w-full sm:max-w-56'>
      <CardHeader>
        <CardDescription>{t('skillProjects.totalMetric')}</CardDescription>
        {/* The card's own title size is fixed for small cards; a metric needs a larger figure. */}
        <p
          className='font-heading text-2xl font-semibold tabular-nums'
          data-testid='projects-total'
        >
          {failed ? (
            t('skillProjects.metricUnavailable')
          ) : total === undefined ? (
            <Skeleton
              className='h-8 w-12'
              aria-label={t('skillProjects.loading')}
            />
          ) : (
            total
          )}
        </p>
      </CardHeader>
    </Card>
  );
}
