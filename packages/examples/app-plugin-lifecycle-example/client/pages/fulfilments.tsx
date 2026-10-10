import { useState, type ReactElement } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Check, Circle, Shuffle } from 'lucide-react';

import { CARRIER_STATUSES, DEFAULT_CUSTOMER } from '../../shared/flows.js';
import { personName } from '../../shared/people.js';
import { text } from '../../shared/text.js';
import { Choice } from '../components/choice.js';
import { CustomerChoice } from '../components/customer-choice.js';
import {
  FlowPage,
  OutsideCard,
  Section,
  type FlowDetailProps,
  type FlowFormProps,
} from '../components/flow-page.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { HoldToggle, WebhookLog } from '../components/webhook-log.js';
import { errorMessage } from '../lib/api.js';
import { flowApi } from '../lib/flow-api.js';
import { dateTime, NAMESPACE } from '../lib/format.js';
import { sandboxApi } from '../lib/sandbox-api.js';
import { useConsoleAction } from '../lib/use-console-action.js';
import { useTranslate } from '../lib/use-example-record.js';
import { useWebhookEvents } from '../lib/use-webhook-events.js';

export default function FulfilmentsPage(): ReactElement {
  const { t, i18n } = useTranslation(NAMESPACE);
  return (
    <FlowPage
      flow='fulfilments'
      description={() => t('fulfilments.description')}
      title={(record) => text(record.title)}
      subtitle={(record) => personName(record.customerId)}
      fields={({ record }) => [
        {
          label: t('fulfilments.fields.customer'),
          value: personName(record.customerId),
        },
        {
          label: t('fulfilments.fields.paid'),
          value: record.paidAt ? dateTime(record.paidAt, i18n.language) : '—',
        },
        {
          label: t('fulfilments.fields.picked'),
          value: record.pickedAt
            ? dateTime(record.pickedAt, i18n.language)
            : '—',
        },
        {
          label: t('fulfilments.fields.tracking'),
          value: text(record.trackingNumber) || '—',
        },
        {
          label: t('fulfilments.fields.carrier'),
          value: record.carrierStatus
            ? `${t(`fulfilments.carrier.${text(record.carrierStatus)}`)}${
                record.carrierLocation
                  ? ` · ${text(record.carrierLocation)}`
                  : ''
              }`
            : '—',
        },
        {
          label: t('fulfilments.fields.carrierAt'),
          value: record.carrierEventAt
            ? dateTime(record.carrierEventAt, i18n.language)
            : '—',
        },
      ]}
      banner={({ record }) => {
        const state = text(record.status);
        if (state === 'preparing') {
          const waiting = [
            ...(record.paidAt ? [] : [t('fulfilments.signals.payment')]),
            ...(record.pickedAt ? [] : [t('fulfilments.signals.pick')]),
          ];
          return {
            tone: 'warning',
            text: t('fulfilments.banner.preparing', {
              waiting: waiting.join(t('fulfilments.and')),
            }),
          };
        }
        const tones = {
          readyToShip: 'info',
          booking: 'info',
          shipped: 'info',
          exception: 'danger',
          delivered: 'success',
          cancelled: 'neutral',
        } as const;
        return state in tones
          ? {
              tone: tones[state as keyof typeof tones],
              text: t(`fulfilments.banner.${state}`),
            }
          : null;
      }}
      destructive={['cancel']}
      Form={NewFulfilment}
      Outside={OutsideSystems}
    />
  );
}

