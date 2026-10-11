import { useLocale, useTranslation } from '@nocobase/i18n/client';
import { addDays, format, startOfToday } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import { type ReactElement, useState } from 'react';
import type { DateRange, Matcher } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

import { ExamplePage, ExampleSection } from '../shared';

const today = startOfToday();
const defaultBirthday = new Date(1990, 5, 12);

/** Days another customer already holds; the booking calendar strikes them out. */
const bookedDates = Array.from({ length: 4 }, (_, offset) =>
  addDays(today, 8 + offset),
);

const bookingDisabled: Matcher[] = [
  { before: today },
  { dayOfWeek: [0, 6] },
  ...bookedDates,
];

const presets = [
  { labelKey: 'reference.today', days: 0 },
  { labelKey: 'components.calendar.tomorrow', days: 1 },
  { labelKey: 'components.calendar.inThreeDays', days: 3 },
  { labelKey: 'components.calendar.inAWeek', days: 7 },
  { labelKey: 'components.calendar.inTwoWeeks', days: 14 },
];

export default function CalendarExamplePage(): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  // The calendar follows the interface language: weekday names, month names
  // and the first day of the week all come from the date-fns locale.
  const dateLocale = locale.startsWith('zh') ? zhCN : enUS;

  const [date, setDate] = useState<Date | undefined>(today);
  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: addDays(today, 3),
    to: addDays(today, 10),
  }));
  const [birthday, setBirthday] = useState<Date | undefined>(defaultBirthday);
  const [dueDate, setDueDate] = useState<Date | undefined>(today);
  const [month, setMonth] = useState<Date>(today);
  const [booking, setBooking] = useState<Date | undefined>();

  const formatDate = (value: Date | undefined): string =>
    value
      ? format(value, 'PPP', { locale: dateLocale })
      : t('components.calendar.noDate');

  return (
    <ExamplePage
      title={t('components.calendar.title')}
      description={t('components.calendar.description')}
      docs='https://ui.shadcn.com/docs/components/calendar'
    >
      <ExampleSection
        title={t('components.calendar.single')}
        description={t('components.calendar.singleDescription')}
        contentClassName='items-start gap-6'
      >
        <Calendar
          mode='single'
          locale={dateLocale}
          selected={date}
          onSelect={setDate}
          className='rounded-lg border'
        />
        <p className='text-sm text-muted-foreground'>
          {t('components.calendar.selected')}{' '}
          <span className='font-medium text-foreground'>
            {formatDate(date)}
          </span>
        </p>
      </ExampleSection>

      <ExampleSection
        title={t('components.calendar.range')}
        description={t('components.calendar.rangeDescription')}
        contentClassName='items-start gap-6'
      >
        <Calendar
          mode='range'
          locale={dateLocale}
          defaultMonth={range?.from}
          selected={range}
          onSelect={setRange}
          numberOfMonths={2}
          className='rounded-lg border'
        />
        <p className='text-sm text-muted-foreground'>
          {t('components.calendar.reportingPeriod')}{' '}
          <span className='font-medium text-foreground'>
            {range?.from
              ? `${format(range.from, 'PP', { locale: dateLocale })} – ${
                  range.to
                    ? format(range.to, 'PP', { locale: dateLocale })
                    : '…'
                }`
              : t('components.calendar.noDate')}
          </span>
        </p>
      </ExampleSection>

      <ExampleSection
        title={t('components.calendar.dropdown')}
        description={t('components.calendar.dropdownDescription')}
        contentClassName='items-start gap-6'
      >
        <Calendar
          mode='single'
          locale={dateLocale}
          captionLayout='dropdown'
          startMonth={new Date(1940, 0)}
          endMonth={today}
          defaultMonth={birthday}
          selected={birthday}
          onSelect={setBirthday}
          className='rounded-lg border'
        />
        <p className='text-sm text-muted-foreground'>
          {t('components.calendar.dateOfBirth')}{' '}
          <span className='font-medium text-foreground'>
            {formatDate(birthday)}
          </span>
        </p>
      </ExampleSection>

      <ExampleSection
        title={t('components.calendar.presets')}
        description={t('components.calendar.presetsDescription')}
        contentClassName='items-start'
      >
        <Card size='sm' className='w-fit'>
          <CardContent>
            <Calendar
              mode='single'
              locale={dateLocale}
              selected={dueDate}
              onSelect={setDueDate}
              month={month}
              onMonthChange={setMonth}
              fixedWeeks
              className='p-0'
            />
          </CardContent>
          <CardFooter className='flex-wrap gap-2 border-t'>
            {presets.map((preset) => (
              <Button
                key={preset.labelKey}
                variant='outline'
                size='sm'
                className='flex-1'
                onClick={() => {
                  const next = addDays(startOfToday(), preset.days);
                  setDueDate(next);
                  setMonth(next);
                }}
              >
                {t(preset.labelKey)}
              </Button>
            ))}
          </CardFooter>
        </Card>
      </ExampleSection>

      <ExampleSection
        title={t('components.calendar.disabledDates')}
        description={t('components.calendar.disabledDatesDescription')}
        contentClassName='items-start gap-6'
      >
        <Calendar
          mode='single'
          locale={dateLocale}
          selected={booking}
          onSelect={setBooking}
          disabled={bookingDisabled}
          modifiers={{ booked: bookedDates }}
          modifiersClassNames={{
            booked: '[&>button]:line-through opacity-100',
          }}
          className='rounded-lg border'
        />
        <div className='space-y-1 text-sm text-muted-foreground'>
          <p>
            {t('components.calendar.deliveryDate')}{' '}
            <span className='font-medium text-foreground'>
              {formatDate(booking)}
            </span>
          </p>
          <p>{t('components.calendar.disabledDatesHint')}</p>
        </div>
      </ExampleSection>
    </ExamplePage>
  );
}
