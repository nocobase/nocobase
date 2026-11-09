import type { ListState } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { ListFeedback, ListFeedbackActions } from '#components/list-feedback';
import { RefreshIndicator } from '#components/loading';
import {
  type ColumnDef,
  type PaginationState,
  type OnChangeFn,
  type ColumnFiltersState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Table as TableInstance,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  type ReactElement,
  type ReactNode,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { DataTablePagination } from './pagination.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';
import { cn } from 'cn';

export interface DataTableProps<TData, TValue = unknown> {
  readonly columns: ColumnDef<TData, TValue>[];
  readonly data: readonly TData[];
  readonly manualPagination?: boolean;
  readonly rowCount?: number;
  readonly paginationState?: PaginationState;
  readonly onPaginationChange?: OnChangeFn<PaginationState>;
  readonly manualSorting?: boolean;
  readonly sortingState?: SortingState;
  readonly onSortingChange?: OnChangeFn<SortingState>;
  readonly showSelectedCount?: boolean;
  /**
   * The current request is in flight. With rows of the current query and permission scope this is a background
   * refresh: rows stay and a delayed refresh indicator appears. Without them the body shows the loading state.
   * Explicit false pauses loading feedback for an unresolved, inactive query; omitting it uses listState.
   */
  readonly loading?: boolean;
  /**
   * The current query's stable identity, such as its request path. When it
   * changes the loading and refresh feedback restart their display delay;
   * the table, its rows' geometry and its controls stay mounted.
   */
  readonly loadingIdentity?: unknown;
  readonly listState?: ListState;
  readonly onRetry?: () => void;
  readonly onClearFilters?: () => void;
  /**
   * The host's own search or filters are applied, such as `hasFilters` for a
   * list that filters through the URL. With `onClearFilters`, the toolbar then
   * shows "Clear filters" beside the page's controls while results are shown,
   * not only when nothing matched (mobile.md M4.2).
   */
  readonly filtered?: boolean;
  readonly emptyAction?: ReactNode;
  readonly className?: string;
  /**
   * Rendered above the table and handed the table instance, so filters and
   * `DataTableViewOptions` can read and drive its state.
   */
  readonly toolbar?: (table: TableInstance<TData>) => ReactNode;
  /** Shown in the table body when no row survives filtering. */
  readonly emptyMessage?: ReactNode;
  /** Set to `false` to render every row and hide the pagination footer. */
  readonly pagination?: boolean;
  readonly pageSize?: number;
  readonly pageSizeOptions?: readonly number[];
  readonly getRowId?: (
    row: TData,
    index: number,
    parent?: Row<TData>,
  ) => string;
  readonly onRowClick?: (row: Row<TData>) => void;
  /**
   * Renders one row as a compact card. When given, screens narrower than the
   * `md` breakpoint (768px) show the rows as a list of these cards instead of
   * table rows, keeping the same states, selection and pagination. Sorting has
   * no column headers there: render `DataTableSortMenu` in the toolbar. A card
   * opens its record through its own link or button; `onRowClick` applies to
   * table rows only.
   */
  readonly renderCard?: (row: Row<TData>) => ReactNode;
  /**
   * The id of the row selection column, `'select'` by default. Cards have no
   * header row, so on phones its header (the "select all on this page"
   * checkbox the page defines, with its own permission, disabled and
   * indeterminate states) renders above the cards with a visible label.
   */
  readonly selectionColumnId?: string;
  /**
   * The column ids the URL and the endpoint accept for sorting, such as the
   * `sortColumns` given to `useTableUrlState`, which passes this on when its
   * result is spread into the table. Every other column then offers no sort,
   * in its header or in `DataTableSortMenu`, so no control writes a sort the
   * list would ignore. Omit it to keep each column's own `enableSorting`.
   */
  readonly sortableColumns?: readonly string[];
}

/** The id TanStack Table gives a column definition. */
function columnId<TData, TValue>(
  column: ColumnDef<TData, TValue>,
): string | undefined {
  if (column.id) return column.id;
  if ('accessorKey' in column && typeof column.accessorKey === 'string')
    return column.accessorKey.replaceAll('.', '_');
  return typeof column.header === 'string' ? column.header : undefined;
}

function limitSorting<TData, TValue>(
  columns: readonly ColumnDef<TData, TValue>[],
  sortable: readonly string[],
): ColumnDef<TData, TValue>[] {
  return columns.map((column) => {
    const id = columnId(column);
    const limited = {
      ...column,
      enableSorting:
        column.enableSorting !== false &&
        id !== undefined &&
        sortable.includes(id),
    };
    return 'columns' in column && column.columns
      ? { ...limited, columns: limitSorting(column.columns, sortable) }
      : limited;
  });
}

/** Below the `md` breakpoint, the width `useIsMobile` and the sidebar also use. */
const PHONE_QUERY = '(max-width: 767px)';

function phoneMedia(): MediaQueryList | undefined {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function'
    ? window.matchMedia(PHONE_QUERY)
    : undefined;
}

/** Whether the viewport is phone-sized, read on the first render so a phone never flashes the table. */
function useIsPhone(enabled: boolean): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = enabled ? phoneMedia() : undefined;
      if (typeof media?.addEventListener !== 'function') return () => {};
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    [enabled],
  );
  return useSyncExternalStore(
    subscribe,
    () => enabled && phoneMedia()?.matches === true,
    () => false,
  );
}

