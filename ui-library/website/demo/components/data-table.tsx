import type { ColumnDef } from '@tanstack/react-table';
import type { ReactElement } from 'react';

import { Input } from '@/components/ui/input';

import { DataTable } from '../../../registry/components/data-table';
import { DataTableColumnHeader } from '../../../registry/components/data-table/column-header';
import { DataTableViewOptions } from '../../../registry/components/data-table/view-options';

interface Order {
  readonly id: string;
  readonly customer: string;
  readonly status: string;
  readonly total: number;
}

const customers = ['Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Hooli'];
const statuses = ['Paid', 'Awaiting payment', 'Shipped', 'Refunded'];

// Module scope keeps `data` the same array across renders; a new one each render would reset the page.
const orders: Order[] = Array.from({ length: 24 }, (_, index) => ({
  id: `SO-${1040 + index}`,
  customer: customers[index % customers.length] ?? 'Acme Corp',
  status: statuses[(index * 3) % statuses.length] ?? 'Paid',
  total: 80 + ((index * 137) % 1200),
}));

/** What `DataTableViewOptions` shows for each hideable column instead of its id. */
const columnLabels: Readonly<Record<string, string>> = {
  customer: 'Customer',
  status: 'Status',
  total: 'Total',
};

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Order' />
    ),
    enableHiding: false,
  },
  {
    accessorKey: 'customer',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Customer' />
    ),
  },
  { accessorKey: 'status', header: 'Status' },
  {
    accessorKey: 'total',
    header: ({ column }) => (
      <DataTableColumnHeader
        className='justify-end'
        column={column}
        title='Total'
      />
    ),
    cell: ({ row }) => (
      <div className='text-right tabular-nums'>
        {currency.format(row.original.total)}
      </div>
    ),
  },
];

/** A client-side list: sortable headers, a filter and the view menu in the toolbar, and the pagination footer. */
export function DataTableDemo(): ReactElement {
  return (
    <div className='min-h-svh bg-background p-6 text-foreground md:p-8'>
      <DataTable
        columns={columns}
        data={orders}
        showSelectedCount={false}
        toolbar={(table) => (
          <>
            <Input
              aria-label='Filter customers'
              className='max-w-xs'
              onChange={(event) =>
                table.getColumn('customer')?.setFilterValue(event.target.value)
              }
              placeholder='Filter customers…'
              value={
                (table.getColumn('customer')?.getFilterValue() as
                  string | undefined) ?? ''
              }
            />
            <DataTableViewOptions
              getColumnLabel={(column) => columnLabels[column.id] ?? column.id}
              table={table}
            />
          </>
        )}
      />
    </div>
  );
}
