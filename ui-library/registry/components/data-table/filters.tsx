import { useTranslation } from '@nocobase/i18n/client';
import { FilterIcon } from 'lucide-react';
import {
  createContext,
  useContext,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import { Button } from '#components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#components/ui/sheet';

/** Where `DataTable` renders its `filters`: inline on the toolbar row, or in the phone's filter sheet. */
const FilterPlacementContext = createContext<'inline' | 'sheet'>('inline');

export interface DataTableFilterProps {
  /** The filter's visible label in the phone sheet, such as "Status". */
  readonly label: ReactNode;
  /** The control, carrying its own accessible name for the inline row, where no label shows. */
  readonly children: ReactNode;
}

/**
 * One filter in `DataTable`'s `filters`. On the toolbar row from the `md` breakpoint up its control sits in a slot of 11rem
 * to 20rem (`w-full` controls fill it; a control with its own width, such as a `w-48` picker, keeps it);
 * on a phone the control sits in the bottom filter sheet at full width under its visible label. Only one of the two
 * is ever mounted, so a control may use fixed IDs.
 */
export function DataTableFilter({
  label,
  children,
}: DataTableFilterProps): ReactElement {
  const placement = useContext(FilterPlacementContext);
  // Inline, a filter takes a compact width of its own, so a control written `w-full` for a form or the sheet does not
  // take a whole row of the desktop toolbar.
  if (placement === 'inline')
    return (
      <div
        data-slot='data-table-filter'
        className='max-w-xs min-w-44 shrink-0 *:max-w-full'
      >
        {children}
      </div>
    );
  return (
    <div
      data-slot='data-table-filter'
      className='flex flex-col gap-2 [&>*:last-child]:w-full'
    >
      <span className='text-sm font-medium'>{label}</span>
      {children}
    </div>
  );
}

/** The desktop row of filters, beside the search box. */
export function DataTableInlineFilters({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  return (
    <FilterPlacementContext.Provider value='inline'>
      {children}
    </FilterPlacementContext.Provider>
  );
}

/**
 * The phone's filter entry (mobile.md M4.2): an outline icon "Filters" button on the search row, named and badged with
 * the number of applied filters, opening a bottom sheet with every filter under its label. Each control writes the
 * URL as it changes, as on desktop, so the sheet has no Apply button.
 */
export function DataTableFilterSheet({
  count,
  children,
}: {
  readonly count: number;
  readonly children: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const title = t('dataTable.filters', { defaultValue: 'Filters' });
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant='outline'
            size='icon'
            className='relative shrink-0'
            aria-label={
              count > 0
                ? t('dataTable.filtersApplied', {
                    count,
                    defaultValue: 'Filters · {{count}}',
                  })
                : title
            }
          />
        }
      >
        <FilterIcon />
        {count > 0 ? (
          <span
            aria-hidden='true'
            className='absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground tabular-nums'
          >
            {count}
          </span>
        ) : null}
      </SheetTrigger>
      <SheetContent side='bottom' className='max-h-[calc(100dvh-2rem)] gap-0'>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className='flex min-h-0 flex-col gap-4 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]'>
          <FilterPlacementContext.Provider value='sheet'>
            {children}
          </FilterPlacementContext.Provider>
        </div>
      </SheetContent>
    </Sheet>
  );
}
