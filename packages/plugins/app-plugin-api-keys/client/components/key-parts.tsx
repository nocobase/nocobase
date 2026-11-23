/** The pieces the API keys pages share: a key's scope, expiry and last use, confirmations and errors. */
import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useState, type ReactElement } from 'react';

import { Alert, AlertDescription } from '#components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#components/ui/alert-dialog';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import type { CreatedApiKey, KeyPermissions } from '../../shared/scopes.js';
import {
  daysLeft,
  formatDate,
  permissionCounts,
  relativeTime,
} from '../lib/format.js';
import { API_KEYS_NAMESPACE } from '../namespace.js';
import { KeySecret } from './key-secret.js';

/** The days left under which an expiry is called out. */
const EXPIRES_SOON_DAYS = 7;

/** "Same as me", or how many permissions a key has, on how many objects and records. */
export function KeyScopeSummary({
  permissions,
}: {
  readonly permissions: KeyPermissions | null;
}): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  if (!permissions)
    return (
      <Badge className='bg-amber-500/15 text-amber-800 dark:text-amber-300'>
        {t('common.sameAsMe')}
      </Badge>
    );
  const counts = permissionCounts(permissions);
  return (
    <span className='inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1'>
      <Badge variant='secondary'>{t('common.custom')}</Badge>
      <span className='text-muted-foreground'>
        {t('common.permissionsCount', { count: counts.actions })}{' '}
        {t('common.objectsCount', { count: counts.resources })}
        {counts.records !== null
          ? ` · ${t('common.recordsLimited', { count: counts.records })}`
          : ''}
      </span>
    </span>
  );
}

export function KeyExpiry({
  expiresAt,
}: {
  readonly expiresAt: string | null;
}): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  const days = daysLeft(expiresAt);
  if (days === null)
    return <span className='text-muted-foreground'>{t('common.never')}</span>;
  if (days <= 0)
    return <Badge variant='destructive'>{t('common.expired')}</Badge>;
  if (days <= EXPIRES_SOON_DAYS)
    return (
      <Badge variant='destructive'>
        {t('common.expiresSoon', { count: days })}
      </Badge>
    );
  return (
    <span className='text-muted-foreground' title={expiresAt ?? undefined}>
      {t('common.daysLeft', { count: days })}
    </span>
  );
}

export function LastUsed({
  value,
}: {
  readonly value: string | null;
}): ReactElement {
  const { t, i18n } = useTranslation(API_KEYS_NAMESPACE);
  return (
    <span
      className='text-muted-foreground'
      title={value ? formatDate(value, i18n.language) : undefined}
    >
      {value ? relativeTime(value, i18n.language) : t('common.neverUsed')}
    </span>
  );
}

/** A request that failed: what the server's error code means when this page knows it, with a retry. */
export function ErrorAlert({
  error,
  onRetry,
}: {
  readonly error: unknown;
  readonly onRetry?: () => void;
}): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  const notFound = error instanceof ApiClientError && error.status === 404;
  return (
    <Alert variant='destructive'>
      <AlertDescription className='flex flex-wrap items-center gap-3'>
        <span>{notFound ? t('common.notFound') : t('common.loadFailed')}</span>
        {onRetry && !notFound ? (
          <Button type='button' size='sm' variant='outline' onClick={onRetry}>
            {t('common.retry')}
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

/** Asks before an action; the action button waits while `onConfirm` runs. */
export function ConfirmDialog({
  open,
  title,
  description,
  action,
  destructive = false,
  onCancel,
  onConfirm,
}: {
  readonly open: boolean;
  readonly title: string;
  readonly description: string;
  readonly action: string;
  readonly destructive?: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => Promise<void>;
}): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  const [busy, setBusy] = useState(false);
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next: boolean) => {
        if (!next && !busy) onCancel();
      }}
    >
      <AlertDialogContent size='sm'>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? 'destructive' : 'default'}
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void onConfirm().finally(() => setBusy(false));
            }}
          >
            {action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** The new value of a key just rotated, shown this once. */
export function RotatedKeyDialog({
  created,
  onClose,
}: {
  readonly created: CreatedApiKey | undefined;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  return (
    <AlertDialog
      open={created !== undefined}
      onOpenChange={(next: boolean) => {
        if (!next) onClose();
      }}
    >
      <AlertDialogContent className='sm:max-w-xl'>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('personal.rotated', { name: created?.key.name ?? '' })}
          </AlertDialogTitle>
        </AlertDialogHeader>
        {created ? <KeySecret secret={created.secret} /> : null}
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>
            {t('created.done')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
