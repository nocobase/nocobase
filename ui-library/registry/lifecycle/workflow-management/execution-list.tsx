import type { ReactElement, ReactNode } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '#components/ui/button';
import { Empty, EmptyDescription } from '#components/ui/empty';
import { DataTable } from '#components/data-table/data-table';

export interface WorkflowExecutionRow {
  id: string;
  record: ReactNode;
  workflow: ReactNode;
  state: ReactNode;
  createdAt: ReactNode;
}
export interface WorkflowExecutionListProps {
  rows: readonly WorkflowExecutionRow[];
  loaded: boolean;
  loading: boolean;
  filters: ReactNode;
  status?: ReactNode;
  empty: ReactNode;
  labels: {
    refresh: string;
    record: string;
    workflow: string;
    state: string;
    createdAt: string;
    previous: string;
    next: string;
  };
  order: 'newest' | 'oldest';
  onSort: () => void;
  onRefresh: () => void;
  pagination: ReactNode;
  previousDisabled: boolean;
  nextDisabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export function WorkflowExecutionList({
  rows,
  loaded,
  loading,
  filters,
  status,
  empty,
  labels,
  order,
  onSort,
  onRefresh,
  pagination,
  previousDisabled,
  nextDisabled,
  onPrevious,
  onNext,
}: WorkflowExecutionListProps): ReactElement {
  return (
    <section className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-wrap items-center gap-2'>{filters}</div>
        <Button variant='outline' disabled={loading} onClick={onRefresh}>
          {labels.refresh}
        </Button>
      </div>
      {status}
      <div className='bg-card'>
        <DataTable
          data={rows}
          getRowId={(row) => row.id}
          pagination={false}
          manualSorting
          sortingState={[{ id: 'createdAt', desc: order === 'newest' }]}
          loading={loading}
          emptyMessage={
            loaded ? (
              <Empty>
                <EmptyDescription>{empty}</EmptyDescription>
              </Empty>
            ) : (
              ''
            )
          }
          columns={[
            {
              id: 'record',
              header: labels.record,
              enableSorting: false,
              cell: ({ row }) => row.original.record,
            },
            {
              id: 'workflow',
              header: labels.workflow,
              enableSorting: false,
              cell: ({ row }) => row.original.workflow,
            },
            {
              id: 'state',
              header: labels.state,
              enableSorting: false,
              cell: ({ row }) => row.original.state,
            },
            {
              id: 'createdAt',
              accessorFn: (row) => row.createdAt,
              enableSorting: true,
              header: () => (
                <Button variant='ghost' size='sm' onClick={onSort}>
                  {labels.createdAt}
                  {order === 'newest' ? <ArrowDown /> : <ArrowUp />}
                </Button>
              ),
              cell: ({ row }) => row.original.createdAt,
            },
          ]}
        />
      </div>
      <div className='flex flex-wrap items-center justify-between gap-3 text-sm'>
        <p>{pagination}</p>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            disabled={previousDisabled}
            onClick={onPrevious}
          >
            {labels.previous}
          </Button>
          <Button variant='outline' disabled={nextDisabled} onClick={onNext}>
            {labels.next}
          </Button>
        </div>
      </div>
    </section>
  );
}
