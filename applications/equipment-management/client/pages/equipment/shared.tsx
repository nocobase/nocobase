import { invalidFields } from './validation.js';
import { EquipmentPicker } from './equipment-picker.js';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';

import { ApiClientError } from '@nocobase/app-client';

import { useTranslation } from '@nocobase/i18n/client';
import { CalendarIcon } from 'lucide-react';
import { Button } from '#components/ui/button';
import { Badge } from '#components/ui/badge';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import { Field, FieldLabel } from '#components/ui/field';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '#components/ui/select';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '#components/ui/popover';
import { Calendar } from '#components/ui/calendar';
import { Alert, AlertTitle, AlertDescription } from '#components/ui/alert';
import { Skeleton } from '#components/ui/skeleton';
import {
  Empty,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '#components/ui/empty';

export function Status({ value }: { value: unknown }) {
  const { t } = useTranslation();
  return (
    <Badge
      variant={
        value === 'scrapped' || value === 'rejected' ? 'destructive' : 'outline'
      }
    >
      {t('equipment.states.' + String(value))}
    </Badge>
  );
}
export function Display({ value }: { value: unknown }) {
  const { i18n } = useTranslation();
  if (value === null || value === undefined || value === '') return <>—</>;
  if (typeof value === 'number')
    return (
      <>
        {new Intl.NumberFormat(i18n.language, {
          maximumFractionDigits: 2,
        }).format(value)}
      </>
    );
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))
    return (
      <>
        {new Intl.DateTimeFormat(i18n.language, {
          dateStyle: 'medium',
          ...(value.includes('T') ? { timeStyle: 'short' as const } : {}),
        }).format(new Date(value.includes('T') ? value : value + 'T12:00:00'))}
      </>
    );
  return (
    <>
      {typeof value === 'string' || typeof value === 'boolean'
        ? String(value)
        : '—'}
    </>
  );
}
export function LoadState({
  loading,
  error,
  empty,
  retry,
  action,
}: {
  loading?: boolean;
  error?: unknown;
  empty?: boolean;
  retry?: () => void;
  action?: ReactNode;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  if (loading)
    return (
      <div aria-label={t('equipment.loading')} className='space-y-3'>
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-40 w-full' />
      </div>
    );
  if (error) {
    const status = error instanceof ApiClientError ? error.status : 500;
    const key =
      status === 401
        ? 'signedOut'
        : status === 403
          ? 'forbidden'
          : status === 404
            ? 'missing'
            : 'failure';
    return (
      <Alert variant='destructive'>
        <AlertTitle>{t('equipment.' + key)}</AlertTitle>
        <AlertDescription>
          {status === 403 ? t('equipment.noBusinessRole') : null}
          {status === 401 ? (
            <Button nativeButton={false} render={<Link to='/login' />}>
              {t('equipment.login')}
            </Button>
          ) : status === 404 ? (
            <Button variant='outline' onClick={() => void navigate(-1)}>
              {t('equipment.back')}
            </Button>
          ) : status !== 403 ? (
            <Button variant='outline' onClick={retry}>
              {t('equipment.retry')}
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
    );
  }
  if (empty)
    return (
      <Empty>
        <EmptyTitle>{t('equipment.empty')}</EmptyTitle>
        <EmptyDescription>{t('equipment.scopeHint')}</EmptyDescription>
        <EmptyContent>{action}</EmptyContent>
      </Empty>
    );
  return null;
}
export function ErrorNotice({ error }: { error: unknown }) {
  const { t } = useTranslation();
  if (!error) return null;
  const reason = error instanceof ApiClientError ? error.reason : '';
  const status = error instanceof ApiClientError ? error.status : 0;
  return (
    <Alert variant='destructive'>
      <AlertTitle>
        {t(
          'equipment.' +
            (status === 409
              ? 'conflict'
              : status === 403
                ? 'forbidden'
                : 'failure'),
        )}
      </AlertTitle>
      <AlertDescription>
        {reason
          ? t('equipment.refusals.' + reason, {
              defaultValue: t('equipment.failure'),
            })
          : t('equipment.invalid')}
      </AlertDescription>
    </Alert>
  );
}
export function Choice({
  id,
  value,
  onChange,
  options,
  disabled,
  label,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  label: string;
}) {
  const { t } = useTranslation();
  return (
    <Select
      items={options}
      value={value || null}
      onValueChange={(v) => onChange(v ?? '')}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        aria-label={label}
        className='h-auto min-h-8 w-full [&_[data-slot=select-value]]:line-clamp-none [&_[data-slot=select-value]]:whitespace-normal'
      >
        <SelectValue placeholder={t('equipment.select')} />
      </SelectTrigger>
      <SelectContent className='min-w-(--anchor-width)'>
        {options.map((o) => (
          <SelectItem
            className='whitespace-normal'
            key={o.value}
            value={o.value}
          >
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export interface FormField {
  key: string;
  type?: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'asset';
  required?: boolean;
  options?: { value: string; label: string }[];
  disabled?: boolean;
}
export function FormFields({
  fields,
  values,
  setValue,
  disabled,
  error,
}: {
  error?: unknown;
  fields: FormField[];
  values: Record<string, string>;
  setValue: (k: string, v: string) => void;
  disabled: boolean;
}) {
  const { t, i18n } = useTranslation();
  const invalid = invalidFields(error);
  return (
    <div className='grid gap-5 sm:grid-cols-2'>
      {fields.map((f) => (
        <Field
          key={f.key}
          data-invalid={invalid.includes(f.key)}
          className={f.type === 'textarea' ? 'sm:col-span-2' : ''}
        >
          <FieldLabel htmlFor={'eq-' + f.key}>
            {t('equipment.fields.' + f.key)}
            {f.required ? ' *' : ''}
          </FieldLabel>
          {f.type === 'asset' ? (
            <EquipmentPicker
              id={'eq-' + f.key}
              value={values[f.key] || ''}
              onChange={(v) => setValue(f.key, v)}
              disabled={disabled || f.disabled}
            />
          ) : f.type === 'select' ? (
            <Choice
              id={'eq-' + f.key}
              label={t('equipment.fields.' + f.key)}
              value={values[f.key] || ''}
              onChange={(v) => setValue(f.key, v)}
              options={f.options || []}
              disabled={disabled || f.disabled}
            />
          ) : f.type === 'date' ? (
            <div className='flex gap-1'>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant='outline'
                      id={'eq-' + f.key}
                      disabled={disabled || f.disabled}
                      className='w-full justify-start font-normal'
                    />
                  }
                >
                  <CalendarIcon aria-hidden className='size-4' />
                  {values[f.key]
                    ? new Intl.DateTimeFormat(i18n.language, {
                        dateStyle: 'medium',
                      }).format(new Date(values[f.key] + 'T12:00:00'))
                    : t('equipment.select')}
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar
                    mode='single'
                    selected={
                      values[f.key]
                        ? new Date(values[f.key] + 'T12:00:00')
                        : undefined
                    }
                    onSelect={(day) =>
                      setValue(
                        f.key,
                        day
                          ? day.getFullYear() +
                              '-' +
                              String(day.getMonth() + 1).padStart(2, '0') +
                              '-' +
                              String(day.getDate()).padStart(2, '0')
                          : '',
                      )
                    }
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant='ghost'
                disabled={disabled || !values[f.key]}
                aria-label={t('equipment.clear')}
                onClick={() => setValue(f.key, '')}
              >
                ×
              </Button>
            </div>
          ) : f.type === 'textarea' ? (
            <Textarea
              id={'eq-' + f.key}
              required={f.required}
              maxLength={4000}
              value={values[f.key] || ''}
              disabled={disabled || f.disabled}
              onChange={(e) => setValue(f.key, e.target.value)}
            />
          ) : (
            <Input
              id={'eq-' + f.key}
              aria-invalid={invalid.includes(f.key)}
              aria-describedby={
                invalid.includes(f.key) ? 'eq-' + f.key + '-error' : undefined
              }
              type={f.type === 'number' ? 'number' : 'text'}
              min={f.type === 'number' ? 0 : undefined}
              step={f.type === 'number' ? '0.01' : undefined}
              maxLength={160}
              required={f.required}
              value={values[f.key] || ''}
              disabled={disabled || f.disabled}
              onChange={(e) => setValue(f.key, e.target.value)}
            />
          )}
          {invalid.includes(f.key) && (
            <p
              id={'eq-' + f.key + '-error'}
              role='alert'
              className='text-sm text-destructive'
            >
              {t('equipment.invalid')}
            </p>
          )}
        </Field>
      ))}
    </div>
  );
}
export function SearchBox({
  value,
  onSearch,
}: {
  value: string;
  onSearch: (v: string) => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value);
  const composingRef = useRef(false);
  const [previous, setPrevious] = useState(value);
  if (previous !== value) {
    setPrevious(value);
    setDraft(value);
  }
  useEffect(() => {
    if (composingRef.current || draft === value) return;
    const timer = setTimeout(() => onSearch(draft), 300);
    return () => clearTimeout(timer);
  }, [draft, value, onSearch]);
  return (
    <Input
      aria-label={t('equipment.search')}
      placeholder={t('equipment.search')}
      className='w-full sm:max-w-sm'
      value={draft}
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onCompositionEnd={(e) => {
        composingRef.current = false;
        setDraft(e.currentTarget.value);
        onSearch(e.currentTarget.value);
      }}
      onChange={(e) => setDraft(e.target.value)}
    />
  );
}
