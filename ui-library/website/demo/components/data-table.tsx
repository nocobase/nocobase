import type { ReactElement } from 'react';
import { DataTable } from '#components/data-table/data-table';
import { DataTableColumnHeader } from '#components/data-table/column-header';

interface Expense {
  readonly id: string;
  readonly title: string;
  readonly amount: number;
}
const rows: readonly Expense[] = [
  { id: 'BX-001', title: 'Office supplies', amount: 260 },
  { id: 'BX-002', title: 'Travel', amount: 5600 },
  { id: 'BX-003', title: 'Team lunch', amount: 480 },
];
/** Static sample data only; production pages supply authorized API results. */
export function DataTableDemo(): ReactElement {
  return (
    <div className='flex flex-col gap-4 p-6'>
      <h1 className='text-base font-medium'>Expenses</h1>
      <DataTable
        data={rows}
        getRowId={(row) => row.id}
        columns={[
          { accessorKey: 'id', header: 'Number' },
          {
            accessorKey: 'title',
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title='Expense' />
            ),
          },
          {
            accessorKey: 'amount',
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title='Amount' />
            ),
            cell: ({ row }) => (
              <div className='text-right tabular-nums'>
                {row.original.amount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
