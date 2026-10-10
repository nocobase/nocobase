import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';

import { ExamplePage, ExampleSection } from '../shared';

const NOTE_LIMIT = 280;

const DEFAULT_NOTE =
  'Customer asked for the pallet to be delivered before 10:00 and signed for at the loading dock, not reception.';

export default function TextareaExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [note, setNote] = useState(DEFAULT_NOTE);

  const remaining = NOTE_LIMIT - note.length;

  return (
    <ExamplePage
      title={t('components.textarea.title')}
      description={t('components.textarea.description')}
      docs='https://ui.shadcn.com/docs/components/textarea'
    >
      <ExampleSection
        title={t('components.textarea.basic')}
        description={t('components.textarea.basicDescription')}
        contentClassName='block'
      >
        <Textarea
          className='w-full max-w-md'
          aria-label={t('reference.notes')}
          placeholder={t('components.textarea.notePlaceholder')}
        />
      </ExampleSection>

      <ExampleSection
        title={t('components.textarea.withLabel')}
        description={t('components.textarea.withLabelDescription')}
        contentClassName='block'
      >
        <FieldGroup className='w-full max-w-md'>
          <Field>
            <FieldLabel htmlFor='textarea-delivery'>
              {t('components.textarea.deliveryInstructions')}
            </FieldLabel>
            <Textarea
              id='textarea-delivery'
              placeholder={t('components.textarea.deliveryPlaceholder')}
              rows={3}
            />
            <FieldDescription>
              {t('components.textarea.deliveryHint')}
            </FieldDescription>
          </Field>
        </FieldGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.textarea.states')}
        description={t('components.textarea.statesDescription')}
        contentClassName='grid gap-4 sm:grid-cols-2'
      >
        <Field data-disabled>
          <FieldLabel htmlFor='textarea-archived'>
            {t('components.textarea.archivedNote')}
          </FieldLabel>
          <Textarea
            id='textarea-archived'
            defaultValue='Order archived on Sep 30, 2026 after the final payment cleared.'
            rows={3}
            disabled
          />
          <FieldDescription>
            {t('components.textarea.archivedHint')}
          </FieldDescription>
        </Field>
        <Field data-invalid>
          <FieldLabel htmlFor='textarea-reason'>
            {t('components.textarea.refundReason')}
          </FieldLabel>
          <Textarea
            id='textarea-reason'
            placeholder={t('components.textarea.refundPlaceholder')}
            rows={3}
            aria-invalid
          />
          <FieldError>{t('components.textarea.refundRequired')}</FieldError>
        </Field>
      </ExampleSection>

      <ExampleSection
        title={t('components.textarea.counter')}
        description={t('components.textarea.counterDescription')}
        contentClassName='block'
      >
        <FieldGroup className='w-full max-w-md'>
          <Field>
            <FieldLabel htmlFor='textarea-internal'>
              {t('components.textarea.internalNote')}
            </FieldLabel>
            <Textarea
              id='textarea-internal'
              value={note}
              maxLength={NOTE_LIMIT}
              rows={4}
              onChange={(event) => setNote(event.target.value)}
            />
            <FieldDescription
              className={remaining <= 40 ? 'text-destructive' : undefined}
            >
              {t('components.textarea.remaining', {
                remaining,
                limit: NOTE_LIMIT,
              })}
            </FieldDescription>
          </Field>
        </FieldGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.textarea.inForm')}
        description={t('components.textarea.inFormDescription')}
        contentClassName='block'
      >
        <FieldGroup className='w-full max-w-md'>
          <Field>
            <FieldLabel htmlFor='textarea-message'>
              {t('components.textarea.messageToCustomer')}
            </FieldLabel>
            <Textarea
              id='textarea-message'
              placeholder={t('components.textarea.messagePlaceholder')}
              rows={5}
            />
            <FieldDescription>
              {t('components.textarea.messageHint', {
                email: 'ava.chen@northwind.example',
              })}
            </FieldDescription>
          </Field>
          <div className='flex justify-end gap-2'>
            <Button variant='outline'>{t('reference.cancel')}</Button>
            <Button>{t('reference.submit')}</Button>
          </div>
        </FieldGroup>
      </ExampleSection>
    </ExamplePage>
  );
}