function NewFulfilment({ onCancel, onCreated }: FlowFormProps): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const translate = useTranslate();
  const client = flowApi(useApiClient());
  const [title, setTitle] = useState('订单 #1024 · 机械键盘');
  const [customerId, setCustomerId] = useState(DEFAULT_CUSTOMER);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (): Promise<void> => {
    setBusy(true);
    setError('');
    try {
      const created = await client.create('fulfilments', {
        title,
        customerId,
      });
      await onCreated(text(created.id));
    } catch (cause) {
      setError(errorMessage(cause, translate));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className='space-y-4'>
        <h2 className='text-lg font-medium'>{t('fulfilments.form.title')}</h2>
        <div className='grid gap-4 sm:grid-cols-[1fr_14rem]'>
          <label className='block space-y-1.5'>
            <span className='text-sm'>{t('fulfilments.form.name')}</span>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <CustomerChoice value={customerId} onChange={setCustomerId} />
        </div>
        {error ? <p className='text-sm text-destructive'>{error}</p> : null}
        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button disabled={busy} onClick={() => void submit()}>
            {t('fulfilments.form.submit')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Signal({
  done,
  label,
}: {
  readonly done: boolean;
  readonly label: string;
}): ReactElement {
  return (
    <span className='inline-flex items-center gap-1.5 text-sm'>
      {done ? (
        <Check className='size-4 text-emerald-600 dark:text-emerald-400' />
      ) : (
        <Circle className='size-4 text-muted-foreground' />
      )}
      {label}
    </span>
  );
}

/** Plays the payment provider, the warehouse and the carrier. */
function OutsideSystems({
  detail,
  revision,
  reload,
}: FlowDetailProps): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const api = sandboxApi(useApiClient());
  const record = detail.record;
  const id = text(record.id);
  const [hold, setHold] = useState(false);
  const [status, setStatus] = useState<string>('inTransit');
  const [location, setLocation] = useState('杭州转运中心');
  const [offset, setOffset] = useState('0');
  const events = useWebhookEvents('fulfilments', id, revision);
  const action = useConsoleAction(reload);
  const at = (minutes: number) =>
    new Date(Date.now() + minutes * 60_000).toISOString();

  const scramble = () =>
    action.run(async () => {
      // Three scans, sent as held events: deliver them in any order.
      const scans = [
        { status: 'inTransit', location: '杭州转运中心', minutes: 1 },
        { status: 'outForDelivery', location: '上海浦东营业部', minutes: 2 },
        { status: 'delivered', location: '上海浦东', minutes: 3 },
      ];
      for (const scan of scans)
        await api.send({
          source: 'carrier',
          type: 'tracking.updated',
          recordId: id,
          data: { status: scan.status, location: scan.location },
          occurredAt: at(scan.minutes),
          hold: true,
        });
    });

  return (
    <OutsideCard
      title={t('fulfilments.outside.title')}
      description={t('fulfilments.outside.description')}
    >
      <Section
        title={t('fulfilments.outside.signals')}
        hint={t('fulfilments.outside.signalsHint')}
      >
        <div className='flex flex-wrap items-center gap-4'>
          <Signal
            done={Boolean(record.paidAt)}
            label={t('fulfilments.signals.payment')}
          />
          <Signal
            done={Boolean(record.pickedAt)}
            label={t('fulfilments.signals.pick')}
          />
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button
            variant='outline'
            disabled={action.busy}
            onClick={() =>
              void action.run(() =>
                api.send({
                  source: 'payments',
                  type: 'payment.captured',
                  recordId: id,
                  data: {
                    paymentRef: `pi_demo_${Math.random().toString(16).slice(2, 10)}`,
                  },
                  hold,
                }),
              )
            }
          >
            {t('fulfilments.outside.capture')}
          </Button>
          <Button
            variant='outline'
            disabled={action.busy}
            onClick={() =>
              void action.run(() =>
                api.send({
                  source: 'warehouse',
                  type: 'pick.completed',
                  recordId: id,
                  data: { picker: '仓库 · 小李' },
                  hold,
                }),
              )
            }
          >
            {t('fulfilments.outside.pick')}
          </Button>
          <HoldToggle value={hold} onChange={setHold} />
        </div>
      </Section>
      <Section
        title={t('fulfilments.outside.carrierTitle')}
        hint={t('fulfilments.outside.carrierHint')}
      >
        <div className='grid gap-2 sm:grid-cols-[10rem_1fr_7rem_auto]'>
          <Choice
            label={t('fulfilments.outside.status')}
            className='w-full'
            value={status}
            onChange={setStatus}
            options={CARRIER_STATUSES.map((key) => ({
              value: key,
              label: t(`fulfilments.carrier.${key}`),
            }))}
          />
          <Input
            aria-label={t('fulfilments.outside.location')}
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
          <Input
            aria-label={t('fulfilments.outside.offset')}
            title={t('fulfilments.outside.offset')}
            type='number'
            value={offset}
            onChange={(event) => setOffset(event.target.value)}
          />
          <Button
            disabled={action.busy}
            onClick={() =>
              void action.run(() =>
                api.send({
                  source: 'carrier',
                  type: 'tracking.updated',
                  recordId: id,
                  data: { status, location },
                  occurredAt: at(Number(offset) || 0),
                  hold,
                }),
              )
            }
          >
            {t('fulfilments.outside.send')}
          </Button>
        </div>
        <p className='text-xs text-muted-foreground'>
          {t('fulfilments.outside.offsetHint')}
        </p>
        <Button
          size='sm'
          variant='outline'
          disabled={action.busy}
          onClick={() => void scramble()}
        >
          <Shuffle />
          {t('fulfilments.outside.scramble')}
        </Button>
        {action.error ? (
          <p className='text-sm text-destructive'>{action.error}</p>
        ) : null}
      </Section>
      <Section title={t('webhooks.title')} hint={t('webhooks.hint')}>
        <WebhookLog events={events} onChange={reload} />
      </Section>
    </OutsideCard>
  );
}
