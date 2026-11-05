import { useMemo, useState, type ReactElement } from 'react';
import { resolveListState } from '@nocobase/app-client';
import { Button } from '#components/ui/button';
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
      <h1 className='text-base font-medium'>Invoices</h1>
      <RequestLifecycleTable />
      <h2 className='text-base font-medium'>Expenses</h2>
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

const PAGE_SIZE = 3;
const ledger = Array.from({ length: 9 }, (_, index) => ({
  id: `INV-${String(index + 1).padStart(3, '0')}`,
  title: ['Hosting', 'Licenses', 'Courier'][index % 3],
  amount: 120 * (index + 1),
}));

/**
 * Drives the table from an explicit request lifecycle: each request stays in
 * flight until Complete or Fail is pressed, so nothing finishes on a timer.
 */
function RequestLifecycleTable(): ReactElement {
  const [loaded, setLoaded] = useState(0);
  const [requested, setRequested] = useState(0);
  const [pending, setPending] = useState(true);
  const [failed, setFailed] = useState(false);
  const [everLoaded, setEverLoaded] = useState(false);
  const current = everLoaded && requested === loaded;
  const rows = useMemo(
    () => ledger.slice(loaded * PAGE_SIZE, (loaded + 1) * PAGE_SIZE),
    [loaded],
  );
  const listState = resolveListState(
    {
      data: current ? rows : undefined,
      error: failed ? new Error('Request failed') : undefined,
      isPending: pending && !current,
    },
    current ? rows.length : 0,
  );
  return (
    <section aria-label='Invoices' className='flex flex-col gap-3'>
      <div className='flex flex-wrap gap-2'>
        <Button
          variant='outline'
          disabled={pending || !current}
          onClick={() => setPending(true)}
        >
          Refresh same page
        </Button>
        <Button
          disabled={!pending}
          onClick={() => {
            setLoaded(requested);
            setEverLoaded(true);
            setPending(false);
            setFailed(false);
          }}
        >
          Complete request
        </Button>
        <Button
          variant='destructive'
          disabled={!pending}
          onClick={() => {
            setPending(false);
            setFailed(true);
          }}
        >
          Fail request
        </Button>
      </div>
      <DataTable
        data={rows}
        getRowId={(row) => row.id}
        columns={[
          { accessorKey: 'id', header: 'Invoice' },
          { accessorKey: 'title', header: 'Item' },
          {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => (
              <div className='text-right tabular-nums'>
                {row.original.amount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </div>
            ),
          },
        ]}
        manualPagination
        rowCount={ledger.length}
        paginationState={{ pageIndex: requested, pageSize: PAGE_SIZE }}
        onPaginationChange={(update) => {
          const next =
            typeof update === 'function'
              ? update({ pageIndex: requested, pageSize: PAGE_SIZE })
              : update;
          setRequested(next.pageIndex);
          setPending(true);
          setFailed(false);
        }}
        pageSizeOptions={[PAGE_SIZE]}
        showSelectedCount={false}
        loading={pending}
        listState={listState}
        onRetry={() => setPending(true)}
      />
    </section>
  );
}
