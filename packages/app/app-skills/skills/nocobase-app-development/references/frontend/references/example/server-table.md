# Server-paginated table: `projects-server-table.tsx`

Part of the [projects worked example](../example.md).

**Depends on**: the [list page](list-page.md), which it changes, and what that depends on; [types](types.md) for the component.

**Add first**: what the [list page](list-page.md) adds; its `DataTable` brings the `table` primitive and `DataTablePagination` this component imports.

**Links to**: the same child routes as the list page.

Rules: [section 1 of `table.md`](../table.md#1-choosing-a-table-component). This adapter uses the standard `DataTable` in manual mode when the endpoint paginates; the list page keeps the page in the URL and passes it down.

The endpoint contract this assumes is the one in [types](types.md): `GET /api/projects` takes `page` (from 1), `pageSize` (at most 100) and `orderBy` besides `q` and `status`, and returns `{ data: Project[], meta: { page, pageSize, total } }` (`ProjectList`), where `total` counts the matching records on all pages. `orderBy` names a column the endpoint sorts by, `name` (in the order of the request's language) or `updatedAt`, followed by ` desc` for descending; the page always sends it, `updatedAt desc` by default (guideline T1.8).

The server-paginated list page is [`example/list-page.md`](list-page.md) with the changes below; everything else (the toolbar, list feedback, the row menu, the delete dialog and the focus handling after a delete) stays as it is there. Read [delete and recover a list](../table.md#delete-and-recover-a-list) first; its shared hooks own response isolation and bounded correction. Its `DataTableColumnHeader` headers sort through the URL: the page reads `orderBy`, sends it with the page, and passes it to `ProjectsServerTable`, which shows it in the header with `manualSorting`. Choosing another order writes `orderBy` and starts on the first page. A column that should sort must be one the endpoint accepts, so `SORTABLE` lists exactly the columns with a `DataTableColumnHeader`.

Keep the standard create action in the page header as in [`example/list-page.md`](list-page.md), including for a successful empty result; never pass it as `emptyAction`. The server table renders each built-in list state with its matching icon and one short line. Clear and Retry stay in the existing toolbar, and sign-in recovery stays in the authentication flow. Preserve the optional business-specific `emptyMessage` and `emptyAction` pass-through.

The changes, inside the list page's component; everything marked `// …` stays as it is there:

```tsx
// client/pages/projects/index.tsx (server-paginated: the list page with these changes)
import type { ColumnSort } from '@tanstack/react-table';
import { resolveListState } from '@nocobase/app-client';
import { type ReactElement } from 'react';
import { useListData } from '#hooks/use-list-data';
import { useListLocation } from '#hooks/use-list-location';
import {
  readTableUrlState,
  useTableUrlState,
} from '#hooks/use-table-url-state';
// … the other imports of the list page, without DataTable, and with ProjectList added to the import from ./types.js
import { ProjectsServerTable } from './projects-server-table.js';

const PAGE_SIZES = [10, 20, 50] as const;
// The columns the endpoint sorts by: the URL may name only these.
const SORTABLE = ['name', 'updatedAt'] as const;
// The default order, most recently updated first (guideline T1.8); the header shows it too.
const DEFAULT_SORT: ColumnSort = { id: 'updatedAt', desc: true };

// … isProjectStatus, as in the list page

export default function ProjectsPage(): ReactElement {
  // … t, locale, location and searchRef, as in the list page

  // A new search term starts on the first page, so the hook removes `page` whenever it writes the term.
  const { searchParams, search, text, inputProps, updateParams, clear } =
    useUrlSearch({ resetParams: ['page'] });
  const statusParam = searchParams.get('status');
  const status = isProjectStatus(statusParam) ? statusParam : undefined;
  const parsedTableState = readTableUrlState(searchParams, {
    defaultPageSize: PAGE_SIZES[0],
    pageSizeOptions: PAGE_SIZES,
    sortColumns: SORTABLE,
    sortFormat: 'orderBy',
    defaultSorting: [DEFAULT_SORT],
  });
  const { pageSize, pageIndex } = parsedTableState.paginationState;
  const page = pageIndex + 1;
  const orderBy = parsedTableState.sortingState
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

  const { active } = useListLocation();
  const remote = new URLSearchParams({
    q: search,
    ...(status ? { status } : {}),
    page: String(page),
    pageSize: String(pageSize),
    orderBy,
  });
  const requestPath = `projects?${remote}`;
  const request = useListData<ProjectList>(requestPath, {
    active,
    keepPreviousData: true,
  });
  const hasCurrentResponse = request.path === requestPath;
  const response = hasCurrentResponse ? request.data : undefined;
  const tableState = useTableUrlState({
    active,
    revision: request.revision,
    defaultPageSize: PAGE_SIZES[0],
    sortFormat: 'orderBy',
    defaultSorting: [DEFAULT_SORT],
    pageSizeOptions: PAGE_SIZES,
    sortColumns: SORTABLE,
    rowCount:
      hasCurrentResponse && !request.loading && !request.error
        ? response?.meta.total
        : undefined,
  });
  const reload = request.reload;
  const loading = request.loading;
  const error = tableState.error ?? request.error;
  const rows = response?.data ?? [];
  const result = response ? { total: response.meta.total } : undefined;
  const displayedQuery = new URLSearchParams(requestPath.split('?')[1]);
  const rowsFiltered = Boolean(
    displayedQuery.get('q') || displayedQuery.get('status'),
  );
  const listState = resolveListState(
    { data: response, error, isPending: loading && !hasCurrentResponse },
    result?.total ?? 0,
    rowsFiltered,
  );

  // … the focus handling after a delete, outletContext, the deletion state, the formatters
  // and the columns, as in the list page

  // Retry uses reload, and detail/batch deletions call reload once after the operation settles.
  const content = (
    <ProjectsServerTable
      columns={columns}
      rows={rows}
      total={result?.total ?? 0}
      listState={listState}
      loading={loading}
      onRetry={reload}
      onClearFilters={clearFilters}
      pagination={tableState.paginationState}
      pageSizeOptions={PAGE_SIZES}
      onPaginationChange={tableState.onPaginationChange}
      sorting={tableState.sortingState}
      onSortingChange={tableState.onSortingChange}
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
import type { ReactElement } from 'react';
import { DataTable, type DataTableProps } from '#components/data-table';
import type { Project } from './types.js';

export interface ProjectsServerTableProps extends Pick<
  DataTableProps<Project>,
  | 'listState'
  | 'loading'
  | 'onRetry'
  | 'onClearFilters'
  | 'emptyMessage'
  | 'emptyAction'
> {
  readonly columns: ColumnDef<Project>[];
  readonly rows: Project[];
  readonly total: number;
  readonly pagination: PaginationState;
  readonly onPaginationChange: (pagination: PaginationState) => void;
  readonly sorting: SortingState;
  readonly onSortingChange: (sorting: SortingState) => void;
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
  pageSizeOptions,
  ...listFeedback
}: ProjectsServerTableProps): ReactElement {
  return (
    <DataTable
      columns={columns}
      data={rows}
      {...listFeedback}
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
      pageSizeOptions={pageSizeOptions}
      showSelectedCount={false}
    />
  );
}
```
