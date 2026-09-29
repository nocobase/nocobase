import { useTranslation } from '@nocobase/i18n/client';
import { format } from 'date-fns';
import type { Locale } from 'date-fns';
import { Clock2Icon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';

import { DatePicker } from './date-picker.js';

const DEFAULT_START_TIME = '09:00';
const DEFAULT_END_TIME = '10:00';

/** A start and an end on the same day, both to the minute. */
export interface DateTimeRange {
  readonly start: Date;
  readonly end: Date;
}

interface DateTimePickerBaseProps {
  readonly id?: string;
  readonly className?: string;
  /** A `date-fns` locale for the calendar and the trigger text, like `DatePicker`. */
  readonly locale?: Locale;
  readonly placeholder?: string;
  readonly disabled?: boolean;
}

export interface DateTimePickerSingleProps extends DateTimePickerBaseProps {
  readonly mode?: 'single';
  readonly value?: Date;
  readonly onChange?: (date: Date | undefined) => void;
}

export interface DateTimePickerRangeProps extends DateTimePickerBaseProps {
  readonly mode: 'range';
  /** Both ends fall on the day the calendar selects; a new day replaces both. */
  readonly value?: DateTimeRange;
  readonly onChange?: (range: DateTimeRange | undefined) => void;
}

export type DateTimePickerProps =
  DateTimePickerSingleProps | DateTimePickerRangeProps;

/**
 * A date-and-time picker: the shared `DatePicker` with the time fields from the shadcn Calendar "With Time" example
 * in its footer (`InputGroup` with a clock icon, the browser's own picker indicator hidden). The value keeps the
 * picker's trigger, calendar and popover behavior instead of reimplementing them.
 *
 * `mode='single'`, the default, returns one moment: a day and a time. `mode='range'` returns a `DateTimeRange`, a
 * start and an end on the day the calendar selects, for a time window inside one day. Either way the value keeps the
 * minute: whichever end changes, seconds are dropped.
 */
export function DateTimePicker(props: DateTimePickerProps): ReactElement {
  if (props.mode === 'range') {
    return <DateTimeRangePicker {...props} />;
  }
  return <SingleDateTimePicker {...props} />;
}

function SingleDateTimePicker({
  id,
  className,
  value,
  onChange,
  locale,
  placeholder,
  disabled,
}: DateTimePickerSingleProps): ReactElement {
  const { t } = useTranslation();
  const timeValue = value ? formatTime(value) : DEFAULT_START_TIME;

  function setDay(day: Date | undefined): void {
    if (!day) {
      onChange?.(undefined);
      return;
    }
    onChange?.(withTime(day, timeValue));
  }

  function setTime(next: string): void {
    if (!next) return;
    onChange?.(withTime(value ?? new Date(), next));
  }

  return (
    <DatePicker
      id={id}
      className={className}
      locale={locale}
      placeholder={placeholder}
      disabled={disabled}
      // Date and time together: the popover stays open until the footer's confirm button closes it.
      formatString='PPP p'
      closeOnSelect={false}
      value={value}
      onChange={setDay}
      footer={(close) => (
        <div className='flex flex-col gap-3 border-t p-3'>
          <TimeField
            id={id ? `${id}-time` : undefined}
            label={t('dateTimePicker.time', { defaultValue: 'Time' })}
            onTimeChange={setTime}
            time={timeValue}
          />
          <FooterButtons
            onClear={() => {
              onChange?.(undefined);
              close();
            }}
            onConfirm={close}
          />
        </div>
      )}
    />
  );
}

function DateTimeRangePicker({
  id,
  className,
  value,
  onChange,
  locale,
  placeholder,
  disabled,
}: DateTimePickerRangeProps): ReactElement {
  const { t } = useTranslation();
  const startTime = value ? formatTime(value.start) : DEFAULT_START_TIME;
  const endTime = value ? formatTime(value.end) : DEFAULT_END_TIME;
  const label = value
    ? `${format(value.start, 'PPP', { locale })} ${format(value.start, 'p', { locale })} - ${format(value.end, 'p', { locale })}`
    : undefined;

  function setDay(day: Date | undefined): void {
    if (!day) {
      onChange?.(undefined);
      return;
    }
    onChange?.({
      start: withTime(day, startTime),
      end: withTime(day, endTime),
    });
  }

  function setStartTime(next: string): void {
    if (!next) return;
    const day = value?.start ?? new Date();
    const start = withTime(day, next);
    const end = value ? value.end : withTime(day, endTime);
    // The two ends stay ordered: moving the start past the end carries the end along.
    onChange?.(start > end ? { start, end: start } : { start, end });
  }

  function setEndTime(next: string): void {
    if (!next) return;
    const day = value?.start ?? new Date();
    const start = value ? value.start : withTime(day, startTime);
    const end = withTime(day, next);
    // And moving the end before the start pulls the start back.
    onChange?.(end < start ? { start: end, end } : { start, end });
  }

  return (
    <DatePicker
      id={id}
      className={className}
      locale={locale}
      placeholder={placeholder}
      disabled={disabled}
      // The day comes from the calendar; the label shows it once with both times.
      formatString='PPP p'
      triggerLabel={label}
      closeOnSelect={false}
      value={value?.start}
      onChange={setDay}
      footer={(close) => (
        <div className='flex flex-col gap-3 border-t p-3'>
          <TimeField
            id={id ? `${id}-start-time` : undefined}
            label={t('dateTimePicker.startTime', {
              defaultValue: 'Start Time',
            })}
            onTimeChange={setStartTime}
            time={startTime}
          />
          <TimeField
            id={id ? `${id}-end-time` : undefined}
            label={t('dateTimePicker.endTime', { defaultValue: 'End Time' })}
            onTimeChange={setEndTime}
            time={endTime}
          />
          <FooterButtons
            onClear={() => {
              onChange?.(undefined);
              close();
            }}
            onConfirm={close}
          />
        </div>
      )}
    />
  );
}

function TimeField({
  id,
  label,
  onTimeChange,
  time,
}: {
  readonly id?: string;
  readonly label: string;
  readonly onTimeChange: (time: string) => void;
  readonly time: string;
}): ReactElement {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          type='time'
          value={time}
          onChange={(event) => onTimeChange(event.target.value)}
          className='appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
        />
        <InputGroupAddon>
          <Clock2Icon className='text-muted-foreground' />
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}

function FooterButtons({
  onClear,
  onConfirm,
}: {
  readonly onClear: () => void;
  readonly onConfirm: () => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div className='flex gap-2'>
      <Button variant='ghost' size='sm' className='flex-1' onClick={onClear}>
        {t('dateTimePicker.clear', { defaultValue: 'Clear' })}
      </Button>
      <Button
        variant='outline'
        size='sm'
        className='flex-1'
        onClick={onConfirm}
      >
        {t('dateTimePicker.confirm', { defaultValue: 'Confirm' })}
      </Button>
    </div>
  );
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function withTime(day: Date, time: string): Date {
  const [hours, minutes] = time.split(':');
  const next = new Date(day);
  next.setSeconds(0, 0);
  next.setHours(Number(hours), Number(minutes));
  return next;
}
