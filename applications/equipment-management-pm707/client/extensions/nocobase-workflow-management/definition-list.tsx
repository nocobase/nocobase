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

export interface WorkflowDefinitionRow {
  id: string;
  name?: string;
  title: ReactNode;
  activity: ReactNode;
}
export interface WorkflowDefinitionListProps {
  rows: readonly WorkflowDefinitionRow[];
  categories?: ReactNode;
  search: ReactNode;
  status?: ReactNode;
  loaded: boolean;
  loading: boolean;
  empty: ReactNode;
  labels: {
    refresh: string;
    workflow: string;
    executionCount: string;
    executionActivity: string;
  };
  sort?: { ascending: boolean };
  onSort?: () => void;
  onRefresh: () => void;
}

type DefinitionActivityMeta = ColumnMeta<WorkflowDefinitionRow, unknown> &
  Pick<WorkflowDefinitionListProps, 'labels' | 'sort' | 'onSort'>;

export function WorkflowDefinitionList({
  rows,
  categories,
  search,
  status,
  loaded,
  loading,
  empty,
  labels,
  sort,
  onSort,
  onRefresh,
}: WorkflowDefinitionListProps): ReactElement {
  const activityMeta: DefinitionActivityMeta = { labels, sort, onSort };
  return (
    <section className='flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:gap-4'>
      {categories !== undefined && (
        <aside className='w-full shrink-0 space-y-4 border-b pb-3 sm:w-48 sm:border-r sm:border-b-0 sm:pr-4 sm:pb-0'>
          {categories}
        </aside>
      )}
      <div className='flex w-full min-w-0 flex-1 flex-col gap-4'>
        <div className='flex flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-center'>
          <div className='min-w-0 flex-1 sm:max-w-xs'>{search}</div>
          <Button
            className='shrink-0 self-start sm:self-auto'
            variant='outline'
            disabled={loading}
            onClick={onRefresh}
          >
            {labels.refresh}
          </Button>
        </div>
        {status}
        {loaded && rows.length > 0 && (
          <div className='bg-card'>
            <DataTable
              data={rows}
              getRowId={(row) => row.id}
              pagination={false}
              manualSorting
              sortingState={
                sort ? [{ id: 'activity', desc: !sort.ascending }] : []
              }
              columns={[
                {
                  id: 'workflow',
                  header: labels.workflow,
                  enableSorting: false,
                  cell: DefinitionTitleCell,
                },
                {
                  id: 'activity',
                  accessorFn: (row) => row.activity,
                  enableSorting: Boolean(onSort),
                  meta: activityMeta,
                  header: DefinitionActivityHeader,
                  cell: DefinitionActivityCell,
                },
              ]}
            />
          </div>
        )}
        {loaded && rows.length === 0 && (
          <Empty>
            <EmptyDescription>{empty}</EmptyDescription>
          </Empty>
        )}
      </div>
    </section>
  );
}

// Stable renderer identities preserve mounted links and keyboard focus while
// the owning application refreshes rows, labels or sorting callbacks.
function DefinitionTitleCell({
  row,
}: CellContext<WorkflowDefinitionRow, unknown>) {
  return (
    <>
      {row.original.title}
      {row.original.name && row.original.name !== row.original.title && (
        <p className='text-xs text-muted-foreground'>{row.original.name}</p>
      )}
    </>
  );
}
function DefinitionActivityCell({
  row,
}: CellContext<WorkflowDefinitionRow, unknown>) {
  return <div className='text-right tabular-nums'>{row.original.activity}</div>;
}
function DefinitionActivityHeader({
  column,
}: HeaderContext<WorkflowDefinitionRow, unknown>) {
  const { labels, sort, onSort } = column.columnDef
    .meta as DefinitionActivityMeta;
  return (
    <div className='text-right'>
      {onSort ? (
        <Button
          variant='ghost'
          size='sm'
          title={labels.executionCount}
          onClick={onSort}
        >
          {labels.executionActivity}
          {sort && (sort.ascending ? <ArrowUp /> : <ArrowDown />)}
        </Button>
      ) : (
        <span>{labels.executionActivity}</span>
      )}
    </div>
  );
}
