import { useLocale, useTranslation } from '@nocobase/i18n/client';
import { format, type Locale } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ComponentType,
  type ReactElement,
  type Ref,
} from 'react';
import { cn } from 'cn';

import { Button } from '#components/ui/button';
import { Calendar, CalendarDayButton } from '#components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#components/ui/popover';

export interface DatePickerProps {
  /** Ties the trigger to its label: `<label htmlFor={id}>`. */
  readonly id?: string;
  readonly value: Date | undefined;
  readonly onChange: (date: Date | undefined) => void;
  readonly disabled?: boolean;
  /** Shows a Clear action in the calendar while a date is selected. */
  readonly clearable?: boolean;
  readonly placeholder?: string;
  /** A `date-fns` locale for the trigger and the calendar; defaults to the interface language. */
  readonly locale?: Locale;
  readonly className?: string;
}

/** One `date-fns` locale per interface language the application offers; add a line when you add a language. */
function interfaceDateLocale(language: string): Locale {
  return language.startsWith('zh') ? zhCN : enUS;
}

/**
 * The registry's `CalendarDayButton` keeps a focus ref it never attaches, so arrow keys would move the calendar's
 * highlighted day while the browser focus stays behind. Attach one here instead of editing the generated primitive.
 */
type DayButtonProps = ComponentProps<typeof CalendarDayButton>;
// Its remaining props, `ref` included (a plain prop in React 19), reach the underlying Button.
const CalendarDayButtonWithRef = CalendarDayButton as ComponentType<
  DayButtonProps & { readonly ref: Ref<HTMLButtonElement> }
>;

function FocusedDayButton(props: DayButtonProps): ReactElement {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (props.modifiers.focused) ref.current?.focus();
  }, [props.modifiers.focused]);
  return <CalendarDayButtonWithRef {...props} ref={ref} />;
}

/**
 * The application's single-date picker: shadcn's Date Picker composition of a `Popover` opened by an outline
 * `Button`, holding a `Calendar` in single mode (https://ui.shadcn.com/docs/components/base/date-picker).
 * Business pages reuse it instead of composing the primitives again or using a native date input.
 */
export function DatePicker({
  id,
  value,
  onChange,
  disabled = false,
  clearable = false,
  placeholder,
  locale,
  className,
}: DatePickerProps): ReactElement {
  const { t } = useTranslation();
  const { locale: language } = useLocale();
  const dateLocale = locale ?? interfaceDateLocale(language);
  const [open, setOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const select = (date: Date | undefined): void => {
    onChange(date);
    setOpen(false);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type='button'
            variant='outline'
            disabled={disabled}
            data-empty={!value}
            className={cn(
              'w-full justify-start px-2.5 text-left font-normal data-[empty=true]:text-muted-foreground',
              className,
            )}
          />
        }
      >
        <CalendarIcon aria-hidden='true' data-icon='inline-start' />
        {value ? (
          format(value, 'PPP', { locale: dateLocale })
        ) : (
          <span>{placeholder ?? t('datePicker.placeholder')}</span>
        )}
      </PopoverTrigger>
      <PopoverContent
        className='w-auto p-0'
        align='start'
        // Start on the selected day (or today), the calendar's one tabbable day, so arrow keys move between days.
        initialFocus={() =>
          calendarRef.current?.querySelector<HTMLElement>(
            '[role=grid] button[tabindex="0"]',
          ) ?? true
        }
      >
        <div ref={calendarRef}>
          <Calendar
            mode='single'
            autoFocus
            locale={dateLocale}
            components={{ DayButton: FocusedDayButton }}
            selected={value}
            defaultMonth={value}
            onSelect={select}
          />
        </div>
        {clearable && value ? (
          <div className='border-t p-2'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='w-full'
              onClick={() => select(undefined)}
            >
              {t('datePicker.clear')}
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
