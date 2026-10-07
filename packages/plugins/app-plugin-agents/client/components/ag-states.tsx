import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

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
export function AgListSkeleton({
  rows = 4,
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

/** A failed load with a retry button (none for 403, which retrying cannot fix). */
export function AgLoadError({
  title,
  error,
  onRetry,
}: {
  readonly title: string;
  readonly error: unknown;
  readonly onRetry?: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const status = error instanceof ApiClientError ? error.status : undefined;
  return (
    <Alert variant='destructive'>
      <AlertCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {status === 403
          ? t('common.forbidden')
          : status === 404
            ? t('common.notFound')
            : t('common.requestFailed')}
      </AlertDescription>
      {onRetry && status !== 403 ? (
        <AlertAction>
          <Button variant='outline' size='sm' onClick={onRetry}>
            {t('common.retry')}
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );
}

/** An empty list: icon, title, one sentence and an optional action. */
export function AgEmpty({
  icon,
  title,
  description,
  action,
}: {
  readonly icon: ReactNode;
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
}): ReactElement {
  return (
    <Empty className='min-h-48 border border-dashed'>
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

/** The heading of a settings tab section: title, one sentence, and actions on the right. */
export function SectionHeading({
  id,
  title,
  description,
  actions,
}: {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly actions?: ReactNode;
}): ReactElement {
  return (
    <div className='flex flex-wrap items-end justify-between gap-3'>
      <div className='min-w-0'>
        <h2 id={id} className='font-heading text-sm font-semibold'>
          {title}
        </h2>
        {description ? (
          <p className='text-sm text-muted-foreground'>{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className='flex shrink-0 items-center gap-2'>{actions}</div>
      ) : null}
    </div>
  );
}
