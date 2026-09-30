import { useTranslation } from '@nocobase/i18n/client';
import type { Column, Table as TableInstance } from '@tanstack/react-table';
import { Settings2Icon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface DataTableViewOptionsProps<TData> {
  readonly table: TableInstance<TData>;
  readonly className?: string;
  /** Label for a column in the menu; defaults to the column id. */
  readonly getColumnLabel?: (column: Column<TData, unknown>) => ReactNode;
}

/**
 * A "View" menu that toggles the visibility of every hideable accessor column.
 * Render it from the `toolbar` of `DataTable`.
 */
export function DataTableViewOptions<TData>({
  table,
  className,
  getColumnLabel,
}: DataTableViewOptionsProps<TData>): ReactElement {
  const { t } = useTranslation();
  const columns = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== 'undefined' && column.getCanHide(),
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='outline'
            size='sm'
            className={cn('ml-auto hidden h-8 lg:flex', className)}
          />
        }
      >
        <Settings2Icon />
        {t('dataTable.view', { defaultValue: 'View' })}
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[150px]'>
        {/* The label names this group, and Base UI throws if it sits outside one. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {t('dataTable.toggleColumns', { defaultValue: 'Toggle columns' })}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {columns.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              className='capitalize'
              checked={column.getIsVisible()}
              onCheckedChange={(checked) => column.toggleVisibility(checked)}
            >
              {getColumnLabel ? getColumnLabel(column) : column.id}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
