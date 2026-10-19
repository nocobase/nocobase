import { useTranslation } from '@nocobase/i18n/client';
import { useId, useState, type ReactElement, type Ref } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { enUS, zhCN } from 'react-day-picker/locale';
import { Button } from '#components/ui/button';
import { Calendar } from '#components/ui/calendar';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#components/ui/field';
import { Input } from '#components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '#components/ui/input-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#components/ui/popover';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Textarea } from '#components/ui/textarea';
import { PROCUREMENT_DEPARTMENTS } from '../../../shared/ai-form-fill.js';
import type { FormEditorValues } from './form-editor-values.js';

export function FormValuesEditor({
  prefix,
  values,
  onChange,
  disabled = false,
  showAllFields = false,
  invalid = [],
  nameRef,
  budgetRef,
}: {
  prefix: string;
  values: FormEditorValues;
  onChange: (values: FormEditorValues) => void;
  disabled?: boolean;
  showAllFields?: boolean;
  invalid?: readonly string[];
  nameRef?: Ref<HTMLInputElement>;
  budgetRef?: Ref<HTMLInputElement>;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const fieldId = `${useId()}-${prefix}`;
  const [calendarOpen, setCalendarOpen] = useState(false);
  const departments = PROCUREMENT_DEPARTMENTS.map((value) => ({
    value,
    label: t(`aiFormFill.departments.${value}`),
  }));
  const priorities = ['low', 'normal', 'high'].map((value) => ({
    value,
    label: t(`aiFormFill.${value}`),
  }));
  const booleans = [
    { value: 'true', label: t('aiFormFill.yes') },
    { value: 'false', label: t('aiFormFill.no') },
  ];
  return (
    <FieldGroup
      className={
        showAllFields ? 'grid grid-cols-1 gap-6 sm:grid-cols-2' : undefined
      }
    >
      {showAllFields || values.name !== undefined ? (
        <Field
          className={showAllFields ? 'sm:col-span-2' : undefined}
          data-invalid={invalid.includes('name')}
        >
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
            value={values.name ?? ''}
            maxLength={120}
            placeholder={t('aiFormFill.namePlaceholder')}
            onChange={(event) =>
              onChange({ ...values, name: event.target.value })
            }
          />
          {invalid.includes('name') ? (
            <FieldError>{t('aiFormFill.invalidName')}</FieldError>
          ) : null}
        </Field>
      ) : null}
      {showAllFields || values.department !== undefined ? (
        <Field>
          <FieldLabel htmlFor={`${fieldId}-department`}>
            {t('aiFormFill.department')}
          </FieldLabel>
          <Select
            items={departments}
            value={values.department ?? null}
            disabled={disabled}
            onValueChange={(value) => {
              const department = departments.find(
                (item) => item.value === value,
              )?.value;
              if (department) onChange({ ...values, department });
            }}
          >
            <SelectTrigger
              id={`${fieldId}-department`}
              data-testid={`${prefix}-department`}
              className='w-full'
            >
              <SelectValue
                placeholder={t('aiFormFill.departmentPlaceholder')}
              />
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              <SelectGroup>
                {departments.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      ) : null}
      {showAllFields || values.quantity !== undefined ? (
        <Field>
          <FieldLabel htmlFor={`${fieldId}-quantity`}>
            {t('aiFormFill.quantity')}
          </FieldLabel>
          <Input
            id={`${fieldId}-quantity`}
            data-testid={`${prefix}-quantity`}
            inputMode='numeric'
            disabled={disabled}
            value={values.quantity ?? ''}
            placeholder={t('aiFormFill.quantityPlaceholder')}
            onChange={(event) =>
              onChange({ ...values, quantity: event.target.value })
            }
          />
        </Field>
      ) : null}
      {showAllFields || values.budget !== undefined ? (
        <Field data-invalid={invalid.includes('budget')}>
          <FieldLabel htmlFor={`${fieldId}-budget`}>
            {t('aiFormFill.budget')}
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              id={`${fieldId}-budget`}
              data-testid={`${prefix}-budget`}
              ref={budgetRef}
              inputMode='decimal'
              aria-invalid={invalid.includes('budget')}
              disabled={disabled}
              value={values.budget ?? ''}
              placeholder={t('aiFormFill.budgetPlaceholder')}
              onChange={(event) =>
                onChange({ ...values, budget: event.target.value })
              }
            />
            <InputGroupAddon align='inline-end'>
              <InputGroupText>{t('aiFormFill.currency')}</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          {invalid.includes('budget') ? (
            <FieldError>{t('aiFormFill.invalidBudget')}</FieldError>
          ) : null}
        </Field>
      ) : null}
      {showAllFields || values.arrival !== undefined ? (
        <Field>
          <FieldLabel htmlFor={`${fieldId}-arrival`}>
            {t('aiFormFill.arrival')}
          </FieldLabel>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger
              render={
                <Button
                  id={`${fieldId}-arrival`}
                  data-testid={`${prefix}-arrival`}
                  type='button'
                  variant='outline'
                  disabled={disabled}
                  className='w-full justify-between font-normal'
                />
              }
            >
              {values.arrival ? (
                new Intl.DateTimeFormat(i18n.language, {
                  dateStyle: 'medium',
                }).format(parseISO(values.arrival))
              ) : (
                <span className='text-muted-foreground'>
                  {t('aiFormFill.arrivalPlaceholder')}
                </span>
              )}
              <CalendarIcon aria-hidden='true' data-icon='inline-end' />
            </PopoverTrigger>
            <PopoverContent align='start' className='w-auto p-0'>
              <Calendar
                mode='single'
                locale={i18n.language.startsWith('zh') ? zhCN : enUS}
                selected={values.arrival ? parseISO(values.arrival) : undefined}
                defaultMonth={
                  values.arrival ? parseISO(values.arrival) : undefined
                }
                onSelect={(date) => {
                  onChange({
                    ...values,
                    arrival: date ? format(date, 'yyyy-MM-dd') : '',
                  });
                  setCalendarOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </Field>
      ) : null}
      {showAllFields || values.purpose !== undefined ? (
        <Field className={showAllFields ? 'sm:col-span-2' : undefined}>
          <FieldLabel htmlFor={`${fieldId}-purpose`}>
            {t('aiFormFill.purpose')}
          </FieldLabel>
          <Textarea
            id={`${fieldId}-purpose`}
            data-testid={`${prefix}-purpose`}
            disabled={disabled}
            value={values.purpose ?? ''}
            maxLength={2000}
            className='min-h-24 resize-y'
            placeholder={t('aiFormFill.purposePlaceholder')}
            onChange={(event) =>
              onChange({ ...values, purpose: event.target.value })
            }
          />
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
