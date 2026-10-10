import { useState, type ReactElement } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { CreditCard, XCircle } from 'lucide-react';

import { yuan } from '../../shared/expense.js';
import { DEFAULT_CUSTOMER } from '../../shared/flows.js';
import { personName } from '../../shared/people.js';
import { text } from '../../shared/text.js';
import {
  FlowPage,
  OutsideCard,
  Section,
  type FlowDetailProps,
  type FlowFormProps,
} from '../components/flow-page.js';
import { CustomerChoice } from '../components/customer-choice.js';
import { DemoOptions, NumberOption } from '../components/demo-options.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { HoldToggle, WebhookLog } from '../components/webhook-log.js';
import { errorMessage } from '../lib/api.js';
import { flowApi } from '../lib/flow-api.js';
import { countdown, NAMESPACE } from '../lib/format.js';
import { sandboxApi } from '../lib/sandbox-api.js';
import { useConsoleAction } from '../lib/use-console-action.js';
import { useTranslate } from '../lib/use-example-record.js';
import { useWebhookEvents } from '../lib/use-webhook-events.js';
import { useLoader } from '../lib/use-loader.js';

function number(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function OrdersPage(): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  return (
    <FlowPage
      flow='orders'
      description={(parameters) =>
        t('orders.description', {
          minutes: number(parameters.paymentWindowMinutes, 3),
        })
      }
      title={(record) => text(record.title)}
      subtitle={(record) =>
        `${personName(record.customerId)} · ${yuan(number(record.amountCents, 0))}`
      }
      fields={({ record }) => [
        {
          label: t('orders.fields.customer'),
          value: personName(record.customerId),
        },
        {
          label: t('orders.fields.amount'),
          value: yuan(number(record.amountCents, 0)),
        },
        {
          label: t('orders.fields.attempt'),
          value: number(record.paymentAttempt, 0),
        },
        {
          label: t('orders.fields.session'),
          value: text(record.paymentSessionId) || '—',
        },
        {
          label: t('orders.fields.paymentRef'),
          value: text(record.paymentRef) || '—',
        },
        {
          label: t('orders.fields.refundRef'),
          value: text(record.refundRef) || '—',
        },
      ]}
      banner={({ record, parameters }, now) => {
        const state = text(record.status);
        const window = number(parameters.paymentWindowMinutes, 3) * 60_000;
        const left = countdown(
          Date.parse(text(record.statusChangedAt)) + window,
          now,
        );
        const error = text(record.lastError);
        switch (state) {
          case 'draft':
            return { tone: 'neutral', text: t('orders.banner.draft') };
          case 'creatingCheckout':
            return { tone: 'info', text: t('orders.banner.creatingCheckout') };
          case 'awaitingPayment':
            return {
              tone: 'warning',
              text: left
                ? t('orders.banner.awaitingPayment', { time: left })
                : t('orders.banner.overdue'),
            };
          case 'paymentFailed':
            return {
              tone: 'danger',
              text: t('orders.banner.paymentFailed', {
                error,
                time: left ?? '0:00',
              }),
            };
          case 'paid':
            return { tone: 'success', text: t('orders.banner.paid') };
          case 'cancelled':
            return {
              tone: 'neutral',
              text: t(
                `orders.banner.cancelled.${text(record.cancelReason) || 'customer'}`,
              ),
            };
          case 'refunding':
            return { tone: 'info', text: t('orders.banner.refunding') };
          case 'refundNeedsAttention':
            return {
              tone: 'danger',
              text: t('orders.banner.refundNeedsAttention', { error }),
            };
          case 'refunded':
            return { tone: 'success', text: t('orders.banner.refunded') };
          case 'fulfilled':
            return { tone: 'success', text: t('orders.banner.fulfilled') };
          default:
            return null;
        }
      }}
      destructive={['cancel', 'refundOrder']}
      Form={NewOrder}
      Outside={PaymentProvider}
    />
  );
}

function NewOrder({ onCancel, onCreated }: FlowFormProps): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const translate = useTranslate();
  const client = flowApi(useApiClient());
  const [customerId, setCustomerId] = useState(DEFAULT_CUSTOMER);
  const [title, setTitle] = useState('降噪耳机 × 1');
  const [amount, setAmount] = useState('399');
  const [failCheckouts, setFailCheckouts] = useState('0');
  const [failRefunds, setFailRefunds] = useState('0');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (): Promise<void> => {
    setBusy(true);
    setError('');
    try {
      const created = await client.create('orders', {
        customerId,
        title,
        amountCents: Math.round(Number(amount) * 100),
        failCheckouts: Number(failCheckouts),
        failRefunds: Number(failRefunds),
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
        <h2 className='text-lg font-medium'>{t('orders.form.title')}</h2>
        <CustomerChoice value={customerId} onChange={setCustomerId} />
        <div className='grid gap-4 sm:grid-cols-[1fr_10rem]'>
          <label className='block space-y-1.5'>
            <span className='text-sm'>{t('orders.form.item')}</span>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className='block space-y-1.5'>
            <span className='text-sm'>{t('orders.form.amount')}</span>
            <Input
              type='number'
              min={0.01}
              step={0.01}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
        </div>
        <DemoOptions>
          <NumberOption
            label={t('orders.form.failCheckouts')}
            value={failCheckouts}
            onChange={setFailCheckouts}
          />
          <NumberOption
            label={t('orders.form.failRefunds')}
            value={failRefunds}
            onChange={setFailRefunds}
          />
          <p className='text-xs text-muted-foreground'>
            {t('orders.form.failHint')}
          </p>
        </DemoOptions>
        {error ? <p className='text-sm text-destructive'>{error}</p> : null}
        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button disabled={busy} onClick={() => void submit()}>
            {t('orders.form.submit')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** Plays the payment provider: its hosted checkout and the webhooks it sends. */
function PaymentProvider({
  detail,
  revision,
  reload,
}: FlowDetailProps): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const api = sandboxApi(useApiClient());
  const record = detail.record;
  const id = text(record.id);
  const sessionId = text(record.paymentSessionId);
  const [hold, setHold] = useState(false);
  const events = useWebhookEvents('orders', id, revision);
  // The provider's side of the session: read again with the order, since
  // paying, declining or closing it each change the order or its runs.
  const session = useLoader(
    sessionId ? () => api.checkout(sessionId) : undefined,
    sessionId,
    revision,
  );
  const action = useConsoleAction(reload);
  const status = session.data?.status;

  return (
    <OutsideCard
      title={t('orders.outside.title')}
      description={t('orders.outside.description')}
    >
      <Section
        title={t('orders.outside.checkout')}
        hint={
          sessionId
            ? t('orders.outside.session', {
                id: sessionId,
                status: status ? t(`orders.sessionStatus.${status}`) : '…',
              })
            : t('orders.outside.noSession')
        }
      >
        <div className='flex flex-wrap items-center gap-2'>
          <Button
            disabled={action.busy || status !== 'open'}
            onClick={() => void action.run(() => api.pay(id, 'paid', hold))}
          >
            <CreditCard />
            {t('orders.outside.pay')}
          </Button>
          <Button
            variant='outline'
            disabled={action.busy || status !== 'open'}
            onClick={() => void action.run(() => api.pay(id, 'declined', hold))}
          >
            <XCircle />
            {t('orders.outside.decline')}
          </Button>
          <HoldToggle value={hold} onChange={setHold} />
        </div>
        <p className='text-xs text-muted-foreground'>
          {t('orders.outside.tryThis')}
        </p>
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