/**
 * A table driven by TanStack Table with client-side sorting, filtering, column
 * visibility, row selection and pagination, composed from the shadcn `Table`
 * primitive the way the shadcn Data Table guide describes.
 *
 * Column definitions decide what each feature does: sort through
 * `DataTableColumnHeader`, filter from the `toolbar` with
 * `table.getColumn(id)?.setFilterValue(...)`, and select rows with a display
 * column that renders a `Checkbox`.
 */
export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  className,
  toolbar,
  emptyMessage,
  pagination = true,
  pageSize = 10,
  pageSizeOptions,
  getRowId,
  onRowClick,
  manualPagination = false,
  rowCount,
  paginationState,
  onPaginationChange,
  manualSorting = false,
  sortingState,
  onSortingChange,
  showSelectedCount = true,
  loading,
  loadingIdentity,
  listState,
  onRetry,
  onClearFilters,
  filtered = false,
  emptyAction,
  renderCard,
  selectionColumnId = 'select',
  sortableColumns,
}: DataTableProps<TData, TValue>): ReactElement {
  const { t } = useTranslation();
  const cards = useIsPhone(renderCard !== undefined) && renderCard;
  const tableData = useMemo(() => [...data], [data]);
  // Compare by content: hosts usually pass a new array literal on every render.
  const sortableKey = sortableColumns?.join('\u0000');
  const tableColumns = useMemo(
    () =>
      sortableKey === undefined
        ? columns
        : limitSorting(columns, sortableKey ? sortableKey.split('\u0000') : []),
    [columns, sortableKey],
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // TanStack Table hands back one mutable instance that the React Compiler
  // cannot memoize, so it skips compiling this component; the table is still
  // correct without it.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    manualPagination,
    // Controlled hosts own URL page resets and correction after writes.
    autoResetPageIndex: paginationState === undefined,
    rowCount,
    manualSorting,
    ...(onPaginationChange ? { onPaginationChange } : {}),
    getRowId,
    state: {
      sorting: sortingState ?? sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      ...(paginationState ? { pagination: paginationState } : {}),
    },
    initialState: { pagination: { pageSize } },
    onSortingChange: onSortingChange ?? setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    ...(!manualSorting ? { getSortedRowModel: getSortedRowModel() } : {}),
    getFilteredRowModel: getFilteredRowModel(),
    ...(pagination && !manualPagination
      ? { getPaginationRowModel: getPaginationRowModel() }
      : {}),
  });

  const rows = table.getRowModel().rows;
  const selectionHeader = cards
    ? table
        .getHeaderGroups()
        .at(-1)
        ?.headers.find(
          (header) =>
            header.column.id === selectionColumnId &&
            header.column.getIsVisible(),
        )
    : undefined;
  const requestedState =
    (listState === 'ready' && rows.length === 0
      ? columnFilters.length > 0
        ? 'no-results'
        : 'empty'
      : listState) ??
    (loading && data.length === 0
      ? 'loading'
      : rows.length
        ? 'ready'
        : columnFilters.length
          ? 'no-results'
          : 'empty');
  const state =
    (requestedState === 'empty' || requestedState === 'no-results') &&
    ((manualPagination && columnFilters.length === 0 && (rowCount ?? 0) > 0) ||
      (!manualPagination && table.getPrePaginationRowModel().rows.length > 0))
      ? 'loading'
      : requestedState;
  const clearFilters = () => {
    table.resetColumnFilters();
    table.setPageIndex(0);
    onClearFilters?.();
  };
  // The host's applied search or filters keep "Clear filters" beside its controls while rows show.
  const clearsWithResults = filtered && onClearFilters !== undefined;
  const hasStateActions =
    (state === 'no-results' &&
      (columnFilters.length > 0 || onClearFilters !== undefined)) ||
    (clearsWithResults &&
      state !== 'forbidden' &&
      state !== 'unauthenticated') ||
    ((state === 'failed' || state === 'refresh-failed') &&
      onRetry !== undefined) ||
    state === 'unauthenticated';
  const showRows =
    rows.length > 0 && (state === 'ready' || state === 'refresh-failed');
  const showFeedback = !showRows || state === 'refresh-failed';
  const feedbackColumnCount = Math.max(1, table.getVisibleLeafColumns().length);
  const showPagination =
    pagination &&
    (state === 'ready' || (state === 'refresh-failed' && rows.length > 0));
  // A new query hides the previous rows at once; keep their body and footer
  // geometry while it loads so the page below does not jump.
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const cardListRef = useRef<HTMLUListElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [reserved, setReserved] = useState<{
    readonly body: number;
    readonly footer: number;
  }>();
  if (!showRows && state !== 'loading' && reserved !== undefined)
    setReserved(undefined);
  useEffect(() => {
    const body = bodyRef.current ?? cardListRef.current;
    if (!showRows || !body || typeof ResizeObserver === 'undefined') return;
    const footer = footerRef.current;
    const observer = new ResizeObserver(() => {
      const next = {
        body: body.offsetHeight,
        footer: footer?.offsetHeight ?? 0,
      };
      setReserved((old) =>
        old?.body === next.body && old.footer === next.footer ? old : next,
      );
    });
    observer.observe(body);
    if (footer) observer.observe(footer);
    return () => observer.disconnect();
  }, [showRows, showPagination, cards]);
  const reserving = state === 'loading' && reserved !== undefined;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {toolbar || hasStateActions ? (
        <div className='flex flex-wrap items-center gap-2'>
          {toolbar?.(table)}
          <ListFeedbackActions
            state={state}
            onClear={
              columnFilters.length > 0 || onClearFilters
                ? clearFilters
                : undefined
            }
            filtered={clearsWithResults}
            onRetry={onRetry}
            busy={loading}
          />
        </div>
      ) : null}
      {cards ? (
        <div className='relative'>
          <RefreshIndicator
            pending={Boolean(loading && showRows && state !== 'refresh-failed')}
            identity={loadingIdentity}
          />
          {showFeedback ? (
            <div
              className='rounded-lg border'
              style={
                reserving && reserved.body > 0
                  ? { height: reserved.body }
                  : undefined
              }
            >
              {state !== 'loading' || loading !== false ? (
                <ListFeedback
                  state={state}
                  identity={loadingIdentity}
                  empty={emptyMessage}
                  emptyAction={emptyAction}
                />
              ) : null}
            </div>
          ) : null}
          {showRows && selectionHeader ? (
            // Select all on this page stays available without the table header (mobile.md M3.2).
            <label
              data-slot='data-table-card-select-all'
              className='mb-2 flex items-center gap-3 rounded-lg border px-4 py-2 text-sm'
            >
              {flexRender(
                selectionHeader.column.columnDef.header,
                selectionHeader.getContext(),
              )}
              {/* Visible and clickable, but not read out: the header checkbox carries its own name, and a label's text
                  would be added to it (Base UI names a checkbox by its enclosing label), reading it twice. */}
              <span aria-hidden='true'>
                {t('dataTable.selectPage', {
                  defaultValue: 'Select all on this page',
                })}
              </span>
            </label>
          ) : null}
          {showRows ? (
            <ul
              ref={cardListRef}
              aria-busy={loading}
              className={cn('flex flex-col gap-2', showFeedback && 'mt-2')}
            >
              {rows.map((row) => (
                <li
                  key={row.id}
                  data-slot='data-table-card'
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                >
                  {cards(row)}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <div className='relative overflow-hidden rounded-lg border'>
          {/* A retry after a refresh failure is announced by its own toolbar button. */}
          <RefreshIndicator
            pending={Boolean(loading && showRows && state !== 'refresh-failed')}
            identity={loadingIdentity}
          />
          {/* Only retained rows are busy; a loading body owns its own busy region and status. */}
          <Table aria-busy={loading && showRows}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      aria-sort={
                        header.column.getCanSort()
                          ? header.column.getIsSorted() === 'asc'
                            ? 'ascending'
                            : header.column.getIsSorted() === 'desc'
                              ? 'descending'
                              : 'none'
                          : undefined
                      }
                    >
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
            <TableBody ref={bodyRef}>
              {showFeedback ? (
                <TableRow>
                  <TableCell
                    colSpan={feedbackColumnCount}
                    className='p-0'
                    style={
                      reserving && reserved.body > 0
                        ? { height: reserved.body }
                        : undefined
                    }
                  >
                    {/* Readiness may stay unresolved while the parent query is paused. */}
                    {state !== 'loading' || loading !== false ? (
                      <ListFeedback
                        state={state}
                        identity={loadingIdentity}
                        empty={emptyMessage}
                        emptyAction={emptyAction}
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              ) : null}
              {showRows
                ? rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() ? 'selected' : undefined}
                      className={onRowClick ? 'cursor-pointer' : undefined}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
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
                : null}
            </TableBody>
          </Table>
        </div>
      )}
      {showPagination || (pagination && reserving) ? (
        <div ref={footerRef} data-slot='data-table-footer'>
          <DataTablePagination
            table={table}
            pageSizeOptions={pageSizeOptions}
            showSelectedCount={showSelectedCount}
            disabled={loading || !showPagination}
            countPending={!showPagination}
          />
        </div>
      ) : null}
    </div>
  );
}
