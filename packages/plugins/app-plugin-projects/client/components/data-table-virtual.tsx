import {
  type Row,
  type Table as TableInstance,
  flexRender,
} from '@tanstack/react-table';
import { type ReactElement, useState } from 'react';
import {
  type ContextProp,
  type ItemProps,
  type TableProps,
  TableVirtuoso,
} from 'react-virtuoso';

import { cn } from 'cn';

import { findScrollParent } from './pm-scroll-parent.js';

interface VirtualContext {
  /** Clicks by row index, so the stable row component needs no row type. */
  readonly onRowClick?: (index: number) => void;
}

// Stable components: TableVirtuoso remounts rows whenever these identities change.
function VirtualTable({ style, children }: TableProps): ReactElement {
  return (
    <table
      data-slot='table'
      style={style}
      className='w-full caption-bottom text-sm'
    >
      {children}
    </table>
  );
}

function VirtualRow({
  style,
  children,
  context,
  ...data
}: ItemProps<unknown> & ContextProp<VirtualContext>): ReactElement {
  const index = data['data-index'];
  const onRowClick = context.onRowClick;
  return (
    <tr
      data-slot='table-row'
      data-index={data['data-index']}
      data-known-size={data['data-known-size']}
      style={style}
      className={cn(
        'border-b transition-colors hover:bg-muted/50',
        onRowClick && 'cursor-pointer',
      )}
      onClick={onRowClick ? () => onRowClick(index) : undefined}
    >
      {children}
    </tr>
  );
}

/**
 * The body of `DataTable` past its `virtualizeAfter` threshold: the same header and cells, rendered by
 * `react-virtuoso`'s `TableVirtuoso` against the nearest scrolling ancestor, so a few thousand issues scroll without
 * rendering every row.
 */
export function DataTableVirtual<TData>({
  table,
  onRowClick,
}: {
  readonly table: TableInstance<TData>;
  readonly onRowClick?: (row: Row<TData>) => void;
}): ReactElement {
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null);
  const rows = table.getRowModel().rows;
  const scrollParent = anchor ? findScrollParent(anchor) : null;
  const context: VirtualContext = {
    onRowClick: onRowClick
      ? (index) => {
          const row = rows[index];
          if (row) onRowClick(row);
        }
      : undefined,
  };
  return (
    <div ref={setAnchor} data-virtualized='' className='relative w-full'>
      {anchor ? (
        <TableVirtuoso
          data={rows}
          context={context}
          customScrollParent={scrollParent ?? undefined}
          useWindowScroll={!scrollParent}
          increaseViewportBy={600}
          computeItemKey={(_, row) => row.id}
          components={{ Table: VirtualTable, TableRow: VirtualRow }}
          fixedHeaderContent={() =>
            table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className='border-b bg-muted'>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className='h-10 px-3 text-left align-middle font-medium whitespace-nowrap text-muted-foreground'
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))
          }
          itemContent={(_, row) =>
            row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className='p-2 px-3 align-middle whitespace-nowrap'
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))
          }
        />
      ) : null}
    </div>
  );
}
