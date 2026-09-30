import { useTranslation } from '@nocobase/i18n/client';
import type { Column, SortDirection } from '@tanstack/react-table';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  EyeOffIcon,
} from 'lucide-react';
import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

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
 * A column header that opens a menu for sorting and hiding the column. Use it
 * as the `header` of a column definition:
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

  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant='ghost' size='sm' className='-ml-3 h-8' />}
        >
          <span>{title}</span>
          <SortIcon direction={column.getIsSorted()} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start'>
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUpIcon />
            {t('dataTable.sortAscending', { defaultValue: 'Asc' })}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDownIcon />
            {t('dataTable.sortDescending', { defaultValue: 'Desc' })}
          </DropdownMenuItem>
          {column.getCanHide() ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                <EyeOffIcon />
                {t('dataTable.hideColumn', { defaultValue: 'Hide' })}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
