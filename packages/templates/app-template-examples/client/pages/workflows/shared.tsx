import { LoaderCircle } from 'lucide-react';
import { Link } from 'react-router';
import { Alert, AlertDescription } from '#components/ui/alert';
import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '#components/ui/button';
import { Skeleton } from '#components/ui/skeleton';

export function DataState({
  loading,
  data,
  status,
  retry,
}: {
  readonly loading: boolean;
  readonly data?: unknown;
  readonly status?: number;
  readonly retry: () => void;
}): ReactElement | null {
  const { t } = useTranslation();
  if (loading && data === undefined)
    return (
      <div
        aria-label={t('workflows.loading')}
        role='status'
        className='space-y-3'
      >
        <Skeleton className='h-8 w-full' />
        <Skeleton className='h-24 w-full' />
      </div>
    );
  if (loading)
    return (
      <div
        role='status'
        className='flex items-center gap-2 text-sm text-muted-foreground'
      >
        <LoaderCircle className='size-4 animate-spin' />
        {t('workflows.loading')}
      </div>
    );
  if (!status) return null;
  return (
    <Alert variant='destructive'>
      <AlertDescription>
        <p>
          {t(
            status === 403
              ? 'workflows.forbidden'
              : status === 404
                ? 'workflows.notFound'
                : status === 401
                  ? 'workflows.signIn'
                  : 'workflows.failed',
          )}
        </p>
        {status === 401 && (
          <Link to='/login' className='underline'>
            {t('workflows.signIn')}
          </Link>
        )}
        {status >= 500 && (
          <Button variant='outline' onClick={retry}>
            {t('workflows.retry')}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
