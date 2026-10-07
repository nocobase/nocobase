import { useTranslation } from '@nocobase/i18n/client';
import type { Table as TableInstance } from '@tanstack/react-table';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react';
import type { ComponentPropsWithoutRef, ReactElement } from 'react';

import { Button } from './ui/button.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.js';
import { cn } from 'cn';

export interface DataTablePaginationProps<
  TData,
> extends ComponentPropsWithoutRef<'div'> {
  readonly table: TableInstance<TData>;
  readonly pageSizeOptions?: readonly number[];
  /** Hide the "n of m selected" summary for tables without row selection. */
  readonly showSelectedCount?: boolean;
}

const DEFAULT_PAGE_SIZE_OPTIONS: readonly number[] = [10, 20, 30, 40, 50];

/**
 * Pagination controls for a TanStack table: selected-row summary, page size,
 * current page, and first/previous/next/last buttons. `DataTable` renders it
 * for you; use it directly when composing a table by hand.
 */
export function DataTablePagination<TData>({
  table,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  showSelectedCount = true,
  className,
  ...props
}: DataTablePaginationProps<TData>): ReactElement {
  const { t } = useTranslation();
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = Math.max(table.getPageCount(), 1);
  const selected = table.getFilteredSelectedRowModel().rows.length;
  const total = table.getFilteredRowModel().rows.length;
  const options = pageSizeOptions.includes(pageSize)
    ? pageSizeOptions
    : [...pageSizeOptions, pageSize].sort((a, b) => a - b);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 px-2',
        className,
      )}
      {...props}
    >
      <div className='flex-1 text-sm text-muted-foreground'>
        {showSelectedCount
          ? t('dataTable.selectedCount', {
              defaultValue: '{{selected}} of {{total}} row(s) selected.',
              selected,
              total,
            })
          : null}
      </div>
      <div className='flex flex-wrap items-center gap-6 lg:gap-8'>
        <div className='flex items-center gap-2'>
          <p className='text-sm font-medium'>
            {t('dataTable.rowsPerPage', { defaultValue: 'Rows per page' })}
          </p>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              if (value) table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger
              size='sm'
              className='w-[70px]'
              aria-label={t('dataTable.rowsPerPage', {
                defaultValue: 'Rows per page',
              })}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              side='top'
              className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'
            >
              {options.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex w-[100px] items-center justify-center text-sm font-medium'>
          {t('dataTable.pageOf', {
            defaultValue: 'Page {{page}} of {{pageCount}}',
            page: pageIndex + 1,
            pageCount,
          })}
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='icon-sm'
            className='hidden lg:flex'
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className='sr-only'>
              {t('dataTable.firstPage', { defaultValue: 'Go to first page' })}
            </span>
            <ChevronsLeftIcon />
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className='sr-only'>
              {t('dataTable.previousPage', {
                defaultValue: 'Go to previous page',
              })}
            </span>
            <ChevronLeftIcon />
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className='sr-only'>
              {t('dataTable.nextPage', { defaultValue: 'Go to next page' })}
            </span>
            <ChevronRightIcon />
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            className='hidden lg:flex'
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className='sr-only'>
              {t('dataTable.lastPage', { defaultValue: 'Go to last page' })}
            </span>
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
