import type { ReactElement } from 'react';
import { DayPicker, type DayPickerProps } from 'react-day-picker';

export interface CalendarProps {
  readonly locale?: DayPickerProps['locale'];
  readonly selected?: Date;
  readonly onSelect: (date: Date | undefined) => void;
}

export function Calendar({
  locale,
  selected,
  onSelect,
}: CalendarProps): ReactElement {
  return (
    <DayPicker
      mode='single'
      locale={locale}
      selected={selected}
      onSelect={onSelect}
      showOutsideDays
      className='w-fit p-1 text-sm'
      classNames={{
        months: 'relative flex flex-col gap-4',
        month: 'relative flex w-full flex-col gap-4',
        month_caption:
          'flex h-8 w-full items-center justify-center px-8 font-medium',
        nav: 'absolute inset-x-0 top-0 z-10 flex h-8 w-full items-center justify-between px-1',
        button_previous:
          'inline-flex size-8 items-center justify-center rounded-md hover:bg-muted',
        button_next:
          'inline-flex size-8 items-center justify-center rounded-md hover:bg-muted',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday:
          'w-9 rounded-md text-center text-xs font-normal text-muted-foreground',
        week: 'mt-1 flex w-full',
        day: 'size-9 p-0 text-center',
        day_button:
          'inline-flex size-9 items-center justify-center rounded-md text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected:
          '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary',
        today: '[&>button]:bg-accent [&>button]:text-accent-foreground',
        outside: '[&>button]:text-muted-foreground/50',
        disabled: '[&>button]:opacity-50',
      }}
    />
  );
}
