import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useState } from 'react';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from '@/components/ui/native-select';

import { ExamplePage, ExampleSection } from '../shared';

const ORDER_STATUSES = [
  'statusPending',
  'statusProcessing',
  'statusShipped',
  'statusCompleted',
  'statusCancelled',
] as const;

const WEST_WAREHOUSES = ['Oakland, CA', 'Portland, OR'] as const;
const EAST_WAREHOUSES = ['Newark, NJ', 'Atlanta, GA'] as const;
const PAGE_SIZES = ['10', '25', '50'] as const;

export default function NativeSelectExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string>('statusProcessing');
  const [warehouse, setWarehouse] = useState<string>('Oakland, CA');
  const [pageSize, setPageSize] = useState<string>('25');

  return (
    <ExamplePage
      title={t('components.nativeSelect.title')}
      description={t('components.nativeSelect.description')}
      docs='https://ui.shadcn.com/docs/components/native-select'
    >
      <ExampleSection
        title={t('components.nativeSelect.basic')}
        description={t('components.nativeSelect.basicDescription')}
      >
        <Field className='w-fit'>
          <FieldLabel htmlFor='native-select-status'>
            {t('reference.status')}
          </FieldLabel>
          <NativeSelect id='native-select-status' defaultValue='statusShipped'>
            {ORDER_STATUSES.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {t(`reference.${value}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </ExampleSection>

      <ExampleSection
        title={t('components.nativeSelect.sizes')}
        description={t('components.nativeSelect.sizesDescription')}
      >
        <NativeSelect
          size='sm'
          defaultValue='25'
          aria-label={t('components.nativeSelect.pageSizeLabel')}
        >
          {PAGE_SIZES.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {value}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          defaultValue='25'
          aria-label={t('components.nativeSelect.pageSizeLabel')}
        >
          {PAGE_SIZES.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {value}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </ExampleSection>

      <ExampleSection
        title={t('components.nativeSelect.groups')}
        description={t('components.nativeSelect.groupsDescription')}
      >
        <Field className='w-fit'>
          <FieldLabel htmlFor='native-select-warehouse'>
            {t('components.nativeSelect.warehouseLabel')}
          </FieldLabel>
          <NativeSelect id='native-select-warehouse' defaultValue='Oakland, CA'>
            <NativeSelectOptGroup
              label={t('components.nativeSelect.regionWest')}
            >
              {WEST_WAREHOUSES.map((city) => (
                <NativeSelectOption key={city} value={city}>
                  {city}
                </NativeSelectOption>
              ))}
            </NativeSelectOptGroup>
            <NativeSelectOptGroup
              label={t('components.nativeSelect.regionEast')}
            >
              {EAST_WAREHOUSES.map((city) => (
                <NativeSelectOption key={city} value={city}>
                  {city}
                </NativeSelectOption>
              ))}
            </NativeSelectOptGroup>
          </NativeSelect>
          <FieldDescription>
            {t('components.nativeSelect.warehouseDescription')}
          </FieldDescription>
        </Field>
      </ExampleSection>

      <ExampleSection
        title={t('components.nativeSelect.states')}
        description={t('components.nativeSelect.statesDescription')}
        contentClassName='grid gap-6 sm:grid-cols-2'
      >
        <Field data-disabled='true'>
          <FieldLabel htmlFor='native-select-currency'>
            {t('components.nativeSelect.currencyLabel')}
          </FieldLabel>
          <NativeSelect
            id='native-select-currency'
            className='w-full'
            defaultValue='USD'
            disabled
          >
            <NativeSelectOption value='USD'>USD</NativeSelectOption>
            <NativeSelectOption value='EUR'>EUR</NativeSelectOption>
          </NativeSelect>
          <FieldDescription>
            {t('components.nativeSelect.currencyDescription')}
          </FieldDescription>
        </Field>
        <Field data-invalid='true'>
          <FieldLabel htmlFor='native-select-terms'>
            {t('components.nativeSelect.termsLabel')}
          </FieldLabel>
          <NativeSelect
            id='native-select-terms'
            className='w-full'
            defaultValue=''
            aria-invalid
          >
            <NativeSelectOption value='' disabled>
              {t('reference.selectPlaceholder')}
            </NativeSelectOption>
            <NativeSelectOption value='net15'>Net 15</NativeSelectOption>
            <NativeSelectOption value='net30'>Net 30</NativeSelectOption>
            <NativeSelectOption value='net60'>Net 60</NativeSelectOption>
          </NativeSelect>
          <FieldError>{t('components.nativeSelect.termsError')}</FieldError>
        </Field>
      </ExampleSection>

      <ExampleSection
        title={t('components.nativeSelect.filters')}
        description={t('components.nativeSelect.filtersDescription')}
        contentClassName='block space-y-3'
      >
        <div className='flex flex-wrap items-center gap-3'>
          <NativeSelect
            size='sm'
            aria-label={t('reference.status')}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <NativeSelectOption value='all'>
              {t('reference.all')}
            </NativeSelectOption>
            {ORDER_STATUSES.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {t(`reference.${value}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect
            size='sm'
            aria-label={t('components.nativeSelect.warehouseLabel')}
            value={warehouse}
            onChange={(event) => setWarehouse(event.target.value)}
          >
            {[...WEST_WAREHOUSES, ...EAST_WAREHOUSES].map((city) => (
              <NativeSelectOption key={city} value={city}>
                {city}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect
            size='sm'
            aria-label={t('components.nativeSelect.pageSizeLabel')}
            value={pageSize}
            onChange={(event) => setPageSize(event.target.value)}
          >
            {PAGE_SIZES.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {value}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <p className='text-sm text-muted-foreground'>
          {t('components.nativeSelect.filterSummary', {
            status:
              status === 'all' ? t('reference.all') : t(`reference.${status}`),
            warehouse,
            size: pageSize,
          })}
        </p>
      </ExampleSection>
    </ExamplePage>
  );
}
