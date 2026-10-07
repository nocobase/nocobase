import { useTranslation } from '@nocobase/i18n/client';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { type ComponentProps, type ReactElement, useState } from 'react';
import type { DateRange, Locale, PropsBase } from 'react-day-picker';

import { Button } from './ui/button.js';
import { Calendar } from './ui/calendar.js';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover.js';
import { cn } from 'cn';

interface DatePickerBaseProps {
  readonly id?: string;
  readonly className?: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  /** A `date-fns` locale, applied to both the trigger text and the calendar. */
  readonly locale?: Locale;
  /** `date-fns` format for the trigger text. */
  readonly formatString?: string;
  readonly align?: ComponentProps<typeof PopoverContent>['align'];
  /** Extra props for the `Calendar`, such as `captionLayout` or `disabled`. */
  readonly calendarProps?: Partial<PropsBase>;
}

export interface DatePickerProps extends DatePickerBaseProps {
  readonly value?: Date;
  readonly defaultValue?: Date;
  readonly onChange?: (date: Date | undefined) => void;
  /** Close the popover once a day is picked. Defaults to `true`. */
  readonly closeOnSelect?: boolean;
}

/**
 * A single-date picker built from `Popover`, `Button` and `Calendar`, the
 * composition the shadcn Date Picker guide describes. Works controlled with
 * `value` and `onChange`, or uncontrolled with `defaultValue`.
 */
export function DatePicker({
  id,
  className,
  placeholder,
  disabled,
  locale,
  formatString = 'PPP',
  align = 'start',
  calendarProps,
  value,
  defaultValue,
  onChange,
  closeOnSelect = true,
}: DatePickerProps): ReactElement {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<Date | undefined>(defaultValue);
  const selected = value ?? internal;

  const handleSelect = (date: Date | undefined): void => {
    setInternal(date);
    onChange?.(date);
    if (closeOnSelect) setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant='outline'
            disabled={disabled}
            data-empty={!selected}
            className={cn(
              'w-60 justify-start px-2.5 text-left font-normal data-[empty=true]:text-muted-foreground',
              className,
            )}
          />
        }
      >
        <CalendarIcon data-icon='inline-start' />
        {selected ? (
          format(selected, formatString, { locale })
        ) : (
          <span>
            {placeholder ??
              t('datePicker.placeholder', { defaultValue: 'Pick a date' })}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align={align}>
        <Calendar
          {...calendarProps}
          mode='single'
          locale={locale}
          selected={selected}
          defaultMonth={selected}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}

export interface DateRangePickerProps extends DatePickerBaseProps {
  readonly value?: DateRange;
  readonly defaultValue?: DateRange;
  readonly onChange?: (range: DateRange | undefined) => void;
  /** Close the popover once both ends of the range are picked. Defaults to `false`. */
  readonly closeOnSelect?: boolean;
  readonly numberOfMonths?: number;
}

/**
 * A date-range picker with the same composition as `DatePicker`, rendering two
 * months side by side by default.
 */
export function DateRangePicker({
  id,
  className,
  placeholder,
  disabled,
  locale,
  formatString = 'LLL dd, y',
  align = 'start',
  calendarProps,
  value,
  defaultValue,
  onChange,
  closeOnSelect = false,
  numberOfMonths = 2,
}: DateRangePickerProps): ReactElement {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<DateRange | undefined>(defaultValue);
  const selected = value ?? internal;

  const handleSelect = (range: DateRange | undefined): void => {
    setInternal(range);
    onChange?.(range);
    if (closeOnSelect && range?.from && range.to) setOpen(false);
  };

  const label = selected?.from
    ? selected.to
      ? `${format(selected.from, formatString, { locale })} - ${format(selected.to, formatString, { locale })}`
      : format(selected.from, formatString, { locale })
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant='outline'
            disabled={disabled}
            data-empty={!label}
            className={cn(
              'w-72 justify-start px-2.5 text-left font-normal data-[empty=true]:text-muted-foreground',
              className,
            )}
          />
        }
      >
        <CalendarIcon data-icon='inline-start' />
        {label ?? (
          <span>
            {placeholder ??
              t('datePicker.rangePlaceholder', {
                defaultValue: 'Pick a date range',
              })}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align={align}>
        <Calendar
          {...calendarProps}
          mode='range'
          locale={locale}
          selected={selected}
          defaultMonth={selected?.from}
          numberOfMonths={numberOfMonths}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}
