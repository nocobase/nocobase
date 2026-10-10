import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { ExamplePage, ExampleSection } from '../shared';

export default function LabelExamplePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <ExamplePage
      title={t('components.label.title')}
      description={t('components.label.description')}
      docs='https://ui.shadcn.com/docs/components/label'
    >
      <ExampleSection
        title={t('components.label.basic')}
        description={t('components.label.basicDescription')}
        contentClassName='block'
      >
        <div className='grid w-full max-w-sm gap-2'>
          <Label htmlFor='label-customer-email'>{t('reference.email')}</Label>
          <Input
            id='label-customer-email'
            type='email'
            placeholder='ava.chen@northwind.example'
          />
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.label.withCheckbox')}
        description={t('components.label.withCheckboxDescription')}
        contentClassName='flex-col items-start gap-3'
      >
        <div className='flex items-center gap-2'>
          <Checkbox id='label-terms' name='terms' />
          <Label htmlFor='label-terms'>
            {t('components.label.acceptTerms')}
          </Label>
        </div>
        <div className='flex items-center gap-2'>
          <Checkbox id='label-copy' name='copy' defaultChecked />
          <Label htmlFor='label-copy'>{t('components.label.sendCopy')}</Label>
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.label.withSwitch')}
        description={t('components.label.withSwitchDescription')}
        contentClassName='block'
      >
        <div className='flex w-full max-w-sm items-center justify-between gap-4'>
          <Label htmlFor='label-auto-renew'>
            {t('components.label.autoRenew')}
          </Label>
          <Switch id='label-auto-renew' defaultChecked />
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.label.withRadio')}
        description={t('components.label.withRadioDescription')}
        contentClassName='block'
      >
        <RadioGroup defaultValue='standard' className='max-w-sm gap-3'>
          <div className='flex items-center gap-2'>
            <RadioGroupItem value='standard' id='label-shipping-standard' />
            <Label htmlFor='label-shipping-standard'>
              {t('components.label.shippingStandard')}
            </Label>
          </div>
          <div className='flex items-center gap-2'>
            <RadioGroupItem value='express' id='label-shipping-express' />
            <Label htmlFor='label-shipping-express'>
              {t('components.label.shippingExpress')}
            </Label>
          </div>
          <div className='flex items-center gap-2'>
            <RadioGroupItem value='pickup' id='label-shipping-pickup' />
            <Label htmlFor='label-shipping-pickup'>
              {t('components.label.shippingPickup')}
            </Label>
          </div>
        </RadioGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.label.states')}
        description={t('components.label.statesDescription')}
        contentClassName='grid gap-4 sm:grid-cols-2'
      >
        <div className='grid gap-2'>
          <Label htmlFor='label-po-number'>
            {t('components.label.poNumber')}
            <span className='text-destructive' aria-hidden='true'>
              *
            </span>
            <span className='sr-only'>{t('reference.required')}</span>
          </Label>
          <Input id='label-po-number' required placeholder='PO-2026-0042' />
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='label-reference'>
            {t('components.label.internalReference')}
            <span className='font-normal text-muted-foreground'>
              ({t('reference.optional')})
            </span>
          </Label>
          <Input id='label-reference' />
        </div>
        <div className='group grid gap-2' data-disabled='true'>
          <Label htmlFor='label-tax-id'>{t('components.label.taxId')}</Label>
          <Input id='label-tax-id' disabled defaultValue='DE 811 234 567' />
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='label-notes'>{t('reference.notes')}</Label>
          <Textarea
            id='label-notes'
            rows={2}
            placeholder={t('components.label.notesPlaceholder')}
          />
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.label.inField')}
        description={t('components.label.inFieldDescription')}
        contentClassName='block'
      >
        <FieldGroup className='max-w-sm'>
          <Field>
            <FieldLabel htmlFor='label-field-name'>
              {t('reference.name')}
            </FieldLabel>
            <Input id='label-field-name' placeholder='Ava Chen' />
          </Field>
          <Field>
            <FieldLabel htmlFor='label-field-phone'>
              {t('reference.phone')}
            </FieldLabel>
            <Input
              id='label-field-phone'
              type='tel'
              placeholder='+1 415 555 0133'
            />
            <FieldDescription>
              {t('components.label.phoneHint')}
            </FieldDescription>
          </Field>
        </FieldGroup>
      </ExampleSection>
    </ExamplePage>
  );
}
