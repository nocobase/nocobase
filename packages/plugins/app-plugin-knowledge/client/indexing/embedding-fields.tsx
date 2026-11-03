import { useTranslation } from '@nocobase/i18n/client';
import { useId, type ReactElement } from 'react';
import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { JsonObject, JsonValue } from '../../shared/indexing.js';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '../components/ui/field.js';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.js';
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '../components/ui/combobox.js';
import type { IndexingFormProps } from './types.js';

function isObject(value: JsonValue | undefined): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export function EmbeddingFields(props: IndexingFormProps): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const id = useId();
  const ref = isObject(props.value.embedding) ? props.value.embedding : {};
  const service = typeof ref.modelService === 'string' ? ref.modelService : '';
  const model = typeof ref.model === 'string' ? ref.model : '';
  const services = props.services.map((item) => ({
    value: item.name,
    label: item.title,
  }));
  const models =
    props.services.find((item) => item.name === service)?.models ?? [];
  const disabled =
    props.disabled || props.modelsLoading || props.modelsError !== null;
  const serviceErrors = props.errors.filter(
    (e) => e.field === 'options.embedding.modelService',
  );
  const modelErrors = props.errors.filter(
    (e) => e.field === 'options.embedding.model',
  );
  return (
    <FieldGroup className='gap-4'>
      {props.modelsLoading ? (
        <p role='status' className='text-sm text-muted-foreground'>
          {t('indexing.loadingModels')}
        </p>
      ) : null}
      {props.modelsError !== null ? (
        <p role='alert' className='text-sm text-destructive'>
          {t('indexing.modelsUnavailable')}
        </p>
      ) : null}
      <Field data-invalid={serviceErrors.length > 0 || undefined}>
        <FieldLabel htmlFor={id + '-service'}>
          {t('indexing.modelService')}
        </FieldLabel>
        <Select
          items={services}
          value={service || null}
          disabled={disabled || !services.length}
          onValueChange={(next: string | null) => {
            if (next !== null && next !== service && !disabled)
              props.onChange({
                ...props.value,
                embedding: { modelService: next, model: '' },
              });
          }}
        >
          <SelectTrigger
            id={id + '-service'}
            aria-invalid={serviceErrors.length > 0}
            className='w-full'
          >
            <SelectValue placeholder={t('indexing.chooseService')}>
              {(value: string | null) =>
                services.find((item) => item.value === value)?.label ??
                value ??
                t('indexing.chooseService')
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {services.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <FieldError errors={serviceErrors} />
      </Field>
      <Field data-invalid={modelErrors.length > 0 || undefined}>
        <FieldLabel htmlFor={id + '-model'}>{t('indexing.model')}</FieldLabel>
        <Combobox
          items={models.map((item) => item.value)}
          filteredItems={models
            .filter((item) =>
              (item.value + ' ' + item.label)
                .toLowerCase()
                .includes(model.trim().toLowerCase()),
            )
            .map((item) => item.value)}
          value={model || null}
          inputValue={model}
          disabled={
            disabled || !services.some((item) => item.value === service)
          }
          onInputValueChange={(next, details) => {
            if (details.reason === 'input-change' && !disabled)
              props.onChange({
                ...props.value,
                embedding: { modelService: service, model: next },
              });
          }}
          onValueChange={(next: string | null) => {
            if (next !== null && !disabled)
              props.onChange({
                ...props.value,
                embedding: { modelService: service, model: next },
              });
          }}
        >
          <ComboboxInput
            id={id + '-model'}
            aria-invalid={modelErrors.length > 0}
            className='w-full'
            maxLength={200}
            showTrigger={models.length > 0}
            triggerLabel={t('indexing.chooseModel')}
            placeholder={t('indexing.chooseModel')}
            disabled={
              disabled || !services.some((item) => item.value === service)
            }
          />
          {models.length > 0 ? (
            <ComboboxContent>
              <ComboboxList>
                {(value: string) => (
                  <ComboboxItem key={value} value={value}>
                    {models.find((item) => item.value === value)?.label ??
                      value}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          ) : null}
        </Combobox>
        <FieldError errors={modelErrors} />
      </Field>
    </FieldGroup>
  );
}
