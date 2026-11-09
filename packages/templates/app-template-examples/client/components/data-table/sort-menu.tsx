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
  /**
   * An icon button named "Sort" instead of a labelled one, to share the search box's row on a phone. A dot marks an
   * applied sort.
   */
  readonly compact?: boolean;
  /**
   * The translated label of a sortable column, as its header shows it. Required:
   * a column id is not a label, in any language.
   */
  readonly getColumnLabel: (column: Column<TData, unknown>) => ReactNode;
}

/**
 * A "Sort" menu offering every sortable column in both directions, for the
 * card list `DataTable` shows on phones, where there are no column headers.
 * It drives the table's own sorting state, so a controlled `onSortingChange`
 * (and the URL it writes) behaves exactly as a header click does. A column is
 * sortable when the table allows it: `DataTable`'s `sortableColumns` (spread
 * from `useTableUrlState`) leaves only the columns the URL accepts. `DataTable`
 * renders it for its phone cards by itself when given `getColumnLabel`;
 * render it directly only for a list outside `DataTable`.
 */
export function DataTableSortMenu<TData>({
  table,
  className,
  compact = false,
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
          compact ? (
            <Button
              variant='outline'
              size='icon'
              aria-label={t('dataTable.sort', { defaultValue: 'Sort' })}
              className={cn('relative shrink-0', className)}
            />
          ) : (
            <Button
              variant='outline'
              size='sm'
              className={cn('h-8', className)}
            />
          )
        }
      >
        <ArrowUpDownIcon />
        {compact ? (
          current ? (
            <span
              aria-hidden='true'
              className='absolute top-1 right-1 size-1.5 rounded-full bg-primary'
            />
          ) : null
        ) : (
          t('dataTable.sort', { defaultValue: 'Sort' })
        )}
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
              const label = getColumnLabel(column);
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
