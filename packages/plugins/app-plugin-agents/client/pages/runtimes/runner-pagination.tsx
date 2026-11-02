import type { ReactElement, ReactNode } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '../../components/ui/button.js';
import { Spinner } from '../../components/ui/spinner.js';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '../../components/ui/pagination.js';

export interface RunnerPaginationProps {
  readonly ariaLabel: string;
  readonly pageLabel: string;
  readonly previousLabel: string;
  readonly nextLabel: string;
  readonly canGoPrevious: boolean;
  readonly canGoNext: boolean;
  readonly nextLoading?: boolean;
  readonly summary?: ReactNode;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
}

export function RunnerPagination({
  ariaLabel,
  pageLabel,
  previousLabel,
  nextLabel,
  canGoPrevious,
  canGoNext,
  nextLoading = false,
  summary,
  onPrevious,
  onNext,
}: RunnerPaginationProps): ReactElement {
  return (
    <div className='mt-3 flex flex-wrap items-center justify-between gap-3 px-2'>
      {summary ?? <span aria-hidden='true' className='flex-1' />}
      <Pagination className='mx-0 w-auto' aria-label={ariaLabel}>
        <PaginationContent className='flex-wrap justify-end gap-2'>
          <PaginationItem>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={!canGoPrevious}
              onClick={onPrevious}
            >
              <ChevronLeftIcon data-icon='inline-start' />
              {previousLabel}
            </Button>
          </PaginationItem>
          <PaginationItem
            className='text-sm font-medium whitespace-nowrap tabular-nums'
            aria-current='page'
          >
            {pageLabel}
          </PaginationItem>
          <PaginationItem>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={!canGoNext}
              onClick={onNext}
            >
              {nextLoading ? <Spinner /> : null}
              {nextLabel}
              <ChevronRightIcon data-icon='inline-end' />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
