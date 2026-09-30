# Server-paginated table: `projects-server-table.tsx`

Part of the [projects worked example](../example.md).

**Depends on**: the [list page](list-page.md), which it changes, and what that depends on; [types](types.md) for the component.

**Add first**: what the [list page](list-page.md) adds; its `@nocobase/data-table` brings the `table` primitive and `DataTablePagination` this component imports.

**Links to**: the same child routes as the list page.

Rules: [section 1 of `table.md`](../table.md#1-choosing-a-table-component). Use it instead of `DataTable` when the endpoint paginates; the list page keeps the page in the URL and passes it down.

The endpoint contract this assumes: `GET /api/projects` takes `page` (from 1), `pageSize` and `sort` besides `search` and `status`, and returns `{ data: Project[], meta: { total: number } }`, where `total` counts the matching records on all pages. `sort` names a column the endpoint sorts by, `name` (in the order of the request's language) or `updatedAt`, prefixed with `-` for descending; the page always sends it, `-updatedAt` by default (guideline T1.8).

The server-paginated list page is [`example/list-page.md`](list-page.md) with the changes below; everything else (the toolbar, the four states, the row menu, the delete dialog and the focus handling after a delete) stays as it is there. Its `DataTableColumnHeader` headers sort through the URL: the page reads `sort`, sends it with the page, and passes it to `ProjectsServerTable`, which shows it in the header with `manualSorting`. Choosing another order writes `sort` and starts on the first page. A column that should sort must be one the endpoint accepts, so `SORTABLE` lists exactly the columns with a `DataTableColumnHeader`.

The changes, inside the list page's component; everything marked `// …` stays as it is there:

```tsx
// client/pages/projects/index.tsx (server-paginated: the list page with these changes)
import type { ColumnSort } from '@tanstack/react-table';
import {
  type ReactElement,
  useEffect,
  useEffectEvent,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
// … the other imports of the list page, without DataTable
import { ProjectsServerTable } from './projects-server-table.js';

const PAGE_SIZES = [10, 20, 50] as const;
// The columns the endpoint sorts by: the URL may name only these.
const SORTABLE = ['name', 'updatedAt'] as const;
// The default order, most recently updated first (guideline T1.8); the header shows it too.
const DEFAULT_SORT: ColumnSort = { id: 'updatedAt', desc: true };

// … isProjectStatus, as in the list page

/** Reads `sort` from the URL: a sortable column, prefixed with `-` for descending. Anything else is the default. */
function parseSort(value: string | null): ColumnSort {
  if (!value) return DEFAULT_SORT;
  const desc = value.startsWith('-');
  const id = desc ? value.slice(1) : value;
  return SORTABLE.some((column) => column === id) ? { id, desc } : DEFAULT_SORT;
}

function formatSort(column: ColumnSort): string {
  return `${column.desc ? '-' : ''}${column.id}`;
}

export default function ProjectsPage(): ReactElement {
  // … t, locale, api, location and searchRef, as in the list page

  // A new search term starts on the first page, so the hook removes `page` whenever it writes the term.
  const { searchParams, search, text, inputProps, updateParams, clear } =
    useUrlSearch({ resetParams: ['page'] });
  const statusParam = searchParams.get('status');
  const status = isProjectStatus(statusParam) ? statusParam : undefined;
  // Bound what the URL may say: an unknown size or a page below 1 falls back to the defaults.
  const pageSize =
    PAGE_SIZES.find((size) => String(size) === searchParams.get('pageSize')) ??
    PAGE_SIZES[0];
  const page = Math.max(1, Math.trunc(Number(searchParams.get('page'))) || 1);
  const columnSort = parseSort(searchParams.get('sort'));
  const sort = formatSort(columnSort);

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

  const [reloadCount, reload] = useReducer((count: number) => count + 1, 0);
  const requestKey = JSON.stringify([
    search,
    status ?? null,
    page,
    pageSize,
    sort,
    reloadCount,
  ]);
  const [result, setResult] = useState<{
    readonly key: string;
    readonly rows?: Project[];
    /** Whether this batch was fetched with filters; tells "empty" apart from "no results". */
    readonly filtered?: boolean;
    readonly error?: unknown;
    readonly total?: number;
  }>();

  useEffect(() => {
    const controller = new AbortController();
    const key = JSON.stringify([
      search,
      status ?? null,
      page,
      pageSize,
      sort,
      reloadCount,
    ]);
    api
      .request<{ data: Project[]; meta: { total: number } }>({
        path: 'projects',
        query: { search: search || undefined, status, page, pageSize, sort },
        signal: controller.signal,
      })
      .then(
        ({ data, meta }) => {
          if (controller.signal.aborted) return;
          setResult({
            key,
            rows: data,
            total: meta.total,
            filtered: search !== '' || status !== undefined,
          });
          const lastPage = Math.max(1, Math.ceil(meta.total / pageSize));
          if (data.length === 0 && page > lastPage) goToPage(lastPage);
        },
        (error: unknown) => {
          // Keep the previous batch on failure: after "Retry", show the old data and a small Spinner, not the skeleton.
          if (!controller.signal.aborted) {
            setResult((previous) => ({ ...previous, key, error }));
          }
        },
      );
    return () => controller.abort();
  }, [api, search, status, page, pageSize, sort, reloadCount]);

  // … loading, rows, rowsFiltered, the focus handling after a delete, outletContext, the deletion state, the formatters
  // and the columns, as in the list page

  let content: ReactElement;
  if (error instanceof ApiClientError && error.status === 401) {
    // The session ended; signing in again is the only way forward (guideline S4).
    content = <SessionExpiredAlert />;
  } else if (error) {
    // … the error Alert, as in the list page
  } else if (rows === undefined) {
    content = <TableSkeleton label={t('status.loading')} />;
  } else if (result?.total === 0 && !rowsFiltered) {
    // No records at all (guideline S2). Decided by the total: an empty page past the end is not an empty list.
    content = (
      <Empty className='border'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <FolderKanbanIcon />
          </EmptyMedia>
          <EmptyTitle>{t('projects.empty.title')}</EmptyTitle>
          <EmptyDescription>{t('projects.empty.description')}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          {/* The page header already has the primary button, so use outline here: one primary button per view. */}
          <Button
            variant='outline'
            render={<Link to={{ pathname: 'new', search: location.search }} />}
            nativeButton={false}
          >
            <PlusIcon data-icon='inline-start' />
            {t('projects.create.action')}
          </Button>
        </EmptyContent>
      </Empty>
    );
  } else {
    content = (
      <ProjectsServerTable
        columns={columns}
        rows={rows}
        total={result?.total ?? 0}
        pagination={{ pageIndex: page - 1, pageSize }}
        pageSizeOptions={PAGE_SIZES}
        onPaginationChange={(next) => {
          updateParams((params) => {
            params.set('page', String(next.pageIndex + 1));
            params.set('pageSize', String(next.pageSize));
          });
        }}
        sorting={[columnSort]}
        onSortingChange={(next) => {
          const column = next.at(0);
          updateParams((params) => {
            if (column) params.set('sort', formatSort(column));
            else params.delete('sort');
            // A new order starts on the first page.
            params.delete('page');
          });
        }}
        // No results for the filters. Without filters an empty page only shows while a page past the end moves to the
        // last one, so it stays blank.
        emptyMessage={
          rowsFiltered ? (
            <div className='flex flex-col items-center gap-2'>
              <span>{t('projects.empty.noResults')}</span>
              <Button variant='link' size='sm' onClick={clearFilters}>
                {t('projects.filters.clear')}
              </Button>
            </div>
          ) : null
        }
      />
    );
  }

  // … the returned page, as in the list page
}
```

The component it renders:

```tsx
// client/pages/projects/projects-server-table.tsx
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import type { ReactElement, ReactNode } from 'react';

import { DataTablePagination } from '@/components/data-table/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { Project } from './types.js';

export interface ProjectsServerTableProps {
  readonly columns: ColumnDef<Project>[];
  /** The rows of the current page, as the endpoint returned them. */
  readonly rows: Project[];
  /** The number of matching records on all pages, from the endpoint. */
  readonly total: number;
  /** The page read from the URL; pageIndex starts at 0. */
  readonly pagination: PaginationState;
  /** Writes the new page to the URL; the list request follows the URL. */
  readonly onPaginationChange: (pagination: PaginationState) => void;
  /** The sort read from the URL, which the endpoint applied. */
  readonly sorting: SortingState;
  /** Writes the new sort to the URL; the list request follows the URL. */
  readonly onSortingChange: (sorting: SortingState) => void;
  /** Shown when the page has no rows, as DataTable's emptyMessage. */
  readonly emptyMessage: ReactNode;
  /** The rows-per-page choices; the list page accepts only these from the URL. */
  readonly pageSizeOptions: readonly number[];
}

/** The markup of DataTable, paginated and sorted by the server instead of the browser. */
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
}: ProjectsServerTableProps): ReactElement {
  // TanStack Table returns a mutable instance the React Compiler cannot memoize, as in `data-table/index.tsx`.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    // The server already paginated and sorted: no pagination or sorted row model, and the page count comes from
    // rowCount. Sorting one page in the browser would mislead, so the header only shows and changes the URL's sort.
    manualPagination: true,
    manualSorting: true,
    rowCount: total,
    state: { pagination, sorting },
    onPaginationChange: (updater) => {
      onPaginationChange(
        typeof updater === 'function' ? updater(pagination) : updater,
      );
    },
    onSortingChange: (updater) => {
      onSortingChange(
        typeof updater === 'function' ? updater(sorting) : updater,
      );
    },
  });
  const pageRows = table.getRowModel().rows;

  return (
    <div className='flex flex-col gap-4'>
      <div className='overflow-hidden rounded-lg border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {pageRows.length > 0 ? (
              pageRows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center text-muted-foreground'
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Reads the page index and page count from the table instance. */}
      <DataTablePagination
        table={table}
        pageSizeOptions={pageSizeOptions}
        showSelectedCount={false}
      />
    </div>
  );
}
```
