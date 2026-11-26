import { useState, type ReactElement } from 'react';

import { copyText } from '@nocobase/app-client';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs.js';
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
  NotificationSettingsApi,
  NotificationChannelView,
} from './api.js';
import {
  useCanManageNotifications,
  type Loaded,
  useSettingsApi,
} from './hooks.js';
import { LoadState } from './shared.js';

/** Channels in `notification.channels`, with a test send to the administrator alone. */
export function ChannelsTab({
  onShowDeliveries,
  onShowTest,
  loaded,
  reload,
}: {
  readonly loaded: Loaded<
    Awaited<ReturnType<NotificationSettingsApi['channels']>>
  >;
  readonly onShowTest: (channel: string, id: string) => void;
  readonly reload: () => void;
  /** Opens the delivery log filtered to one channel's failures. */
  readonly onShowDeliveries: (channel: string) => void;
}): ReactElement {
  const { t } = useNotificationText();
  const canManage = useCanManageNotifications();
  const [guide, setGuide] = useState(false);
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
            className='hidden gap-4 px-4 py-2 text-xs font-medium text-muted-foreground lg:grid lg:grid-cols-[minmax(9rem,1.2fr)_minmax(6rem,.8fr)_minmax(10rem,1.5fr)_minmax(6rem,1fr)_4rem]'
          >
            <span>{t('channels.columns.name')}</span>
            <span>{t('templates.recipients')}</span>
            <span>{t('channels.configuration')}</span>
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
      <div className='flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground'>
        <span>
          {meta.delivery.retry.maxAttempts === 1
            ? t('channels.delivery.noRetry')
            : t('channels.delivery.retryValue', {
                count: meta.delivery.retry.maxAttempts,
                seconds: meta.delivery.retry.intervalMs / 1000,
              })}{' '}
          ·{' '}
          {t(
            meta.delivery.retry.configured
              ? 'channels.fromConfig'
              : 'channels.fromDefault',
          )}
        </span>
        <Button size='sm' variant='outline' onClick={() => setGuide(true)}>
          {t('channels.guideTitle')}
        </Button>
      </div>
      {guide && (
        <ChannelGuide
          jobs={meta.delivery.jobs}
          onClose={() => setGuide(false)}
        />
      )}
      <TestDialog
        key={testing?.name ?? 'closed'}
        channel={testing}
        onShowTest={onShowTest}
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
    <li className='grid gap-3 px-4 py-3 text-sm lg:grid-cols-[minmax(9rem,1.2fr)_minmax(6rem,.8fr)_minmax(10rem,1.5fr)_minmax(6rem,1fr)_4rem] lg:items-center lg:gap-4'>
      <div className='min-w-0'>
        <p className='flex items-center gap-2 font-medium'>
          {Icon && <Icon aria-hidden className='size-4' />}
          {display
            ? typeName
            : t(`channelTypes.${channel.channelType}`, {
                defaultValue: typeName,
              })}
          {!channel.enabled && (
            <Badge variant='outline'>{t('channels.disabled')}</Badge>
          )}
        </p>
        <code className='block break-all text-xs text-muted-foreground'>
          {channel.name}
        </code>
      </div>
      <span>
        {t(
          channel.reachesUsers ? 'channels.reachesUsers' : 'channels.groupOnly',
        )}
      </span>
      <div className='min-w-0 text-xs text-muted-foreground'>
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
        ) : channel.type === 'in-app' ? (
          t('channels.builtin')
        ) : (
          typeName
        )}
      </div>
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

const guideTypes = [
  'email',
  'feishu-webhook',
  'dingtalk-webhook',
  'web-push',
  'sms',
  'retry',
] as const;
const guideFields = {
  email: 'notification.channels · type: email · mailer',
  'feishu-webhook': 'notification.channels · type: feishu-webhook · webhookUrl',
  'dingtalk-webhook':
    'notification.channels · type: dingtalk-webhook · webhookUrl',
  'web-push': 'notification.channels · type: web-push · WEB_PUSH_PRIVATE_KEY',
  sms: 'notification.channels · type: sms · service · signName · templates · SMS_ALIYUN_ACCESS_KEY_SECRET',
  retry: 'notification.retry.maxAttempts · notification.retry.intervalMs',
} as const;
function ChannelGuide({
  jobs,
  onClose,
}: {
  readonly jobs?: string;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useNotificationText();
  const [type, setType] = useState<(typeof guideTypes)[number]>('email');
  const [copied, setCopied] = useState<boolean | null>(null);
  const prompt = t(
    type === 'retry' ? 'channels.retryPrompt' : 'channels.agentPrompt',
    { type: t(`channels.guideTypes.${type}`), fields: guideFields[type] },
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{t('channels.guideTitle')}</DialogTitle>
          <DialogDescription>{t('channels.howToHint')}</DialogDescription>
        </DialogHeader>
        <Tabs
          value={type}
          onValueChange={(value) => {
            setType(value as typeof type);
            setCopied(null);
          }}
        >
          <TabsList className='h-auto max-w-full flex-wrap'>
            {guideTypes.map((item) => (
              <TabsTrigger key={item} value={item}>
                {t(`channels.guideTypes.${item}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <section className='rounded-lg border'>
          <div className='flex items-center justify-between gap-3 border-b bg-muted/50 px-3 py-2'>
            <h3 className='font-medium'>{t('channels.promptTitle')}</h3>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                copyText(prompt).then(setCopied, () => setCopied(false));
              }}
            >
              {t('channels.copyPrompt')}
            </Button>
          </div>
          <pre className='whitespace-pre-wrap break-words p-3 font-sans text-sm leading-relaxed'>
            {prompt}
          </pre>
        </section>
        {copied !== null && (
          <span role='status'>
            {t(copied ? 'channels.copied' : 'channels.manualCopy')}
          </span>
        )}
        {type === 'retry' && (
          <p className='text-xs text-muted-foreground'>
            {t('channels.delivery.jobs')}: {jobs ?? 'jobs.default'}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TestDialog({
  channel,
  onClose,
  onShowTest,
}: {
  readonly channel: NotificationChannelView | null;
  readonly onShowTest: (channel: string, id: string) => void;
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
          {state.state === 'sent' && channel && (
            <Button
              variant='link'
              onClick={() => {
                onShowTest(channel.name, state.notificationId);
                close();
              }}
            >
              {t('settings.tabs.deliveries')}
            </Button>
          )}
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
