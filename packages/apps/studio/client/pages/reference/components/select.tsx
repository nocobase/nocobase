import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useState } from 'react';

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { ExamplePage, ExampleSection } from '../shared';

const SALES_REPS = ['Ava Chen', 'Diego Alvarez', 'Hana Sato'];
const SUPPORT_REPS = ['Léa Dubois', 'Tom Byrom'];

const REGIONS = [
  { value: 'apac', label: 'Asia Pacific' },
  { value: 'emea', label: 'Europe, Middle East & Africa' },
  { value: 'amer', label: 'Americas' },
];

export default function SelectExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [terms, setTerms] = useState('net30');

  const statusItems = [
    { value: null, label: t('reference.selectPlaceholder') },
    { value: 'draft', label: t('reference.statusDraft') },
    { value: 'processing', label: t('reference.statusProcessing') },
    { value: 'shipped', label: t('reference.statusShipped') },
    { value: 'completed', label: t('reference.statusCompleted') },
    { value: 'cancelled', label: t('reference.statusCancelled') },
  ];

  const ownerItems = [
    { value: null, label: t('reference.selectPlaceholder') },
    ...SALES_REPS.map((name) => ({ value: name, label: name })),
    ...SUPPORT_REPS.map((name) => ({ value: name, label: name })),
  ];

  const shippingItems = [
    { value: 'standard', label: t('components.select.shippingStandard') },
    { value: 'express', label: t('components.select.shippingExpress') },
    { value: 'sameDay', label: t('components.select.shippingSameDay') },
    { value: 'pickup', label: t('components.select.shippingPickup') },
  ];

  const termsItems = [
    { value: 'prepaid', label: t('components.select.termsPrepaid') },
    { value: 'net14', label: t('components.select.termsNet14') },
    { value: 'net30', label: t('components.select.termsNet30') },
    { value: 'net60', label: t('components.select.termsNet60') },
  ];

  const selectedTerms = termsItems.find((item) => item.value === terms);

  return (
    <ExamplePage
      title={t('components.select.title')}
      description={t('components.select.description')}
      docs='https://ui.shadcn.com/docs/components/select'
    >
      <ExampleSection
        title={t('components.select.basic')}
        description={t('components.select.basicDescription')}
      >
        <Select items={statusItems}>
          <SelectTrigger className='w-full max-w-48'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
            <SelectGroup>
              {statusItems.slice(1).map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </ExampleSection>

      <ExampleSection
        title={t('components.select.groups')}
        description={t('components.select.groupsDescription')}
      >
        <Select items={ownerItems}>
          <SelectTrigger className='w-full max-w-56'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
            <SelectGroup>
              <SelectLabel>{t('components.select.teamSales')}</SelectLabel>
              {SALES_REPS.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>{t('components.select.teamSupport')}</SelectLabel>
              {SUPPORT_REPS.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </ExampleSection>

      <ExampleSection
        title={t('components.select.disabledItem')}
        description={t('components.select.disabledItemDescription')}
      >
        <Select items={shippingItems} defaultValue='standard'>
          <SelectTrigger className='w-full max-w-64'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
            <SelectGroup>
              <SelectLabel>{t('components.select.shippingMethod')}</SelectLabel>
              {shippingItems.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  disabled={item.value === 'sameDay'}
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </ExampleSection>

      <ExampleSection
        title={t('components.select.controlled')}
        description={t('components.select.controlledDescription')}
      >
        <Select
          items={termsItems}
          value={terms}
          onValueChange={(value: string | null) => setTerms(value ?? 'net30')}
        >
          <SelectTrigger className='w-full max-w-56'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
            <SelectGroup>
              {termsItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <span className='text-sm text-muted-foreground'>
          {t('components.select.dueHint', { terms: selectedTerms?.label })}
        </span>
      </ExampleSection>

      <ExampleSection
        title={t('components.select.inForm')}
        description={t('components.select.inFormDescription')}
        contentClassName='block'
      >
        <FieldGroup className='w-full max-w-md'>
          <Field>
            <FieldLabel htmlFor='select-region'>
              {t('components.select.region')}
            </FieldLabel>
            <Select items={REGIONS} defaultValue='apac'>
              <SelectTrigger id='select-region' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                <SelectGroup>
                  {REGIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>
              {t('components.select.regionHint')}
            </FieldDescription>
          </Field>
        </FieldGroup>
      </ExampleSection>
    </ExamplePage>
  );
}
