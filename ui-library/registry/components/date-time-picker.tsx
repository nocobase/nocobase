import { useTranslation } from '@nocobase/i18n/client';
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

export interface DateTimePickerProps {
  readonly id?: string;
  readonly className?: string;
  readonly value?: Date;
  readonly onChange?: (date: Date | undefined) => void;
  /** A `date-fns` locale for the calendar and the trigger text, like `DatePicker`. */
  readonly locale?: Locale;
  readonly placeholder?: string;
  readonly disabled?: boolean;
}

/**
 * A date-and-time picker: the shared `DatePicker` with the time field from the shadcn Calendar "With Time" example
 * in its footer (`InputGroup` with a clock icon, the browser's own picker indicator hidden). The value keeps the
 * picker's trigger, calendar and popover behavior instead of reimplementing them.
 *
 * The field keeps the time to the minute: whichever end changes, seconds are dropped.
 */
export function DateTimePicker({
  id,
  className,
  value,
  onChange,
  locale,
  placeholder,
  disabled,
}: DateTimePickerProps): ReactElement {
  const { t } = useTranslation();
  const timeValue = value
    ? `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
    : '09:00';

  function setDay(day: Date | undefined): void {
    if (!day) {
      onChange?.(undefined);
      return;
    }
    const next = new Date(day);
    const [hours, minutes] = timeValue.split(':');
    next.setHours(Number(hours), Number(minutes), 0, 0);
    onChange?.(next);
  }

  function setTime(next: string): void {
    if (!next) return;
    const base = value ? new Date(value) : new Date();
    const [hours, minutes] = next.split(':');
    base.setSeconds(0, 0);
    base.setHours(Number(hours), Number(minutes));
    onChange?.(base);
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
          <Field>
            <FieldLabel htmlFor={id ? `${id}-time` : undefined}>
              {t('dateTimePicker.time', { defaultValue: 'Time' })}
            </FieldLabel>
            <InputGroup>
              <InputGroupInput
                id={id ? `${id}-time` : undefined}
                type='time'
                value={timeValue}
                onChange={(event) => setTime(event.target.value)}
                className='appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
              />
              <InputGroupAddon>
                <Clock2Icon className='text-muted-foreground' />
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <div className='flex gap-2'>
            <Button
              variant='ghost'
              size='sm'
              className='flex-1'
              onClick={() => {
                onChange?.(undefined);
                close();
              }}
            >
              {t('dateTimePicker.clear', { defaultValue: 'Clear' })}
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='flex-1'
              onClick={close}
            >
              {t('dateTimePicker.confirm', { defaultValue: 'Confirm' })}
            </Button>
          </div>
        </div>
      )}
    />
  );
}
