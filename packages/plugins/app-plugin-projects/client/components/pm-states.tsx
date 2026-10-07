import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from './ui/alert.js';
import { Button } from './ui/button.js';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './ui/empty.js';
import { Skeleton } from './ui/skeleton.js';
import { cn } from 'cn';

/**
 * The loading, empty and error states every page of this plugin shares, so a list, a card grid and a detail
 * page look the same while waiting, when empty and when a request fails.
 */

/** Rows shaped like a table while it loads. */
export function PmListSkeleton({
  rows = 6,
  className,
}: {
  readonly rows?: number;
  readonly className?: string;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div
      role='status'
      aria-label={t('common.loading')}
      className={cn('space-y-2 rounded-lg border bg-card p-3', className)}
    >
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className='h-7 w-full' />
      ))}
    </div>
  );
}

/** A detail page's heading and blocks while it loads. */
export function PmDetailSkeleton(): ReactElement {
  const { t } = useTranslation();
  return (
    <div
      role='status'
      aria-label={t('common.loading')}
      className='space-y-4 px-6 py-6 md:px-8'
    >
      <Skeleton className='h-4 w-40' />
      <Skeleton className='h-8 w-1/2' />
      <Skeleton className='h-24 w-full' />
      <Skeleton className='h-40 w-full' />
    </div>
  );
}

/** The localized sentence for a failed request: forbidden, not found, or a generic failure. */
function npErrorKey(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 403) return 'common.forbidden';
    if (error.status === 404) return 'states.notFound';
  }
  return 'common.requestFailed';
}

/** A failed load with a retry button (none for 403, which retrying cannot fix). */
export function PmLoadError({
  title,
  error,
  onRetry,
  action,
  notFound,
}: {
  readonly title: string;
  readonly error: unknown;
  readonly onRetry?: () => void;
  /** Replaces the generic not-found sentence, for example one that names the kind of record. */
  readonly notFound?: string;
  /** Replaces the retry button, for example "back to the list" on a 404. */
  readonly action?: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  const forbidden = error instanceof ApiClientError && error.status === 403;
  return (
    <Alert variant='destructive'>
      <AlertCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {notFound && npErrorKey(error) === 'states.notFound'
          ? notFound
          : t(npErrorKey(error))}
      </AlertDescription>
      {action ? (
        <AlertAction>{action}</AlertAction>
      ) : onRetry && !forbidden ? (
        <AlertAction>
          <Button variant='outline' size='sm' onClick={onRetry}>
            {t('common.retry')}
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );
}

/** An empty list or panel: icon, title, one sentence and an optional action. */
export function PmEmpty({
  icon,
  title,
  description,
  action,
  className,
}: {
  readonly icon: ReactNode;
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
  readonly className?: string;
}): ReactElement {
  return (
    <Empty className={cn('min-h-48 border border-dashed', className)}>
      <EmptyHeader>
        <EmptyMedia variant='icon'>{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description ? (
          <EmptyDescription>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
