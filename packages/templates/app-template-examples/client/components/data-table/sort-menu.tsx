import { useTranslation } from '@nocobase/i18n/client';
import type { Column, Table as TableInstance } from '@tanstack/react-table';
import { ArrowUpDownIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import { Button } from '#components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu';
import { cn } from 'cn';

export interface DataTableSortMenuProps<TData> {
  readonly table: TableInstance<TData>;
  readonly className?: string;
  /** Label for a sortable column in the menu; defaults to the column id. */
  readonly getColumnLabel?: (column: Column<TData, unknown>) => ReactNode;
}

/**
 * A "Sort" menu offering every sortable column in both directions, for the
 * card list `DataTable` shows on phones, where there are no column headers.
 * It drives the table's own sorting state, so a controlled `onSortingChange`
 * (and the URL it writes) behaves exactly as a header click does. Render it
 * from the `toolbar`, usually with `className='md:hidden'`.
 */
export function DataTableSortMenu<TData>({
  table,
  className,
  getColumnLabel,
}: DataTableSortMenuProps<TData>): ReactElement | null {
  const { t } = useTranslation();
  const columns = table.getAllColumns().filter((column) => column.getCanSort());
  if (columns.length === 0) return null;
  const [current] = table.getState().sorting;
  const value = current ? `${current.desc ? 'desc' : 'asc'}:${current.id}` : '';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='outline'
            size='sm'
            className={cn('h-8', className)}
          />
        }
      >
        <ArrowUpDownIcon />
        {t('dataTable.sort', { defaultValue: 'Sort' })}
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-auto min-w-40'>
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {t('dataTable.sortBy', { defaultValue: 'Sort by' })}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(next: string) => {
              const separator = next.indexOf(':');
              table.setSorting([
                {
                  id: next.slice(separator + 1),
                  desc: next.slice(0, separator) === 'desc',
                },
              ]);
            }}
          >
            {columns.flatMap((column) => {
              const label = getColumnLabel ? getColumnLabel(column) : column.id;
              return (['asc', 'desc'] as const).map((direction) => (
                <DropdownMenuRadioItem
                  key={`${direction}:${column.id}`}
                  value={`${direction}:${column.id}`}
                >
                  {label} ·{' '}
                  {direction === 'asc'
                    ? t('dataTable.sortAscending', { defaultValue: 'Asc' })
                    : t('dataTable.sortDescending', { defaultValue: 'Desc' })}
                </DropdownMenuRadioItem>
              ));
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
