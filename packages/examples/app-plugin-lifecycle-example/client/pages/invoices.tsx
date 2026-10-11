import { useState, type ReactElement } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { INVOICE_ORDERS } from '../../shared/flows.js';
import { LIFECYCLE_ROUTES } from '../../shared/routes.js';
import { text } from '../../shared/text.js';
import { personName } from '../../shared/people.js';
import { yuan } from '../../shared/expense.js';
import { Choice } from '../components/choice.js';
import { DemoOptions, NumberOption } from '../components/demo-options.js';
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
import { countdown, NAMESPACE } from '../lib/format.js';
import { sandboxApi } from '../lib/sandbox-api.js';
import { useConsoleAction } from '../lib/use-console-action.js';
import { useTranslate } from '../lib/use-example-record.js';
import { useWebhookEvents } from '../lib/use-webhook-events.js';

export default function InvoicesPage(): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  return (
    <FlowPage
      flow='invoices'
      description={(parameters) =>
        t('invoices.description', {
          seconds: Number(parameters.querySeconds ?? 30),
        })
      }
      title={(record) => text(record.title)}
      subtitle={(record) =>
        t('invoices.orderSummary', {
          order: text(record.orderRef),
          amount: yuan(Number(record.amountCents)),
        })
      }
      fields={({ record }) => [
        {
          label: t('invoices.fields.order'),
          value: `#${text(record.orderRef)}`,
        },
        {
          label: t('invoices.fields.customer'),
          value: personName(record.customerId),
        },
        {
          label: t('invoices.fields.amount'),
          value: yuan(Number(record.amountCents)),
        },
        {
          label: t('invoices.fields.taxNumber'),
          value: text(record.taxNumber),
        },
        {
          label: t('invoices.fields.request'),
          value: text(record.providerRequestId) || '—',
        },
        {
          label: t('invoices.fields.number'),
          value: text(record.invoiceNumber) || '—',
        },
        {
          label: t('invoices.fields.queries'),
          value: Number(record.queryCount),
        },
      ]}
      banner={({ record, parameters }, now) => {
        switch (text(record.status)) {
          case 'draft':
            return { tone: 'neutral', text: t('invoices.banner.draft') };
          case 'submitting':
            return { tone: 'info', text: t('invoices.banner.submitting') };
          case 'awaitingIssue':
            return {
              tone: 'warning',
              text: t('invoices.banner.awaiting', {
                time:
                  countdown(
                    Date.parse(text(record.statusChangedAt)) +
                      Number(parameters.querySeconds) * 1000,
                    now,
                  ) ?? '0:00',
              }),
            };
          case 'querying':
            return { tone: 'info', text: t('invoices.banner.querying') };
          case 'issued':
            return { tone: 'success', text: t('invoices.banner.issued') };
          case 'issueFailed':
            return {
              tone: 'danger',
              text: t('invoices.banner.failed', {
                error: text(record.lastError),
              }),
            };
          default:
            return null;
        }
      }}
      Form={NewInvoice}
      Outside={InvoicingPlatform}
    />
  );
}

function NewInvoice({ onCancel, onCreated }: FlowFormProps): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const translate = useTranslate();
  const client = flowApi(useApiClient());
  const [orderRef, setOrderRef] = useState('1024');
  const [title, setTitle] = useState('星河科技有限公司');
  const [taxNumber, setTaxNumber] = useState('91310000MA1K000001');
  const [failSubmissions, setFailSubmissions] = useState('0');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const created = await client.create('invoices', {
        orderRef,
        title,
        taxNumber,
        failSubmissions: Number(failSubmissions),
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
        <h2 className='text-lg font-medium'>{t('invoices.form.title')}</h2>
        <p className='text-sm text-muted-foreground'>
          {t('invoices.form.ordersHint')}
        </p>
        <Choice
          label={t('invoices.fields.order')}
          value={orderRef}
          onChange={setOrderRef}
          options={INVOICE_ORDERS.map((order) => ({
            value: order.orderRef,
            label: t('invoices.form.order', {
              order: order.orderRef,
              customer: personName(order.customerId),
              amount: yuan(order.amountCents),
            }),
          }))}
        />
        <label className='block space-y-1.5'>
          <span className='text-sm'>{t('invoices.form.invoiceTitle')}</span>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className='block space-y-1.5'>
          <span className='text-sm'>{t('invoices.fields.taxNumber')}</span>
          <Input
            value={taxNumber}
            onChange={(event) => setTaxNumber(event.target.value)}
          />
        </label>
        <DemoOptions>
          <NumberOption
            label={t('invoices.form.failSubmissions')}
            value={failSubmissions}
            onChange={setFailSubmissions}
          />
          <p className='text-xs text-muted-foreground'>
            {t('invoices.form.failHint')}
          </p>
        </DemoOptions>
        {error ? <p className='text-sm text-destructive'>{error}</p> : null}
        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button disabled={busy} onClick={() => void submit()}>
            {t('invoices.form.submit')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function InvoicingPlatform({
  detail,
  revision,
  reload,
}: FlowDetailProps): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const client = useApiClient();
  const api = sandboxApi(client);
  const record = detail.record;
  const id = text(record.id);
  const [hold, setHold] = useState(false);
  const events = useWebhookEvents('invoices', id, revision);
  const action = useConsoleAction(reload);
  const waiting = ['awaitingIssue', 'querying'].includes(text(record.status));
  const download = async () => {
    const stream = await client.stream({
      path: `${LIFECYCLE_ROUTES}/invoices/${encodeURIComponent(id)}/pdf`,
    });
    const blob = new Blob([await new Response(stream).blob()], {
      type: 'application/pdf',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `invoice-${id}.pdf`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  return (
    <OutsideCard
      title={t('invoices.outside.title')}
      description={t('invoices.outside.description')}
    >
      <Section
        title={t('invoices.outside.result')}
        hint={t('invoices.outside.hint')}
      >
        <div className='flex flex-wrap items-center gap-2'>
          <Button
            disabled={action.busy || !waiting}
            onClick={() =>
              void action.run(() => api.completeInvoice(id, 'issued', hold))
            }
          >
            {t('invoices.outside.issue')}
          </Button>
          <Button
            variant='outline'
            disabled={action.busy || !waiting}
            onClick={() =>
              void action.run(() => api.completeInvoice(id, 'failed', hold))
            }
          >
            {t('invoices.outside.fail')}
          </Button>
          <HoldToggle value={hold} onChange={setHold} />
        </div>
        {record.status === 'issued' ? (
          <div className='space-y-2'>
            <Button
              disabled={action.busy}
              onClick={() => void action.run(download)}
            >
              {t('invoices.outside.download')}
            </Button>
            <p className='text-xs text-muted-foreground'>
              {t('invoices.outside.pdfHint')}
            </p>
          </div>
        ) : null}
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
