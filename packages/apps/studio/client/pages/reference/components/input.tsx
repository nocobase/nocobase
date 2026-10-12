import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useState } from 'react';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import { ExamplePage, ExampleSection } from '../shared';

const MAX_REFERENCE_LENGTH = 12;

export default function InputExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [reference, setReference] = useState('PO-2026-');

  return (
    <ExamplePage
      title={t('components.input.title')}
      description={t('components.input.description')}
      docs='https://ui.shadcn.com/docs/components/input'
    >
      <ExampleSection
        title={t('components.input.types')}
        description={t('components.input.typesDescription')}
        contentClassName='grid gap-4 sm:grid-cols-2'
      >
        <Field>
          <FieldLabel htmlFor='input-text'>{t('reference.name')}</FieldLabel>
          <Input
            id='input-text'
            placeholder={t('components.input.namePlaceholder')}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='input-email'>{t('reference.email')}</FieldLabel>
          <Input
            id='input-email'
            type='email'
            placeholder={t('components.input.emailPlaceholder')}
            autoComplete='email'
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='input-password'>
            {t('components.input.password')}
          </FieldLabel>
          <Input
            id='input-password'
            type='password'
            placeholder={t('components.input.passwordPlaceholder')}
            autoComplete='new-password'
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='input-number'>
            {t('reference.quantity')}
          </FieldLabel>
          <Input id='input-number' type='number' min={1} defaultValue={4} />
        </Field>
        <Field>
          <FieldLabel htmlFor='input-tel'>{t('reference.phone')}</FieldLabel>
          <Input
            id='input-tel'
            type='tel'
            placeholder='+1 (555) 000-0000'
            autoComplete='tel'
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='input-url'>
            {t('components.input.website')}
          </FieldLabel>
          <Input id='input-url' type='url' placeholder='https://example.com' />
        </Field>
        <Field>
          <FieldLabel htmlFor='input-search'>
            {t('components.input.search')}
          </FieldLabel>
          <Input
            id='input-search'
            type='search'
            placeholder={t('reference.search')}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='input-date'>{t('reference.dueDate')}</FieldLabel>
          <Input id='input-date' type='date' defaultValue='2026-10-15' />
        </Field>
      </ExampleSection>

      <ExampleSection
        title={t('components.input.field')}
        description={t('components.input.fieldDescription')}
        contentClassName='block'
      >
        <FieldGroup className='w-full max-w-md'>
          <Field>
            <FieldLabel htmlFor='input-company'>
              {t('components.input.companyName')}
            </FieldLabel>
            <Input
              id='input-company'
              placeholder={t('components.input.companyPlaceholder')}
              required
            />
            <FieldDescription>
              {t('components.input.companyHint')}
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor='input-tax-id'>
              {t('components.input.taxId')}{' '}
              <span className='font-normal text-muted-foreground'>
                ({t('reference.optional')})
              </span>
            </FieldLabel>
            <Input id='input-tax-id' placeholder='DE 123 456 789' />
            <FieldDescription>
              {t('components.input.taxIdHint')}
            </FieldDescription>
          </Field>
        </FieldGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.input.states')}
        description={t('components.input.statesDescription')}
        contentClassName='grid gap-4 sm:grid-cols-3'
      >
        <Field>
          <FieldLabel htmlFor='input-disabled'>
            {t('components.input.disabled')}
          </FieldLabel>
          <Input id='input-disabled' disabled defaultValue='ORD-1042' />
          <FieldDescription>
            {t('components.input.disabledHint')}
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor='input-readonly'>
            {t('components.input.readOnly')}
          </FieldLabel>
          <Input id='input-readonly' readOnly defaultValue='CUST-00417' />
          <FieldDescription>
            {t('components.input.readOnlyHint')}
          </FieldDescription>
        </Field>
        <Field data-invalid>
          <FieldLabel htmlFor='input-invalid'>
            {t('reference.email')}
          </FieldLabel>
          <Input
            id='input-invalid'
            type='email'
            defaultValue='ava.chen@'
            aria-invalid
          />
          <FieldError>{t('components.input.emailInvalid')}</FieldError>
        </Field>
      </ExampleSection>

      <ExampleSection
        title={t('components.input.file')}
        description={t('components.input.fileDescription')}
        contentClassName='block'
      >
        <Field className='w-full max-w-md'>
          <FieldLabel htmlFor='input-file'>
            {t('components.input.attachment')}
          </FieldLabel>
          <Input id='input-file' type='file' accept='.pdf,.png,.jpg' />
          <FieldDescription>
            {t('components.input.attachmentHint')}
          </FieldDescription>
        </Field>
      </ExampleSection>

      <ExampleSection
        title={t('components.input.controlled')}
        description={t('components.input.controlledDescription')}
        contentClassName='block'
      >
        <Field className='w-full max-w-xs'>
          <FieldLabel htmlFor='input-reference'>
            {t('components.input.reference')}
          </FieldLabel>
          <Input
            id='input-reference'
            value={reference}
            maxLength={MAX_REFERENCE_LENGTH}
            className='font-mono uppercase'
            onChange={(event) =>
              setReference(
                event.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9-]/gu, '')
                  .slice(0, MAX_REFERENCE_LENGTH),
              )
            }
          />
          <FieldDescription className='flex justify-between'>
            <span>{t('components.input.referenceHint')}</span>
            <span className='tabular-nums'>
              {reference.length}/{MAX_REFERENCE_LENGTH}
            </span>
          </FieldDescription>
        </Field>
      </ExampleSection>
    </ExamplePage>
  );
}
