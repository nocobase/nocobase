import { useTranslation } from '@nocobase/i18n/client';
import type { Column, SortDirection } from '@tanstack/react-table';
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from 'lucide-react';
import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react';

import { Button } from './ui/button.js';
import { cn } from 'cn';

export interface DataTableColumnHeaderProps<TData, TValue> extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'title'
> {
  readonly column: Column<TData, TValue>;
  readonly title: ReactNode;
}

function SortIcon({
  direction,
}: {
  readonly direction: SortDirection | false;
}): ReactElement {
  if (direction === 'desc') return <ArrowDownIcon />;
  if (direction === 'asc') return <ArrowUpIcon />;
  return <ChevronsUpDownIcon />;
}

/**
 * A sortable column header: clicking it cycles ascending → descending → unsorted and
 * the icon shows the current state. There is no menu on the header; hiding columns lives in `DataTableViewOptions`.
 * Use it as the `header` of a column definition:
 * `header: ({ column }) => <DataTableColumnHeader column={column} title='Email' />`.
 */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>): ReactElement {
  const { t } = useTranslation();

  if (!column.getCanSort()) {
    return (
      <div className={cn(className)} {...props}>
        {title}
      </div>
    );
  }

  const direction = column.getIsSorted();
  function cycle(): void {
    if (direction === false) column.toggleSorting(false);
    else if (direction === 'asc') column.toggleSorting(true);
    else column.clearSorting();
  }

  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      <Button
        variant='ghost'
        size='sm'
        className={cn(
          '-ml-2.5 h-8 px-2.5 font-medium',
          direction ? 'text-foreground' : 'text-muted-foreground',
        )}
        data-sort={direction || 'none'}
        title={
          direction === 'asc'
            ? t('dataTable.sortAscending', { defaultValue: 'Asc' })
            : direction === 'desc'
              ? t('dataTable.sortDescending', { defaultValue: 'Desc' })
              : undefined
        }
        onClick={cycle}
      >
        <span>{title}</span>
        <SortIcon direction={direction} />
      </Button>
    </div>
  );
}
