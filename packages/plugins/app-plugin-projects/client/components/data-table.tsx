import { useTranslation } from '@nocobase/i18n/client';
import {
  type ColumnDef,
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
import { type ReactElement, type ReactNode, useState } from 'react';

import { DataTablePagination } from './data-table-pagination.js';
import { DataTableVirtual } from './data-table-virtual.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table.js';
import { cn } from 'cn';

declare module '@tanstack/react-table' {
  // Column sizing without a second table API: a column may give its header and cells
  // a class, such as a fixed width or a capped, truncating title.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    readonly className?: string;
  }
}

export interface DataTableProps<TData, TValue = unknown> {
  readonly columns: ColumnDef<TData, TValue>[];
  readonly data: TData[];
  readonly className?: string;
  /**
   * Rendered above the table and handed the table instance, so filters and
   * `DataTableViewOptions` can read and drive its state.
   */
  readonly toolbar?: (table: TableInstance<TData>) => ReactNode;
  /** Shown in place of the body when no row survives filtering. */
  readonly emptyMessage?: ReactNode;
  /** Set to `false` to render every row and hide the pagination footer. */
  readonly pagination?: boolean;
  readonly pageSize?: number;
  readonly pageSizeOptions?: readonly number[];
  /** Set to `false` to hide the "n of m row(s) selected" summary, for tables without row selection. */
  readonly showSelectedCount?: boolean;
  readonly getRowId?: (
    row: TData,
    index: number,
    parent?: Row<TData>,
  ) => string;
  readonly onRowClick?: (row: Row<TData>) => void;
  /**
   * With `pagination={false}`, past this many rows the body is virtualized (`react-virtuoso`), rendering only the
   * rows on screen. The issue list sets 200.
   */
  readonly virtualizeAfter?: number;
  /**
   * Fill the parent's height (a flex column): the body scrolls inside the frame under a sticky header row, so the
   * page itself does not scroll. The parent must give the table a bounded height.
   */
  readonly fillHeight?: boolean;
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
  showSelectedCount = true,
  getRowId,
  onRowClick,
  virtualizeAfter,
  fillHeight = false,
}: DataTableProps<TData, TValue>): ReactElement {
  const { t } = useTranslation();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // TanStack Table hands back one mutable instance that the React Compiler
  // cannot memoize, so it skips compiling this component; the table is still
  // correct without it.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    initialState: { pagination: { pageSize } },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(pagination ? { getPaginationRowModel: getPaginationRowModel() } : {}),
  });

  const rows = table.getRowModel().rows;
  const virtualized =
    !pagination &&
    virtualizeAfter !== undefined &&
    rows.length > virtualizeAfter;

  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        fillHeight && 'min-h-0 flex-1',
        className,
      )}
    >
      {toolbar ? (
        <div className='flex items-center gap-2'>{toolbar(table)}</div>
      ) : null}
      {virtualized ? (
        <div
          className={cn(
            'rounded-lg border bg-card',
            fillHeight && 'min-h-0 flex-1 overflow-auto',
          )}
        >
          <DataTableVirtual table={table} onRowClick={onRowClick} />
        </div>
      ) : (
        // One table density for the whole application: a card-coloured frame, a quiet
        // 36px header row and 40px body rows.
        <div
          className={cn(
            'overflow-hidden rounded-lg border bg-card',
            // The primitive's own overflow container becomes the scroller, so the sticky header stays in view.
            fillHeight &&
              'min-h-0 flex-1 [&_[data-slot=table-container]]:h-full [&_[data-slot=table-container]]:overflow-auto',
          )}
        >
          <Table>
            <TableHeader
              className={
                fillHeight ? 'sticky top-0 z-10 bg-muted shadow-2xs' : undefined
              }
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className='bg-muted/40 hover:bg-muted/40'
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        'px-3 text-muted-foreground',
                        header.column.columnDef.meta?.className,
                      )}
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
            <TableBody>
              {rows.length > 0 ? (
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    className={onRowClick ? 'cursor-pointer' : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          'px-3',
                          cell.column.columnDef.meta?.className,
                        )}
                      >
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
                    {emptyMessage ??
                      t('dataTable.noResults', { defaultValue: 'No results.' })}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      {pagination ? (
        <DataTablePagination
          table={table}
          pageSizeOptions={pageSizeOptions}
          showSelectedCount={showSelectedCount}
        />
      ) : null}
    </div>
  );
}
