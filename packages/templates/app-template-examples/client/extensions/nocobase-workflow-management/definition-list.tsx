import type { ReactElement, ReactNode } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '#components/ui/button';
import { Empty, EmptyDescription } from '#components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';

export interface WorkflowDefinitionRow {
  id: string;
  name: string;
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
  onSort: () => void;
  onRefresh: () => void;
}

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
          <div className='overflow-hidden rounded-lg border bg-card'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/40 hover:bg-muted/40'>
                  <TableHead className='px-3 text-muted-foreground'>
                    {labels.workflow}
                  </TableHead>
                  <TableHead
                    className='px-3 text-right text-muted-foreground'
                    aria-sort={
                      sort
                        ? sort.ascending
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <Button
                      variant='ghost'
                      size='sm'
                      className='-mr-3 h-8'
                      title={labels.executionCount}
                      onClick={onSort}
                    >
                      {labels.executionActivity}
                      {sort && (sort.ascending ? <ArrowUp /> : <ArrowDown />)}
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell className='px-3'>
                      {workflow.title}
                      <p className='text-xs text-muted-foreground'>
                        {workflow.name}
                      </p>
                    </TableCell>
                    <TableCell className='px-3 text-right tabular-nums'>
                      {workflow.activity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
