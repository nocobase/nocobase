import { TriangleAlertIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Alert, AlertDescription } from '../components/ui/alert.js';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog.js';
import { useNotificationChannelTypes } from '../extensions.js';
import { failureMessage, useNotificationText } from '../text.js';
import type {
  NotificationChannelView,
  NotificationDeliverySettings,
} from './api.js';
import {
  useCanManageNotifications,
  useLoaded,
  useSettingsApi,
} from './hooks.js';
import { LoadState } from './shared.js';

const CONFIG_EXAMPLE = `notification:
  channels:
    browser:
      type: web-push        # needs @nocobase/app-plugin-notification-web-push
    ops-feishu:
      type: feishu-webhook
      webhookUrl: \${FEISHU_WEBHOOK_URL}
  retry:
    maxAttempts: 3          # 3 by default
    intervalMs: 30000`;

/** Channels in `notification.channels`, with a test send to the administrator alone. */
export function ChannelsTab({
  onShowDeliveries,
}: {
  /** Opens the delivery log filtered to one channel's failures. */
  readonly onShowDeliveries: (channel: string) => void;
}): ReactElement {
  const api = useSettingsApi();
  const { t } = useNotificationText();
  const canManage = useCanManageNotifications();
  const [loaded, reload] = useLoaded(() => api.channels(), 'channels');
  const [testing, setTesting] = useState<NotificationChannelView | null>(null);
  if (loaded.state !== 'ready')
    return <LoadState loaded={loaded} onRetry={reload} />;
  const { data: channels, meta } = loaded.data;
  const failing = channels.filter((channel) => channel.last24h.failed > 0);
  return (
    <div className='min-w-0 space-y-6'>
      {failing.map((channel) => (
        <Alert key={channel.name}>
          <TriangleAlertIcon />
          <AlertDescription className='flex flex-wrap items-center gap-x-2'>
            <span>
              {t('channels.failing', {
                channel: channel.name,
                count: channel.last24h.failed,
              })}
            </span>
            <Button
              variant='link'
              size='sm'
              className='h-auto p-0'
              onClick={() => onShowDeliveries(channel.name)}
            >
              {t('channels.showFailures')}
            </Button>
          </AlertDescription>
        </Alert>
      ))}
      {channels.length ? (
        <ul
          aria-label={t('channels.title')}
          className='divide-y rounded-lg border'
        >
          <li
            aria-hidden
            className='hidden gap-4 px-4 py-2 text-xs font-medium text-muted-foreground lg:grid lg:grid-cols-[minmax(8rem,1fr)_minmax(14rem,2fr)_minmax(10rem,1fr)_8rem_6rem]'
          >
            <span>{t('channels.columns.name')}</span>
            <span>{t('channels.columns.type')}</span>
            <span>{t('channels.columns.contributor')}</span>
            <span>{t('channels.columns.last24h')}</span>
            <span />
          </li>
          {channels.map((channel) => (
            <ChannelRow
              key={channel.name}
              channel={channel}
              canTest={canManage && channel.testable && channel.enabled}
              onTest={() => setTesting(channel)}
            />
          ))}
        </ul>
      ) : (
        <p
          role='status'
          className='rounded-lg border p-8 text-center text-sm text-muted-foreground'
        >
          {t('channels.empty')}
        </p>
      )}
      <details className='rounded-lg border p-4 text-sm'>
        <summary className='cursor-pointer font-medium'>
          {t('channels.howTo')}
        </summary>
        <pre className='mt-3 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs'>
          {CONFIG_EXAMPLE}
        </pre>
        <p className='mt-2 text-muted-foreground'>{t('channels.howToHint')}</p>
      </details>
      <DeliverySettings settings={meta.delivery} />
      <TestDialog channel={testing} onClose={() => setTesting(null)} />
    </div>
  );
}

