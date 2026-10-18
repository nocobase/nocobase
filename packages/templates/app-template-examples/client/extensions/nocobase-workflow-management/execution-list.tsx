import type { ReactElement, ReactNode } from 'react';
import type {
  CellContext,
  ColumnMeta,
  HeaderContext,
} from '@tanstack/react-table';
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

type ExecutionDateMeta = ColumnMeta<WorkflowExecutionRow, unknown> &
  Pick<WorkflowExecutionListProps, 'labels' | 'order' | 'onSort'>;

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
  const activityMeta: ExecutionDateMeta = { labels, order, onSort };
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
              cell: ExecutionRecordCell,
            },
            {
              id: 'workflow',
              header: labels.workflow,
              enableSorting: false,
              cell: ExecutionWorkflowCell,
            },
            {
              id: 'state',
              header: labels.state,
              enableSorting: false,
              cell: ExecutionStateCell,
            },
            {
              id: 'createdAt',
              accessorFn: (row) => row.createdAt,
              enableSorting: true,
              meta: activityMeta,
              header: ExecutionDateHeader,
              cell: ExecutionCreatedAtCell,
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

function ExecutionRecordCell({
  row,
}: CellContext<WorkflowExecutionRow, unknown>) {
  return row.original.record;
}

function ExecutionWorkflowCell({
  row,
}: CellContext<WorkflowExecutionRow, unknown>) {
  return row.original.workflow;
}

function ExecutionStateCell({
  row,
}: CellContext<WorkflowExecutionRow, unknown>) {
  return row.original.state;
}

function ExecutionCreatedAtCell({
  row,
}: CellContext<WorkflowExecutionRow, unknown>) {
  return row.original.createdAt;
}

function ExecutionDateHeader({
  column,
}: HeaderContext<WorkflowExecutionRow, unknown>) {
  const { labels, order, onSort } = column.columnDef.meta as ExecutionDateMeta;
  return (
    <Button variant='ghost' size='sm' onClick={onSort}>
      {labels.createdAt}
      {order === 'newest' ? <ArrowDown /> : <ArrowUp />}
    </Button>
  );
}
