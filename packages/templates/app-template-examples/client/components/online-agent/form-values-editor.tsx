import { useTranslation } from '@nocobase/i18n/client';
import { useId, type ReactElement, type Ref } from 'react';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#components/ui/field';
import { Input } from '#components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';

import type { FormEditorValues } from './form-editor-values.js';

export function FormValuesEditor({
  prefix,
  values,
  onChange,
  disabled = false,
  invalid = [],
  nameRef,
  budgetRef,
}: {
  prefix: string;
  values: FormEditorValues;
  onChange: (values: FormEditorValues) => void;
  disabled?: boolean;
  invalid?: readonly string[];
  nameRef?: Ref<HTMLInputElement>;
  budgetRef?: Ref<HTMLInputElement>;
}): ReactElement {
  const { t } = useTranslation();
  const fieldId = `${useId()}-${prefix}`;
  const priorities = [
    { value: 'low', label: t('aiFormFill.low') },
    { value: 'normal', label: t('aiFormFill.normal') },
    { value: 'high', label: t('aiFormFill.high') },
  ];
  const booleans = [
    { value: 'true', label: t('aiFormFill.yes') },
    { value: 'false', label: t('aiFormFill.no') },
  ];
  return (
    <FieldGroup>
      {values.name !== undefined ? (
        <Field data-invalid={invalid.includes('name')}>
          <FieldLabel htmlFor={`${fieldId}-name`}>
            {t('aiFormFill.name')}{' '}
            <span aria-hidden='true' className='text-destructive'>
              *
            </span>
          </FieldLabel>
          <Input
            id={`${fieldId}-name`}
            data-testid={`${prefix}-name`}
            ref={nameRef}
            aria-required='true'
            aria-invalid={invalid.includes('name')}
            disabled={disabled}
            value={values.name}
            onChange={(event) =>
              onChange({ ...values, name: event.target.value })
            }
          />
          {invalid.includes('name') ? (
            <FieldError>{t('aiFormFill.invalidName')}</FieldError>
          ) : null}
        </Field>
      ) : null}
      {values.priority !== undefined ? (
        <Field>
          <FieldLabel htmlFor={`${fieldId}-priority`}>
            {t('aiFormFill.priority')}
          </FieldLabel>
          <Select
            items={priorities}
            value={values.priority}
            disabled={disabled}
            onValueChange={(value) => {
              if (value === 'low' || value === 'normal' || value === 'high')
                onChange({ ...values, priority: value });
            }}
          >
            <SelectTrigger
              id={`${fieldId}-priority`}
              data-testid={`${prefix}-priority`}
              className='w-full'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              <SelectGroup>
                {priorities.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      ) : null}
      {values.budget !== undefined ? (
        <Field data-invalid={invalid.includes('budget')}>
          <FieldLabel htmlFor={`${fieldId}-budget`}>
            {t('aiFormFill.budget')}
          </FieldLabel>
          <Input
            id={`${fieldId}-budget`}
            data-testid={`${prefix}-budget`}
            ref={budgetRef}
            inputMode='decimal'
            aria-invalid={invalid.includes('budget')}
            disabled={disabled}
            value={values.budget}
            onChange={(event) =>
              onChange({ ...values, budget: event.target.value })
            }
          />
          {invalid.includes('budget') ? (
            <FieldError>{t('aiFormFill.invalidBudget')}</FieldError>
          ) : null}
        </Field>
      ) : null}
      {values.subscribe !== undefined ? (
        <Field>
          <FieldLabel htmlFor={`${fieldId}-subscribe`}>
            {t('aiFormFill.subscribe')}
          </FieldLabel>
          <Select
            items={booleans}
            value={String(values.subscribe)}
            disabled={disabled}
            onValueChange={(value) => {
              if (value === 'true' || value === 'false')
                onChange({ ...values, subscribe: value === 'true' });
            }}
          >
            <SelectTrigger
              id={`${fieldId}-subscribe`}
              data-testid={`${prefix}-subscribe`}
              className='w-full'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              <SelectGroup>
                {booleans.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      ) : null}
    </FieldGroup>
  );
}
