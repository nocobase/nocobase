/**
 * The loading, empty and error states of this plugin's pages, drawn like the application's other lists (the projects
 * plugin's `PmListSkeleton`, `PmEmpty` and `PmLoadError`).
 */
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import { errorText } from '../lib/errors.js';
import { cn } from 'cn';
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

/** Rows shaped like a table while it loads. */
export function ListSkeleton({
  rows = 4,
  className,
}: {
  readonly rows?: number;
  readonly className?: string;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <div
      role='status'
      aria-label={t('status.loading')}
      className={cn('space-y-2 rounded-lg border bg-card p-3', className)}
    >
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className='h-7 w-full' />
      ))}
    </div>
  );
}

/** A failed load, in words, with a retry button. */
export function LoadError({
  title,
  error,
  onRetry,
}: {
  readonly title: string;
  readonly error: unknown;
  readonly onRetry?: () => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <Alert variant='destructive'>
      <AlertCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {errorText(t, error, t('ui.errors.requestFailed'))}
      </AlertDescription>
      {onRetry ? (
        <AlertAction>
          <Button variant='outline' size='sm' onClick={onRetry}>
            {t('ui.common.retry')}
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );
}

/** An empty list: icon, title, one sentence and an optional action. */
export function EmptyState({
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
