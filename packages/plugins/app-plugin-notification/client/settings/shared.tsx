import type { ReactElement } from 'react';

import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import { useNotificationText } from '../text.js';
import type { Loaded } from './hooks.js';

/** A load in progress or failed, with a retry. */
export function LoadState({
  loaded,
  onRetry,
}: {
  readonly loaded: Exclude<Loaded<unknown>, { state: 'ready' }>;
  readonly onRetry: () => void;
}): ReactElement {
  const { t } = useNotificationText();
  if (loaded.state === 'loading')
    return (
      <p role='status' className='py-6 text-sm text-muted-foreground'>
        {t('settings.loading')}
      </p>
    );
  return (
    <div role='alert' className='space-y-3 rounded-lg border p-6 text-sm'>
      <p>{t(`settings.errors.${loaded.error}`)}</p>
      {loaded.error === 'failed' ? (
        <Button variant='outline' onClick={onRetry}>
          {t('settings.retryLoad')}
        </Button>
      ) : null}
    </div>
  );
}

const STATUS_VARIANT: Readonly<
  Record<string, 'secondary' | 'destructive' | 'outline' | 'default'>
> = {
  accepted: 'secondary',
  completed: 'secondary',
  failed: 'destructive',
  partial: 'destructive',
  unknown: 'outline',
  retrying: 'outline',
};

/** A delivery or attempt status in words. */
export function StatusBadge({
  status,
}: {
  /** A `NotificationStatus`, or an outcome the server adds later. */
  readonly status: string;
}): ReactElement {
  const { t } = useNotificationText();
  return (
    <Badge
      variant={STATUS_VARIANT[status] ?? 'outline'}
      className={
        status === 'retrying' || status === 'unknown'
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
          : undefined
      }
    >
      {t(`status.${status}`, { defaultValue: status })}
    </Badge>
  );
}
