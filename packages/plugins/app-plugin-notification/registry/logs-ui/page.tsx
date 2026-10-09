import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { ChevronDown, FileClock, RefreshCw } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '#components/ui/alert';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';
import {
  fetchNotificationLogs,
  type NotificationDeliveryDetails,
  type NotificationLogDetails,
  type NotificationStatus,
} from './api.js';

type Translate = (
  key: string,
  options?: Readonly<Record<string, unknown>>,
) => string;

export function NotificationLogsPage(): React.ReactElement {
  const api = useApiClient();
  const { t } = useTranslation('@nocobase/app-plugin-notification');

  const [logs, setLogs] = useState<readonly NotificationLogDetails[]>([]);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const refresh = (): void => {
    setLoading(true);
    setError(undefined);
    setRevision((value) => value + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchNotificationLogs(api, controller.signal)
      .then(setLogs)
      .catch((reason: Error) => {
        if (reason.name !== 'AbortError') setError(reason.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [api, revision]);

  const totals = useMemo(
    () => ({
      deliveries: logs.reduce((sum, item) => sum + item.deliveries.length, 0),
      attention: logs.filter((item) =>
        ['failed', 'partial', 'unknown'].includes(item.log.status),
      ).length,
    }),
    [logs],
  );

  return (
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-5'>
      <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <div className='mb-2 flex items-center gap-2 text-sm font-medium text-primary'>
            <FileClock className='size-4' />{' '}
            {t('logs.deliveryOperations', {
              defaultValue: 'Delivery operations',
            })}
          </div>
          <h1 className='text-2xl font-semibold tracking-tight'>
            {t('logs.title', { defaultValue: 'Notification logs' })}
          </h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            {t('logs.recipeDescription', {
              defaultValue:
                'Trace each channel handoff and every provider attempt.',
            })}
          </p>
        </div>
        <div>
          <Button variant='outline' onClick={refresh}>
            <RefreshCw className={loading ? 'animate-spin' : undefined} />

            {t('logs.refresh', { defaultValue: 'Refresh' })}
          </Button>
        </div>
      </header>

      <div className='grid grid-cols-2 gap-3 sm:max-w-md'>
        <Metric
          label={t('logs.deliveriesShown', {
            defaultValue: 'Deliveries shown',
          })}
          value={totals.deliveries}
        />
        <Metric
          label={t('logs.needAttention', { defaultValue: 'Need attention' })}
          value={totals.attention}
          attention
        />
      </div>

      {error ? (
        <Alert variant='destructive'>
          <AlertTitle>
            {t('logs.unavailable', { defaultValue: 'Logs unavailable' })}
          </AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card className='gap-0 overflow-hidden py-0'>
        <CardHeader className='border-b bg-muted/20 py-4'>
          <CardTitle className='text-base'>
            {t('logs.recent', { defaultValue: 'Recent notifications' })}
          </CardTitle>
          <CardDescription>
            {t('logs.redacted', {
              defaultValue:
                'Message bodies, recipients, and lease tokens are redacted.',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          {loading ? (
            <div className='p-12 text-center text-sm text-muted-foreground'>
              {t('logs.loading', { defaultValue: 'Loading delivery history…' })}
            </div>
          ) : logs.length === 0 ? (
            <div className='grid place-items-center gap-2 p-12 text-center'>
              <div className='grid size-12 place-items-center rounded-full bg-muted'>
                <FileClock className='size-5 text-muted-foreground' />
              </div>
              <p className='font-medium'>
                {t('logs.emptyTitle', { defaultValue: 'No deliveries yet' })}
              </p>
              <p className='text-sm text-muted-foreground'>
                {t('logs.emptyDescription', {
                  defaultValue:
                    'Delivery records will appear here after notifications are sent.',
                })}
              </p>
            </div>
          ) : (
            <NotificationLogsTable logs={logs} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  attention = false,
}: {
  readonly label: string;
  readonly value: number;
  readonly attention?: boolean;
}): React.ReactElement {
  return (
    <div className='rounded-xl border bg-card px-4 py-3'>
      <div
        className={`text-2xl font-semibold tabular-nums ${attention && value > 0 ? 'text-destructive' : ''}`}
      >
        {value}
      </div>
      <div className='text-xs text-muted-foreground'>{label}</div>
    </div>
  );
}

function NotificationLogsTable(props: {
  readonly logs: readonly NotificationLogDetails[];
}): React.ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-notification');
  const { logs } = props;

  return (
    <Table className='min-w-[860px]'>
      <TableHeader className='bg-muted/35'>
        <TableRow className='hover:bg-muted/35'>
          <TableHead
            className='w-12'
            aria-label={t('logs.expand', {
              defaultValue: 'Expand notification',
            })}
          />
          <TableHead>
            {t('logs.columns.source', { defaultValue: 'Source' })}
          </TableHead>
          <TableHead>
            {t('logs.columns.notificationId', {
              defaultValue: 'Notification ID',
            })}
          </TableHead>
          <TableHead>
            {t('logs.columns.status', { defaultValue: 'Status' })}
          </TableHead>
          <TableHead className='text-right'>
            {t('logs.columns.deliveries', { defaultValue: 'Deliveries' })}
          </TableHead>
          <TableHead>
            {t('logs.columns.created', { defaultValue: 'Created' })}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((details) => (
          <NotificationTableRow key={details.log.id} details={details} />
        ))}
      </TableBody>
    </Table>
  );
}

function NotificationTableRow(props: {
  readonly details: NotificationLogDetails;
}): React.ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-notification');
  const { details } = props;

  const [open, setOpen] = useState(false);
  return (
    <Fragment>
      <TableRow aria-expanded={open}>
        <TableCell>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={
              open
                ? t('logs.collapse', { defaultValue: 'Collapse notification' })
                : t('logs.expand', { defaultValue: 'Expand notification' })
            }
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <ChevronDown
              className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </Button>
        </TableCell>
        <TableCell>
          <div className='font-medium'>{details.log.sourceType}</div>
          {details.log.sourceReferenceId ? (
            <div className='mt-0.5 max-w-48 truncate text-xs text-muted-foreground'>
              {details.log.sourceReferenceId}
            </div>
          ) : null}
        </TableCell>
        <TableCell>
          <code
            className='text-xs text-muted-foreground'
            title={details.log.id}
          >
            {details.log.id}
          </code>
        </TableCell>
        <TableCell>
          <StatusBadge status={details.log.status} />
        </TableCell>
        <TableCell className='text-right tabular-nums'>
          {details.deliveries.length}
        </TableCell>
        <TableCell className='whitespace-nowrap text-muted-foreground'>
          <time dateTime={details.log.createdAt}>
            {formatTime(details.log.createdAt)}
          </time>
        </TableCell>
      </TableRow>
      {open ? (
        <TableRow className='bg-muted/15 hover:bg-muted/15'>
          <TableCell colSpan={6} className='p-4 sm:px-12'>
            <DeliveryTable deliveries={details.deliveries} />
          </TableCell>
        </TableRow>
      ) : null}
    </Fragment>
  );
}

function DeliveryTable(props: {
  readonly deliveries: readonly NotificationDeliveryDetails[];
}): React.ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-notification');
  const { deliveries } = props;

  if (deliveries.length === 0) {
    return (
      <p className='py-4 text-center text-sm text-muted-foreground'>
        {t('logs.noDeliveries', { defaultValue: 'No deliveries recorded.' })}
      </p>
    );
  }

  return (
    <div className='overflow-hidden rounded-lg border bg-background'>
      <Table className='min-w-[760px]'>
        <TableHeader className='bg-muted/35'>
          <TableRow className='hover:bg-muted/35'>
            <TableHead>
              {t('logs.columns.channel', { defaultValue: 'Channel' })}
            </TableHead>
            <TableHead>
              {t('logs.columns.provider', { defaultValue: 'Provider' })}
            </TableHead>
            <TableHead>
              {t('logs.columns.status', { defaultValue: 'Status' })}
            </TableHead>
            <TableHead className='text-right'>
              {t('logs.columns.attempts', { defaultValue: 'Attempts' })}
            </TableHead>
            <TableHead>
              {t('logs.columns.updated', { defaultValue: 'Updated' })}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deliveries.map((details) => (
            <Fragment key={details.delivery.id}>
              <TableRow>
                <TableCell>
                  <Badge variant='outline'>
                    {details.delivery.channelName}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className='font-medium'>
                    {details.delivery.providerType}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={details.delivery.status} />
                </TableCell>
                <TableCell className='text-right tabular-nums'>
                  {details.attempts.length}
                </TableCell>
                <TableCell className='whitespace-nowrap text-muted-foreground'>
                  {formatTime(details.delivery.updatedAt)}
                </TableCell>
              </TableRow>
              <TableRow className='bg-muted/10 hover:bg-muted/10'>
                <TableCell colSpan={5} className='px-4 py-3'>
                  <AttemptTable details={details} />
                </TableCell>
              </TableRow>
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function AttemptTable(props: {
  readonly details: NotificationDeliveryDetails;
}): React.ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-notification');
  const { details } = props;

  if (details.attempts.length === 0) {
    return (
      <p className='text-xs text-muted-foreground'>
        {t('logs.noAttempts', { defaultValue: 'No attempts recorded.' })}
      </p>
    );
  }

  return (
    <div>
      <div className='mb-2 text-xs font-medium text-muted-foreground'>
        {t('logs.providerAttempts', { defaultValue: 'Provider attempts' })}
      </div>
      <div className='grid gap-1.5'>
        {details.attempts.map((attempt) => (
          <div
            key={attempt.id}
            className='grid grid-cols-[2.5rem_minmax(8rem,1fr)_auto] items-center gap-3 rounded-md bg-muted/35 px-3 py-2 text-xs'
          >
            <span className='font-mono text-muted-foreground'>
              #{attempt.sequence}
            </span>
            <span className='min-w-0'>
              <strong>{attempt.providerType}</strong>
              {attempt.error ? (
                <span className='mt-1 block truncate text-destructive'>
                  {providerErrorMessage(t, attempt.error)}
                </span>
              ) : null}
            </span>
            <StatusBadge status={attempt.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { readonly status: NotificationStatus }) {
  const { t } = useTranslation('@nocobase/app-plugin-notification');
  const tone = statusTone(status);
  return (
    <Badge className={tone.badge}>
      {t(`status.${status}`, { defaultValue: status.replace('_', ' ') })}
    </Badge>
  );
}

function statusTone(status: NotificationStatus): {
  readonly badge: string;
} {
  if (status === 'completed' || status === 'accepted')
    return {
      badge:
        'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    };
  if (status === 'failed' || status === 'unknown' || status === 'partial')
    return {
      badge: 'border-destructive/20 bg-destructive/10 text-destructive',
    };
  return {
    badge:
      'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  };
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function providerErrorMessage(
  t: Translate,
  error: { readonly message: string; readonly code?: string },
): string {
  if (
    error.code === 'IN_APP_NOTIFICATION_RECIPIENT_NOT_FOUND' ||
    error.message === 'In-app notification recipient does not exist.'
  )
    return t('errors.inAppRecipientNotFound', {
      defaultValue: 'In-app notification recipient does not exist.',
    });
  return error.message;
}
