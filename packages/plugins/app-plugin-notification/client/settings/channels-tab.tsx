import { ChevronRightIcon } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../components/ui/collapsible.js';
import { useState, type ReactElement } from 'react';

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
    inbox:
      type: in-app`;

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
  return (
    <div className='min-w-0 space-y-6'>
      {channels.length ? (
        <ul
          aria-label={t('channels.title')}
          className='divide-y rounded-lg border'
        >
          <li
            aria-hidden
            className='hidden gap-4 px-4 py-2 text-xs font-medium text-muted-foreground lg:grid lg:grid-cols-[minmax(12rem,2fr)_minmax(9rem,1fr)_minmax(10rem,1fr)_auto]'
          >
            <span>{t('channels.columns.name')}</span>
            <span>{t('templates.recipients')}</span>
            <span>{t('channels.columns.last24h')}</span>
            <span />
          </li>
          {channels.map((channel) => (
            <ChannelRow
              key={channel.name}
              channel={channel}
              canTest={canManage && channel.testable && channel.enabled}
              onFailures={() => onShowDeliveries(channel.name)}
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
      <Collapsible className='rounded-lg border p-4 text-sm'>
        <CollapsibleTrigger className='group inline-flex items-center gap-1 text-left font-medium'>
          <ChevronRightIcon
            aria-hidden
            className='size-4 shrink-0 group-aria-expanded:rotate-90'
          />
          {t('channels.howTo')}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <pre className='mt-3 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs'>
            {CONFIG_EXAMPLE}
          </pre>
          <p className='mt-2 text-muted-foreground'>
            {t('channels.howToHint')}
          </p>
        </CollapsibleContent>
      </Collapsible>
      <DeliverySettings settings={meta.delivery} />
      <TestDialog
        key={testing?.name ?? 'closed'}
        channel={testing}
        onClose={() => setTesting(null)}
      />
    </div>
  );
}

function ChannelRow({
  channel,
  canTest,
  onFailures,
  onTest,
}: {
  readonly channel: NotificationChannelView;
  readonly canTest: boolean;
  readonly onFailures: () => void;
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
    <li className='grid gap-3 px-4 py-3 text-sm lg:grid-cols-[minmax(12rem,2fr)_minmax(9rem,1fr)_minmax(10rem,1fr)_auto] lg:items-center lg:gap-4'>
      <Collapsible className='min-w-0'>
        <CollapsibleTrigger className='group inline-flex items-center gap-1 text-left font-medium'>
          <ChevronRightIcon
            aria-hidden
            className='size-4 shrink-0 group-aria-expanded:rotate-90'
          />
          {Icon ? <Icon aria-hidden className='mr-1 inline size-4' /> : null}
          {display
            ? typeName
            : t(`channelTypes.${channel.channelType}`, {
                defaultValue: typeName,
              })}
          <code className='ml-2 text-xs font-normal text-muted-foreground'>
            {channel.name}
          </code>
          {!channel.enabled && (
            <Badge variant='outline'>{t('channels.disabled')}</Badge>
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className='mt-2 space-y-1 text-xs text-muted-foreground'>
            <p>
              {t('channels.columns.type')}: {typeName} · {channel.type}
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
            <p className='min-w-0 font-mono text-xs break-all text-muted-foreground'>
              <span className='font-sans'>
                {t('channels.columns.contributor')}:{' '}
              </span>
              {channel.contributor ?? '—'}
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
      <span>
        {channel.reachesUsers
          ? t('channels.reachesUsers')
          : t('channels.groupOnly')}
      </span>
      <div className='flex flex-wrap items-center gap-1.5'>
        <span className='text-xs text-muted-foreground lg:hidden'>
          {t('channels.columns.last24h')}:
        </span>
        {failed > 0 ? (
          <Button
            variant='link'
            size='sm'
            className='h-auto p-0 text-destructive'
            onClick={onFailures}
          >
            {t('channels.failedCount', { count: failed })}
          </Button>
        ) : null}
        <span className='text-xs'>
          {t('channels.acceptedCount', { count: accepted })}
          {channel.last24h.pending > 0 &&
            ` · ${t('status.pending')} ${channel.last24h.pending}`}
          {channel.last24h.unknown > 0 &&
            ` · ${t('status.unknown')} ${channel.last24h.unknown}`}
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
    <Collapsible className='rounded-lg border p-4 text-sm'>
      <CollapsibleTrigger className='group inline-flex items-center gap-1 text-left font-medium'>
        <ChevronRightIcon
          aria-hidden
          className='size-4 shrink-0 group-aria-expanded:rotate-90'
        />
        {t('channels.delivery.title')}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <dl className='divide-y rounded-lg border text-sm'>
          <div className='grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr]'>
            <dt className='font-medium'>{t('channels.delivery.retry')}</dt>
            <dd className='space-y-0.5'>
              <p>
                {settings.retry.maxAttempts === 1
                  ? t('channels.delivery.noRetry')
                  : t('channels.delivery.retryValue', {
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
      </CollapsibleContent>
    </Collapsible>
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
    | {
        readonly state: 'sent';
        readonly notificationId: string;
        readonly status: string;
      }
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
        setState({
          state: 'sent',
          notificationId: result.notificationId,
          status: result.status,
        }),
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
            {t('channels.testSent', { id: state.notificationId })} ·{' '}
            {t(`status.${state.status}`, { defaultValue: state.status })}
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
