import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useState } from 'react';

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { ExamplePage, ExampleSection } from '../shared';

const PLANS = [
  { id: 'starter', price: '$29' },
  { id: 'growth', price: '$99' },
  { id: 'enterprise', price: '$399' },
] as const;

const PAYMENT_TERMS = ['net15', 'net30', 'net60'] as const;

export default function RadioGroupExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [terms, setTerms] = useState('net30');

  return (
    <ExamplePage
      title={t('components.radioGroup.title')}
      description={t('components.radioGroup.description')}
      docs='https://ui.shadcn.com/docs/components/radio-group'
    >
      <ExampleSection
        title={t('components.radioGroup.basic')}
        description={t('components.radioGroup.basicDescription')}
        contentClassName='block'
      >
        <RadioGroup defaultValue='standard' className='w-fit'>
          <Field orientation='horizontal'>
            <RadioGroupItem value='economy' id='shipping-economy' />
            <FieldLabel htmlFor='shipping-economy' className='font-normal'>
              {t('components.radioGroup.shippingEconomy')}
            </FieldLabel>
          </Field>
          <Field orientation='horizontal'>
            <RadioGroupItem value='standard' id='shipping-standard' />
            <FieldLabel htmlFor='shipping-standard' className='font-normal'>
              {t('components.radioGroup.shippingStandard')}
            </FieldLabel>
          </Field>
          <Field orientation='horizontal'>
            <RadioGroupItem value='express' id='shipping-express' />
            <FieldLabel htmlFor='shipping-express' className='font-normal'>
              {t('components.radioGroup.shippingExpress')}
            </FieldLabel>
          </Field>
        </RadioGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.radioGroup.descriptions')}
        description={t('components.radioGroup.descriptionsDescription')}
        contentClassName='block'
      >
        <RadioGroup defaultValue='email' className='max-w-md'>
          <Field orientation='horizontal'>
            <RadioGroupItem value='email' id='notify-email' />
            <FieldContent>
              <FieldLabel htmlFor='notify-email'>
                {t('components.radioGroup.notifyEmail')}
              </FieldLabel>
              <FieldDescription>
                {t('components.radioGroup.notifyEmailDescription')}
              </FieldDescription>
            </FieldContent>
          </Field>
          <Field orientation='horizontal'>
            <RadioGroupItem value='digest' id='notify-digest' />
            <FieldContent>
              <FieldLabel htmlFor='notify-digest'>
                {t('components.radioGroup.notifyDigest')}
              </FieldLabel>
              <FieldDescription>
                {t('components.radioGroup.notifyDigestDescription')}
              </FieldDescription>
            </FieldContent>
          </Field>
          <Field orientation='horizontal'>
            <RadioGroupItem value='none' id='notify-none' />
            <FieldContent>
              <FieldLabel htmlFor='notify-none'>
                {t('components.radioGroup.notifyNone')}
              </FieldLabel>
              <FieldDescription>
                {t('components.radioGroup.notifyNoneDescription')}
              </FieldDescription>
            </FieldContent>
          </Field>
        </RadioGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.radioGroup.cards')}
        description={t('components.radioGroup.cardsDescription')}
        contentClassName='block'
      >
        <RadioGroup defaultValue='growth' className='max-w-md'>
          {PLANS.map((plan) => (
            <FieldLabel key={plan.id} htmlFor={`plan-${plan.id}`}>
              <Field orientation='horizontal'>
                <FieldContent>
                  <FieldTitle>
                    {t(`components.radioGroup.plan.${plan.id}.name`)}
                    <span className='text-muted-foreground'>
                      {t('components.radioGroup.perMonth', {
                        price: plan.price,
                      })}
                    </span>
                  </FieldTitle>
                  <FieldDescription>
                    {t(`components.radioGroup.plan.${plan.id}.description`)}
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value={plan.id} id={`plan-${plan.id}`} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.radioGroup.fieldset')}
        description={t('components.radioGroup.fieldsetDescription')}
        contentClassName='block space-y-3'
      >
        <FieldSet className='max-w-sm'>
          <FieldLegend variant='label'>
            {t('components.radioGroup.termsLegend')}
          </FieldLegend>
          <FieldDescription>
            {t('components.radioGroup.termsDescription')}
          </FieldDescription>
          <RadioGroup
            value={terms}
            onValueChange={(value) => setTerms(String(value))}
          >
            {PAYMENT_TERMS.map((value) => (
              <Field key={value} orientation='horizontal'>
                <RadioGroupItem value={value} id={`terms-${value}`} />
                <FieldLabel htmlFor={`terms-${value}`} className='font-normal'>
                  {t(`components.radioGroup.terms.${value}`)}
                </FieldLabel>
              </Field>
            ))}
          </RadioGroup>
        </FieldSet>
        <p className='text-sm text-muted-foreground'>
          {t('components.radioGroup.termsSummary', {
            terms: t(`components.radioGroup.terms.${terms}`),
          })}
        </p>
      </ExampleSection>

      <ExampleSection
        title={t('components.radioGroup.states')}
        description={t('components.radioGroup.statesDescription')}
        contentClassName='grid gap-6 sm:grid-cols-2 items-start'
      >
        <FieldSet data-disabled='true'>
          <FieldLegend variant='label'>
            {t('components.radioGroup.warehouseLegend')}
          </FieldLegend>
          <RadioGroup defaultValue='oakland' disabled>
            <Field orientation='horizontal'>
              <RadioGroupItem value='oakland' id='warehouse-oakland' />
              <FieldLabel htmlFor='warehouse-oakland' className='font-normal'>
                Oakland, CA
              </FieldLabel>
            </Field>
            <Field orientation='horizontal'>
              <RadioGroupItem value='newark' id='warehouse-newark' />
              <FieldLabel htmlFor='warehouse-newark' className='font-normal'>
                Newark, NJ
              </FieldLabel>
            </Field>
          </RadioGroup>
          <FieldDescription>
            {t('components.radioGroup.warehouseDescription')}
          </FieldDescription>
        </FieldSet>
        <FieldSet data-invalid='true'>
          <FieldLegend variant='label'>
            {t('components.radioGroup.refundLegend')}
          </FieldLegend>
          <RadioGroup>
            <Field orientation='horizontal'>
              <RadioGroupItem
                value='credit'
                id='refund-credit'
                aria-invalid='true'
              />
              <FieldLabel htmlFor='refund-credit' className='font-normal'>
                {t('components.radioGroup.refundCredit')}
              </FieldLabel>
            </Field>
            <Field orientation='horizontal'>
              <RadioGroupItem
                value='original'
                id='refund-original'
                aria-invalid='true'
              />
              <FieldLabel htmlFor='refund-original' className='font-normal'>
                {t('components.radioGroup.refundOriginal')}
              </FieldLabel>
            </Field>
          </RadioGroup>
          <FieldError>{t('components.radioGroup.refundError')}</FieldError>
        </FieldSet>
      </ExampleSection>
    </ExamplePage>
  );
}
