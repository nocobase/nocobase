import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { FolderIcon } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, DataTableColumnHeader } from '#components/data-table';
import { Card, CardDescription, CardHeader } from '#components/ui/card';
import { Input } from '#components/ui/input';
import { type DataChange } from '#hooks/use-data-changes';
import { useUrlSearch } from '#hooks/use-url-search';
import { projectsScope } from './scopes.js';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { RecordLink } from '#components/record-link';
import { Alert, AlertDescription } from '#components/ui/alert';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '#components/ui/table';
import { Button } from '#components/ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '#components/ui/empty';
import { Skeleton } from '#components/ui/skeleton';
import { Spinner } from '#components/ui/spinner';
import { useListLocation } from '#hooks/use-list-location';
import { useListData } from '#hooks/use-list-data';
import { useTableUrlState } from '#hooks/use-table-url-state';

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
  const { active, params } = useListLocation();
  const location = useLocation();
  const searchBox = useUrlSearch({ resetParams: ['page'] });
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
  const { data } = request;
  const tableState = useTableUrlState({
    active,
    revision: request.revision,
    sortColumns: ['name'],
    rowCount:
      !request.loading && !request.error && request.path === requestPath
        ? data?.data.length
        : undefined,
  });
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
  }, [active, request.loading, data]);
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
        cell: ({ row }) => (
          <RecordLink
            to={`${row.original.id}/details`}
            className='block max-w-64 truncate'
            title={row.original.name}
          >
            {row.original.name}
          </RecordLink>
        ),
      },
      {
        id: 'actions',
        header: t('skillProjects.actions'),
        cell: ({ row }) => (
          <Button
            variant='ghost'
            render={
              <Link
                to={{
                  pathname: `${row.original.id}/edit`,
                  search: location.search,
                }}
              />
            }
            nativeButton={false}
          >
            {t('skillProjects.editAction')}
          </Button>
        ),
      },
    ],
    [t, location.search],
  );
  const status =
    request.error instanceof ApiClientError ? request.error.status : undefined;
  // Whether the shown rows answer a search, from the response rather than the URL.
  const shownQuery = new URLSearchParams(request.path.split('?')[1]).get('q');
  const createAction = (
    <Button
      render={<Link to={{ pathname: 'new', search: location.search }} />}
      nativeButton={false}
    >
      {t('skillProjects.create')}
    </Button>
  );
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
            (request.data?.data.length || shownQuery) && !request.error
              ? createAction
              : undefined
          }
        />
      </div>
      <ProjectsMetric
        total={summary.error ? undefined : summary.data?.data.total}
        failed={Boolean(summary.error)}
      />
      <Input
        type='search'
        className='w-full sm:max-w-xs'
        aria-label={t('skillProjects.search')}
        placeholder={t('skillProjects.search')}
        {...searchBox.inputProps}
      />
      <div
        className='flex h-8 items-center justify-end'
        data-testid='refresh-slot'
      >
        {active && request.loading && request.data ? (
          <RefreshIndicator />
        ) : null}
      </div>
      {request.error ? (
        <Alert variant='destructive'>
          <AlertDescription className='flex flex-col items-start gap-2'>
            <p>
              {t(
                status === 401
                  ? 'skillProjects.expired'
                  : status === 403
                    ? 'skillProjects.denied'
                    : 'skillProjects.failed',
              )}
            </p>
            {status === 401 ? (
              <Link to='/login'>{t('skillProjects.signIn')}</Link>
            ) : status === 403 ? null : (
              <Button onClick={request.reload}>
                {t('skillProjects.retry')}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ) : null}
      {!request.data && !request.error ? (
        <div role='status' aria-label={t('skillProjects.loading')}>
          <Table aria-hidden='true'>
            <TableHeader>
              <TableRow>
                <TableHead>{t('skillProjects.name')}</TableHead>
                <TableHead>{t('skillProjects.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[0, 1, 2].map((row) => (
                <TableRow key={row}>
                  <TableCell>
                    <Skeleton className='h-4 w-40' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-8 w-16' />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : request.data?.data.length === 0 && !request.error && shownQuery ? (
        <Empty className='min-h-48 border'>
          <EmptyHeader>
            <EmptyTitle>{t('skillProjects.noResults')}</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Button variant='outline' onClick={() => searchBox.clear()}>
              {t('skillProjects.clearSearch')}
            </Button>
          </EmptyContent>
        </Empty>
      ) : request.data?.data.length === 0 && !request.error ? (
        <Empty className='min-h-48 border'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <FolderIcon />
            </EmptyMedia>
            <EmptyTitle>{t('skillProjects.emptyTitle')}</EmptyTitle>
            <EmptyDescription>{t('skillProjects.empty')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{createAction}</EmptyContent>
        </Empty>
      ) : request.data ? (
        <>
          {request.data.meta.total > request.data.data.length ? (
            <p>{t('skillProjects.cap')}</p>
          ) : null}
          <DataTable
            paginationState={tableState.paginationState}
            onPaginationChange={tableState.onPaginationChange}
            pageSizeOptions={tableState.pageSizeOptions}
            manualSorting
            sortingState={tableState.sortingState}
            onSortingChange={tableState.onSortingChange}
            columns={columns}
            data={request.data.data}
            getRowId={(row) => row.id}
            showSelectedCount={false}
            emptyMessage={t('skillProjects.empty')}
          />
        </>
      ) : null}
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

function RefreshIndicator(): ReactElement | null {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);
  return visible ? (
    <span
      role='status'
      className='flex items-center gap-2 text-sm text-muted-foreground'
    >
      <Spinner />
      {t('skillProjects.refreshing')}
    </span>
  ) : null;
}
