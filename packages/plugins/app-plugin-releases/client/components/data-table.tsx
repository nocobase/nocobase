/**
 * The table every list of this plugin uses, drawn the way the application's other lists are (the projects plugin's
 * `DataTable`): a card-coloured frame, a quiet header row that stays in view while the body scrolls, and column widths
 * from each column's `meta.className`. Rows are the server's, in its order; there is no client paging or sorting.
 */
import {
  type ColumnDef,
  type Row,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { ReactElement, ReactNode } from 'react';

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
  // A column may give its header and cells a class, such as a fixed width or a truncating cell.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    readonly className?: string;
  }
}

export interface DataTableProps<TData> {
  readonly columns: ColumnDef<TData, unknown>[];
  readonly data: readonly TData[];
  readonly getRowId: (row: TData) => string;
  /** Shown in place of the body when there are no rows. */
  readonly emptyMessage?: ReactNode;
  readonly onRowClick?: (row: Row<TData>) => void;
  /** A long list stops at 28rem and its body scrolls under the sticky header. */
  readonly scroll?: boolean;
  readonly className?: string;
  /** Under a row: its expanded content, such as a deployment's logs, across every column. */
  readonly renderBelow?: (row: TData) => ReactNode;
}

export function DataTable<TData>({
  columns,
  data,
  getRowId,
  emptyMessage,
  onRowClick,
  scroll = false,
  className,
  renderBelow,
}: DataTableProps<TData>): ReactElement {
  // TanStack Table hands back one mutable instance the React Compiler cannot memoize; the table is correct without.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data as TData[],
    columns,
    getRowId: (row) => getRowId(row),
    getCoreRowModel: getCoreRowModel(),
  });
  const rows = table.getRowModel().rows;
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border bg-card',
        scroll &&
          '[&_[data-slot=table-container]]:max-h-[28rem] [&_[data-slot=table-container]]:overflow-auto',
        className,
      )}
    >
      <Table>
        <TableHeader className='sticky top-0 z-10 bg-muted shadow-2xs'>
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
            rows.flatMap((row) => {
              const below = renderBelow?.(row.original);
              return [
                <TableRow
                  key={row.id}
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
                </TableRow>,
                below ? (
                  <TableRow
                    key={`${row.id}:below`}
                    className='hover:bg-transparent'
                  >
                    <TableCell colSpan={columns.length} className='px-3'>
                      {below}
                    </TableCell>
                  </TableRow>
                ) : null,
              ];
            })
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
  );
}
