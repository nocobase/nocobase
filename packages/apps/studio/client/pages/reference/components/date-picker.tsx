import { useTranslation } from '@nocobase/i18n/client';
import { addDays, format, startOfToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { type ReactElement, useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { DatePicker, DateRangePicker } from '@/components/date-picker';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';

import { ExamplePage, ExampleSection } from '../shared';

const TODAY = startOfToday();

export default function DatePickerExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: addDays(TODAY, -6),
    to: TODAY,
  }));
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);

  return (
    <ExamplePage
      title={t('components.datePicker.title')}
      description={t('components.datePicker.description')}
      docs='https://ui.shadcn.com/docs/components/date-picker'
    >
      <ExampleSection
        title={t('components.datePicker.single')}
        description={t('components.datePicker.singleDescription')}
      >
        <DatePicker value={date} onChange={setDate} />
        <span className='text-sm text-muted-foreground'>
          {date
            ? t('components.datePicker.selected', {
                date: format(date, 'PPP'),
              })
            : t('components.datePicker.nothingSelected')}
        </span>
      </ExampleSection>

      <ExampleSection
        title={t('components.datePicker.range')}
        description={t('components.datePicker.rangeDescription')}
      >
        <DateRangePicker value={range} onChange={setRange} />
        <span className='text-sm text-muted-foreground'>
          {range?.from && range.to
            ? t('components.datePicker.rangeSelected', {
                from: format(range.from, 'PP'),
                to: format(range.to, 'PP'),
              })
            : t('components.datePicker.pickBothEnds')}
        </span>
      </ExampleSection>

      <ExampleSection
        title={t('components.datePicker.field')}
        description={t('components.datePicker.fieldDescription')}
        contentClassName='block'
      >
        <FieldGroup className='max-w-md'>
          <Field>
            <FieldLabel htmlFor='invoice-due-date'>
              {t('reference.dueDate')}
            </FieldLabel>
            <DatePicker
              id='invoice-due-date'
              defaultValue={addDays(TODAY, 30)}
              className='w-full'
            />
            <FieldDescription>
              {t('components.datePicker.dueDateHint')}
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor='report-period'>
              {t('components.datePicker.reportPeriod')}
            </FieldLabel>
            <DateRangePicker
              id='report-period'
              className='w-full'
              placeholder={t('components.datePicker.reportPeriodPlaceholder')}
            />
            <FieldDescription>
              {t('components.datePicker.reportPeriodHint')}
            </FieldDescription>
          </Field>
        </FieldGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.datePicker.constraints')}
        description={t('components.datePicker.constraintsDescription')}
        contentClassName='grid gap-4 sm:grid-cols-2'
      >
        <Field>
          <FieldLabel htmlFor='delivery-date'>
            {t('components.datePicker.deliveryDate')}
          </FieldLabel>
          <DatePicker
            id='delivery-date'
            value={deliveryDate}
            onChange={setDeliveryDate}
            className='w-full'
            calendarProps={{ disabled: { before: addDays(TODAY, 1) } }}
          />
          <FieldDescription>
            {t('components.datePicker.deliveryHint')}
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor='closed-date'>
            {t('components.datePicker.closedOn')}
          </FieldLabel>
          <DatePicker
            id='closed-date'
            disabled
            defaultValue={addDays(TODAY, -12)}
            className='w-full'
          />
          <FieldDescription>
            {t('components.datePicker.closedHint')}
          </FieldDescription>
        </Field>
      </ExampleSection>

      <ExampleSection
        title={t('components.datePicker.dropdown')}
        description={t('components.datePicker.dropdownDescription')}
      >
        <Field className='w-full max-w-xs'>
          <FieldLabel htmlFor='birth-date'>
            {t('components.datePicker.birthDate')}
          </FieldLabel>
          <DatePicker
            id='birth-date'
            value={birthDate}
            onChange={setBirthDate}
            formatString='PP'
            className='w-full'
            calendarProps={{
              captionLayout: 'dropdown',
              startMonth: new Date(1940, 0),
              endMonth: TODAY,
              disabled: { after: TODAY },
            }}
          />
        </Field>
      </ExampleSection>

      <ExampleSection
        title={t('components.datePicker.locale')}
        description={t('components.datePicker.localeDescription')}
      >
        <DatePicker locale={zhCN} defaultValue={TODAY} />
        <DateRangePicker
          locale={zhCN}
          formatString='PPP'
          className='w-96'
          defaultValue={{ from: addDays(TODAY, -3), to: addDays(TODAY, 4) }}
        />
      </ExampleSection>
    </ExamplePage>
  );
}
