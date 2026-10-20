import type { ReactElement, ReactNode } from 'react';
import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Link } from 'react-router';
import { errorKey, type DemoWatch } from '../hooks/demo.js';
import { Card, CardContent, CardDescription, CardHeader } from './ui/card.js';
import { Alert, AlertDescription } from './ui/alert.js';
import { Button } from './ui/button.js';

export function DemoPanel({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Card role='region' aria-labelledby={`${name}-title`} className='min-w-0'>
      <CardHeader>
        <h2 id={`${name}-title`} className='text-base font-medium'>
          {t(`${name}.title`)}
        </h2>
        <CardDescription>{t(`${name}.description`)}</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>{children}</CardContent>
    </Card>
  );
}

export function Metric({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}): ReactElement {
  return (
    <div className='flex min-w-0 flex-wrap items-baseline justify-between gap-2 text-sm'>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className='min-w-0 break-all font-mono'>{children}</dd>
    </div>
  );
}

export function WatchStatus({ watch }: { watch: DemoWatch }): ReactElement {
  const { t } = useTranslation();
  return (
    <dl className='flex flex-col gap-2'>
      <Metric label={t('subscription')}>{t(`states.${watch.state}`)}</Metric>
      <Metric label={t('events')}>{watch.events}</Metric>
      <Metric label={t('ready')}>{watch.ready}</Metric>
      {watch.error ? (
        <div
          role='status'
          className='break-all font-mono text-sm text-destructive'
        >
          {watch.error}
        </div>
      ) : null}
    </dl>
  );
}

export function Failure({
  error,
  retry,
  reload,
}: {
  error: unknown;
  retry?: () => void;
  reload?: () => void;
}): ReactElement | null {
  const { t } = useTranslation();
  if (!error) return null;
  const status = error instanceof ApiClientError ? error.status : undefined;
  return (
    <Alert variant='destructive'>
      <AlertDescription>{t(errorKey(error))}</AlertDescription>
      {status === 401 ? (
        <Link to='/login' className='text-sm underline'>
          {t('signIn')}
        </Link>
      ) : status === 404 && reload ? (
        <Button variant='outline' onClick={reload}>
          {t('reload')}
        </Button>
      ) : status !== 403 && status !== 404 && retry ? (
        <Button variant='outline' onClick={retry}>
          {t('retry')}
        </Button>
      ) : null}
    </Alert>
  );
}

export function Topic({ children }: { children: string }): ReactElement {
  const { t } = useTranslation();
  return (
    <dl>
      <Metric label={t('topic')}>{children}</Metric>
    </dl>
  );
}
