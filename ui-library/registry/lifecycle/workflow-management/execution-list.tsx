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
      <div className='overflow-hidden rounded-lg border bg-card'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/40 hover:bg-muted/40'>
              <TableHead className='px-3 text-muted-foreground'>
                {labels.record}
              </TableHead>
              <TableHead className='px-3 text-muted-foreground'>
                {labels.workflow}
              </TableHead>
              <TableHead className='px-3 text-muted-foreground'>
                {labels.state}
              </TableHead>
              <TableHead
                className='px-3 text-muted-foreground'
                aria-sort={order === 'newest' ? 'descending' : 'ascending'}
              >
                <Button
                  variant='ghost'
                  size='sm'
                  className='-ml-3 h-8'
                  onClick={onSort}
                >
                  {labels.createdAt}
                  {order === 'newest' ? <ArrowDown /> : <ArrowUp />}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className='px-3'>{row.record}</TableCell>
                <TableCell className='px-3'>{row.workflow}</TableCell>
                <TableCell className='px-3'>{row.state}</TableCell>
                <TableCell className='px-3'>{row.createdAt}</TableCell>
              </TableRow>
            ))}
            {loaded && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Empty>
                    <EmptyDescription>{empty}</EmptyDescription>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