function ChannelRow({
  channel,
  canTest,
  onTest,
}: {
  readonly channel: NotificationChannelView;
  readonly canTest: boolean;
  readonly onTest: () => void;
}): ReactElement {
  const { t, text } = useNotificationText();
  const display = useNotificationChannelTypes().get(channel.type);
  const Icon = display?.icon;
  const typeName = display
    ? text(display.title)
    : channel.typeLabel
      ? text(channel.typeLabel)
      : channel.type;
  const { accepted, failed } = channel.last24h;
  return (
    <li className='grid gap-3 px-4 py-3 text-sm lg:grid-cols-[minmax(8rem,1fr)_minmax(14rem,2fr)_minmax(10rem,1fr)_8rem_6rem] lg:items-center lg:gap-4'>
      <div className='min-w-0'>
        <p className='font-medium break-all'>{channel.name}</p>
        <p className='text-xs text-muted-foreground'>
          {channel.enabled
            ? channel.reachesUsers
              ? t('channels.reachesUsers')
              : t('channels.groupOnly')
            : t('channels.disabled')}
        </p>
      </div>
      <div className='min-w-0 space-y-1'>
        <p className='flex items-center gap-1.5 font-medium'>
          {Icon ? <Icon className='size-4 text-muted-foreground' /> : null}
          <span>{typeName}</span>
          <code className='text-xs font-normal text-muted-foreground'>
            {channel.type}
          </code>
        </p>
        {display?.Summary ? (
          <display.Summary channel={channel} />
        ) : channel.summary.length ? (
          <dl className='flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground'>
            {channel.summary.map((item) => (
              <div
                key={`${text(item.label)}:${item.value}`}
                className='flex min-w-0 gap-1'
              >
                <dt>{text(item.label)}</dt>
                <dd className='font-mono break-all text-foreground/80'>
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      <p className='min-w-0 font-mono text-xs break-all text-muted-foreground'>
        <span className='lg:hidden'>{t('channels.columns.contributor')}: </span>
        {channel.contributor ?? '—'}
      </p>
      <div className='flex flex-wrap items-center gap-1.5'>
        <span className='text-xs text-muted-foreground lg:hidden'>
          {t('channels.columns.last24h')}:
        </span>
        {failed > 0 ? (
          <Badge variant='destructive'>
            {t('channels.failedCount', { count: failed })}
          </Badge>
        ) : null}
        <span className='text-xs'>
          {t('channels.acceptedCount', { count: accepted })}
        </span>
      </div>
      <div className='lg:text-right'>
        {canTest ? (
          <Button variant='outline' size='sm' onClick={onTest}>
            {t('channels.test')}
          </Button>
        ) : null}
      </div>
    </li>
  );
}

function DeliverySettings({
  settings,
}: {
  readonly settings: NotificationDeliverySettings;
}): ReactElement {
  const { t } = useNotificationText();
  const source = (configured: boolean) =>
    t(configured ? 'channels.fromConfig' : 'channels.fromDefault');
  return (
    <section
      aria-labelledby='notification-delivery-settings'
      className='space-y-2'
    >
      <h2 id='notification-delivery-settings' className='text-sm font-medium'>
        {t('channels.delivery.title')}
      </h2>
      <dl className='divide-y rounded-lg border text-sm'>
        <div className='grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr]'>
          <dt className='font-medium'>{t('channels.delivery.retry')}</dt>
          <dd className='space-y-0.5'>
            <p>
              {t('channels.delivery.retryValue', {
                count: settings.retry.maxAttempts,
                seconds: Math.round(settings.retry.intervalMs / 1000),
              })}{' '}
              <Badge variant='outline'>
                {source(settings.retry.configured)}
              </Badge>
            </p>
            <p className='text-xs text-muted-foreground'>
              {t('channels.delivery.retryHint')}
            </p>
          </dd>
        </div>
        <div className='grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr]'>
          <dt className='font-medium'>{t('channels.delivery.jobs')}</dt>
          <dd className='space-y-0.5'>
            <p>
              <code>{settings.jobs ?? 'jobs.default'}</code>{' '}
              <Badge variant='outline'>
                {source(settings.jobs !== undefined)}
              </Badge>
            </p>
            <p className='text-xs text-muted-foreground'>
              {t('channels.delivery.jobsHint')}
            </p>
          </dd>
        </div>
      </dl>
    </section>
  );
}

function TestDialog({
  channel,
  onClose,
}: {
  readonly channel: NotificationChannelView | null;
  readonly onClose: () => void;
}): ReactElement {
  const api = useSettingsApi();
  const { t, text } = useNotificationText();
  const display = useNotificationChannelTypes().get(channel?.type ?? '');
  const [state, setState] = useState<
    | { readonly state: 'idle' }
    | { readonly state: 'sending' }
    | { readonly state: 'sent'; readonly notificationId: string }
    | { readonly state: 'failed'; readonly message: string }
  >({ state: 'idle' });
  const close = () => {
    setState({ state: 'idle' });
    onClose();
  };
  const send = () => {
    if (!channel) return;
    setState({ state: 'sending' });
    api.testChannel(channel.name).then(
      (result) =>
        setState({ state: 'sent', notificationId: result.notificationId }),
      (cause: unknown) =>
        setState({
          state: 'failed',
          message: failureMessage(cause, t('channels.testFailed')),
        }),
    );
  };
  return (
    <Dialog
      open={channel !== null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>
            {t('channels.testTitle', { channel: channel?.name ?? '' })}
          </DialogTitle>
          <DialogDescription>
            {display?.testHint
              ? text(display.testHint)
              : t(
                  channel?.reachesUsers
                    ? 'channels.testToYou'
                    : 'channels.testToGroup',
                )}
          </DialogDescription>
        </DialogHeader>
        {state.state === 'sent' ? (
          <p role='status' className='text-sm'>
            {t('channels.testSent', { id: state.notificationId })}
          </p>
        ) : state.state === 'failed' ? (
          <p role='alert' className='text-sm text-destructive'>
            {state.message}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant='outline' onClick={close}>
            {t(state.state === 'sent' ? 'common.close' : 'common.cancel')}
          </Button>
          {state.state === 'sent' ? null : (
            <Button disabled={state.state === 'sending'} onClick={send}>
              {t('channels.testSend')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
