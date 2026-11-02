import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '#components/ui/select';
import { Skeleton } from '#components/ui/skeleton';

export function ReadFeedback({
  error,
  retry,
}: {
  error?: unknown;
  retry: () => void;
}) {
  const { t } = useTranslation();
  if (!error)
    return (
      <div
        role='status'
        aria-label={t('customerContacts.loading')}
        className='flex flex-col gap-4'
      >
        <Skeleton className='h-8 w-full' />
        <Skeleton className='h-8 w-full' />
      </div>
    );
  const status = error instanceof ApiClientError ? error.status : 0;
  return (
    <Alert variant='destructive'>
      <AlertDescription>
        {t(
          status === 403
            ? 'customerContacts.denied'
            : status === 401
              ? 'customerContacts.expired'
              : 'customerContacts.failed',
        )}
        {status === 401 ? (
          <Link to='/login'>{t('customerContacts.signIn')}</Link>
        ) : status === 403 ? null : (
          <Button variant='outline' onClick={retry}>
            {t('customerContacts.retry')}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
export function WriteFeedback({ error }: { error?: unknown }) {
  const { t } = useTranslation();
  if (!error) return null;
  const status = error instanceof ApiClientError ? error.status : 0;
  return (
    <Alert variant='destructive'>
      <AlertDescription>
        {t(
          status === 409
            ? 'customerContacts.STATE_CONFLICT'
            : status >= 400 && status < 500
              ? 'customerContacts.noChanges'
              : 'customerContacts.unknown',
        )}
      </AlertDescription>
    </Alert>
  );
}
export function Choice({
  value,
  onChange,
  label,
  options,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next !== null) onChange(next);
      }}
      items={options}
      disabled={disabled}
    >
      <SelectTrigger aria-label={label} className='w-full sm:w-40'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function StatusChoice({
  value,
  onChange,
  all = false,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  all?: boolean;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Choice
      value={value}
      onChange={onChange}
      disabled={disabled}
      label={t('customerContacts.status')}
      options={[
        ...(all ? [{ value: 'all', label: t('customerContacts.all') }] : []),
        ...(['active', 'paused', 'closed'] as const).map((value) => ({
          value,
          label: t(`customerContacts.${value}`),
        })),
      ]}
    />
  );
}
export function FieldError({
  children,
  id,
}: {
  children?: ReactNode;
  id: string;
}) {
  return children ? (
    <p id={id} className='text-sm text-destructive' role='alert'>
      {children}
    </p>
  ) : null;
}
