# Server-paginated table: `projects-server-table.tsx`

Part of the [projects worked example](../example.md).

**Depends on**: the [list page](list-page.md), which it changes, and what that depends on; [types](types.md) for the component.

**Add first**: what the [list page](list-page.md) adds; its `DataTable` brings the `table` primitive and `DataTablePagination` this component imports.

**Links to**: the same child routes as the list page.

Rules: [section 1 of `table.md`](../table.md#1-choosing-a-table-component). This adapter uses the standard `DataTable` in manual mode when the endpoint paginates; the list page keeps the page in the URL and passes it down.

The endpoint contract this assumes is the one in [types](types.md): `GET /api/projects` takes `page` (from 1), `pageSize` (at most 100) and `orderBy` besides `q` and `status`, and returns `{ data: Project[], meta: { page, pageSize, total } }` (`ProjectList`), where `total` counts the matching records on all pages. `orderBy` names a column the endpoint sorts by, `name` (in the order of the request's language) or `updatedAt`, followed by ` desc` for descending; the page always sends it, `updatedAt desc` by default (guideline T1.8).

The server-paginated list page is [`example/list-page.md`](list-page.md) with the changes below; everything else (the toolbar, the four states, the row menu, the delete dialog and the focus handling after a delete) stays as it is there. Its `DataTableColumnHeader` headers sort through the URL: the page uses the template's `useTableUrlState` hook to parse pagination and ordering, sends them with the request and passes them to `ProjectsServerTable`, which shows ordering in the header with `manualSorting`. Choosing another order starts on the first page. A column that should sort must be one the endpoint accepts, so `SORTABLE` lists exactly the columns with a `DataTableColumnHeader`.

Pass `emptyAction` only when the existing create permission explicitly allows it. Preserve the business empty content and use [shared list feedback](../list-feedback.md) for all request states.

The changes, inside the list page's component; everything marked `// …` stays as it is there:

```tsx
// client/pages/projects/index.tsx (server-paginated: the list page with these changes)
import type { ColumnSort } from '@tanstack/react-table';
import { useTableUrlState } from '#hooks/use-table-url-state';
import {
  type ReactElement,
  useEffect,
  useEffectEvent,
  useMemo,
  useCallback,
  useRef,
  useState,
} from 'react';
// … the other imports of the list page, without DataTable, and with ProjectList added to the import from ./types.js
import { useQuery } from '@tanstack/react-query';
import { resolveListState, listStateShowsData } from '@nocobase/app-client';
import { ProjectsServerTable } from './projects-server-table.js';

const PAGE_SIZES = [10, 20, 50] as const;
// The columns the endpoint sorts by: the URL may name only these.
const SORTABLE = ['name', 'updatedAt'] as const;
// The default order, most recently updated first (guideline T1.8); the header shows it too.
const DEFAULT_SORT: ColumnSort = { id: 'updatedAt', desc: true };

// … isProjectStatus, as in the list page

export default function ProjectsPage(): ReactElement {
  // … t, locale, api, location and searchRef, as in the list page

  // A new search term starts on the first page, so the hook removes `page` whenever it writes the term.
  const { searchParams, search, text, inputProps, updateParams, clear } =
    useUrlSearch({ resetParams: ['page'] });
  const statusParam = searchParams.get('status');
  const status = isProjectStatus(statusParam) ? statusParam : undefined;
  const tableState = useTableUrlState({
    defaultPageSize: PAGE_SIZES[0],
    pageSizeOptions: PAGE_SIZES,
    sortColumns: SORTABLE,
    sortFormat: 'orderBy',
    defaultSorting: [DEFAULT_SORT],
  });
  const { pageIndex, pageSize } = tableState.paginationState;
  const page = pageIndex + 1;
  const orderBy = tableState.sortingState
    .map((sort) => `${sort.id}${sort.desc ? ' desc' : ''}`)
    .join(',');

  function changeStatus(value: string | null): void {
    updateParams((params) => {
      if (value && value !== 'all') params.set('status', value);
      else params.delete('status');
      // A new filter starts on the first page.
      params.delete('page');
    });
  }

  // … hasFilters and clearFilters, as in the list page

  // A page past the end (its last record was deleted elsewhere): go to the last page that exists. An effect event,
  // so the request effect can call it without depending on updateParams, which changes on every render.
  const goToPage = useEffectEvent((target: number) => {
    updateParams((params) => params.set('page', String(target)));
  });

  const request = useQuery({
    queryKey: [
      'projects',
      search.trim(),
      status ?? null,
      page,
      pageSize,
      orderBy,
    ],
    queryFn: ({ signal }) =>
      api.request<ProjectList>({
        path: 'projects',
        query: {
          q: search.trim() || undefined,
          status,
          page,
          pageSize,
          orderBy,
        },
        signal,
      }),
    retry: false,
  });
  const reload = useCallback(() => {
    void request.refetch();
  }, [request.refetch]);
  const rowsFiltered = Boolean(search.trim() || status);
  const state = resolveListState(
    request,
    request.data?.data.length ?? 0,
    rowsFiltered,
  );
  const rows = listStateShowsData(state) ? (request.data?.data ?? []) : [];
  const loading = request.isFetching;
  const lastPage =
    request.isSuccess && !request.isPlaceholderData
      ? Math.max(1, Math.ceil(request.data.meta.total / pageSize))
      : undefined;
  useEffect(() => {
    if (lastPage !== undefined && page > lastPage) goToPage(lastPage);
  }, [lastPage, page]);
  const listState =
    lastPage !== undefined && page > lastPage ? 'loading' : state;

  // … loading, rows, rowsFiltered, the focus handling after a delete, outletContext, the deletion state, the formatters
  // and the columns, as in the list page

  const content = (
    <ProjectsServerTable
      columns={columns}
      rows={rows}
      total={request.data?.meta.total ?? 0}
      listState={listState}
      loading={loading}
      onRetry={reload}
      onClearFilters={clearFilters}
      pagination={{ pageIndex: page - 1, pageSize }}
      pageSizeOptions={PAGE_SIZES}
      onPaginationChange={tableState.onPaginationChange}
      sorting={tableState.sortingState}
      onSortingChange={tableState.onSortingChange}
      emptyAction={
        canCreate === true ? (
          <Button
            nativeButton={false}
            render={<Link to={{ pathname: 'new', search: location.search }} />}
          >
            <PlusIcon />
            {t('projects.create.action')}
          </Button>
        ) : null
      }
      emptyMessage={
        <>
          <h2>{t('projects.empty.title')}</h2>
          <p>{t('projects.empty.description')}</p>
        </>
      }
    />
  );

  // … the returned page, as in the list page
}
```

The component it renders:

```tsx
// client/pages/projects/projects-server-table.tsx
import type {
  ColumnDef,
  PaginationState,
  SortingState,
} from '@tanstack/react-table';
import type { ReactElement, ReactNode } from 'react';
import { DataTable, type DataTableProps } from '#components/data-table';
import type { Project } from './types.js';

export interface ProjectsServerTableProps extends Pick<
  DataTableProps<Project>,
  'listState' | 'loading' | 'onRetry' | 'onClearFilters' | 'emptyAction'
> {
  readonly columns: ColumnDef<Project>[];
  readonly rows: Project[];
  readonly total: number;
  readonly pagination: PaginationState;
  readonly onPaginationChange: (pagination: PaginationState) => void;
  readonly sorting: SortingState;
  readonly onSortingChange: (sorting: SortingState) => void;
  readonly emptyMessage: ReactNode;
  readonly pageSizeOptions: readonly number[];
}

export function ProjectsServerTable({
  columns,
  rows,
  total,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  emptyMessage,
  pageSizeOptions,
  ...feedback
}: ProjectsServerTableProps): ReactElement {
  return (
    <DataTable
      {...feedback}
      columns={columns}
      data={rows}
      getRowId={(row) => String(row.id)}
      manualPagination
      rowCount={total}
      paginationState={pagination}
      onPaginationChange={(next) =>
        onPaginationChange(typeof next === 'function' ? next(pagination) : next)
      }
      manualSorting
      sortingState={sorting}
      onSortingChange={(next) =>
        onSortingChange(typeof next === 'function' ? next(sorting) : next)
      }
      emptyMessage={emptyMessage}
      pageSizeOptions={pageSizeOptions}
      showSelectedCount={false}
    />
  );
}
```
