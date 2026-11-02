import { useTranslation } from '@nocobase/i18n/client';
import { useEffect } from 'react';
import {
  Controller,
  useFieldArray,
  useForm,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '#components/ui/field';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import type { ContactProfile, PurchaseOrder } from './schemas.js';

function ResultInput<T extends FieldValues>({
  control,
  name,
  id,
  label,
  numeric = false,
  multiline = false,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  id: string;
  label: string;
  numeric?: boolean;
  multiline?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          {multiline ? (
            <Textarea {...field} id={id} value={String(field.value ?? '')} />
          ) : (
            <Input
              {...field}
              id={id}
              value={String(field.value ?? '')}
              inputMode={numeric ? 'decimal' : undefined}
            />
          )}
        </Field>
      )}
    />
  );
}

export function ContactFields({
  data,
  disabled,
}: {
  data: ContactProfile;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const { control, reset } = useForm({
    defaultValues: { ...data, skills: data.skills.join(', ') },
  });
  useEffect(() => {
    reset({ ...data, skills: data.skills.join(', ') });
  }, [data, reset]);
  const labels = [
    'name',
    'company',
    'jobTitle',
    'email',
    'phone',
    'skills',
  ] as const;
  return (
    <FieldSet disabled={disabled} className='min-w-0'>
      <FieldLegend className='sr-only'>
        {t('structuredExtraction.contactTitle')}
      </FieldLegend>
      <FieldGroup className='grid sm:grid-cols-2'>
        {labels.map((name) => (
          <ResultInput
            key={name}
            control={control}
            name={name}
            id={`contact-${name}`}
            label={t(`structuredExtraction.fields.${name}`)}
          />
        ))}
        <FieldSet className='sm:col-span-2'>
          <FieldLegend variant='label'>
            {t('structuredExtraction.fields.address')}
          </FieldLegend>
          <FieldGroup className='grid sm:grid-cols-2'>
            <ResultInput
              control={control}
              name='address.city'
              id='contact-city'
              label={t('structuredExtraction.fields.city')}
            />
            <ResultInput
              control={control}
              name='address.country'
              id='contact-country'
              label={t('structuredExtraction.fields.country')}
            />
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </FieldSet>
  );
}

export function OrderFields({
  data,
  disabled,
}: {
  data: PurchaseOrder;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  // Numeric controls keep string drafts: no coercion/clamping while people type.
  // These editable results are never submitted to a business API.
  const { control, reset } = useForm({
    defaultValues: {
      ...data,
      items: data.items.map((item) => ({
        ...item,
        quantity: item.quantity === null ? '' : String(item.quantity),
        unitPrice: item.unitPrice === null ? '' : String(item.unitPrice),
      })),
    },
  });
  useEffect(() => {
    reset({
      ...data,
      items: data.items.map((item) => ({
        ...item,
        quantity: item.quantity === null ? '' : String(item.quantity),
        unitPrice: item.unitPrice === null ? '' : String(item.unitPrice),
      })),
    });
  }, [data, reset]);
  const { fields } = useFieldArray({ control, name: 'items' });
  return (
    <FieldSet disabled={disabled} className='min-w-0'>
      <FieldLegend className='sr-only'>
        {t('structuredExtraction.orderTitle')}
      </FieldLegend>
      <FieldGroup>
        <FieldGroup className='grid sm:grid-cols-2'>
          <ResultInput
            control={control}
            name='supplier'
            id='order-supplier'
            label={t('structuredExtraction.fields.supplier')}
          />
          <ResultInput
            control={control}
            name='currency'
            id='order-currency'
            label={t('structuredExtraction.fields.currency')}
          />
        </FieldGroup>
        <FieldSet>
          <FieldLegend variant='label'>
            {t('structuredExtraction.fields.contact')}
          </FieldLegend>
          <FieldGroup className='grid sm:grid-cols-2'>
            <ResultInput
              control={control}
              name='contact.name'
              id='order-contact-name'
              label={t('structuredExtraction.fields.name')}
            />
            <ResultInput
              control={control}
              name='contact.email'
              id='order-contact-email'
              label={t('structuredExtraction.fields.email')}
            />
          </FieldGroup>
        </FieldSet>
        <FieldSet>
          <FieldLegend variant='label'>
            {t('structuredExtraction.fields.items')}
          </FieldLegend>
          <FieldGroup>
            {fields.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                {t('structuredExtraction.emptyItems')}
              </p>
            ) : (
              fields.map((item, index) => (
                <FieldSet key={item.id}>
                  <FieldLegend variant='label'>
                    {t('structuredExtraction.itemNumber', {
                      number: index + 1,
                    })}
                  </FieldLegend>
                  <FieldGroup className='grid sm:grid-cols-3'>
                    <ResultInput
                      control={control}
                      name={`items.${index}.product`}
                      id={`order-product-${index}`}
                      label={t('structuredExtraction.fields.product')}
                    />
                    <ResultInput
                      control={control}
                      name={`items.${index}.quantity`}
                      id={`order-quantity-${index}`}
                      label={t('structuredExtraction.fields.quantity')}
                      numeric
                    />
                    <ResultInput
                      control={control}
                      name={`items.${index}.unitPrice`}
                      id={`order-price-${index}`}
                      label={t('structuredExtraction.fields.unitPrice')}
                      numeric
                    />
                  </FieldGroup>
                </FieldSet>
              ))
            )}
          </FieldGroup>
        </FieldSet>
        <ResultInput
          control={control}
          name='notes'
          id='order-notes'
          label={t('structuredExtraction.fields.notes')}
          multiline
        />
      </FieldGroup>
    </FieldSet>
  );
}
