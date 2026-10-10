import { useState, type ReactElement } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { ArrowRight, Undo2 } from 'lucide-react';

import { yuan } from '../../shared/expense.js';
import { DEFAULT_CUSTOMER, SALE_ITEMS, saleItem } from '../../shared/flows.js';
import { personName } from '../../shared/people.js';
import { text } from '../../shared/text.js';
import { Choice } from '../components/choice.js';
import { CustomerChoice } from '../components/customer-choice.js';
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
import { errorMessage, type EffectRun } from '../lib/api.js';
import { flowApi } from '../lib/flow-api.js';
import { NAMESPACE } from '../lib/format.js';
import { sandboxApi } from '../lib/sandbox-api.js';
import { useTranslate } from '../lib/use-example-record.js';
import { useLoader } from '../lib/use-loader.js';
import { cn } from '../lib/utils.js';

function number(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function PurchasesPage(): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const item = (sku: unknown) => t(`purchases.items.${text(sku)}`);
  return (
    <FlowPage
      flow='purchases'
      description={() => t('purchases.description')}
      title={(record) => `${item(record.sku)} × ${number(record.quantity, 1)}`}
      subtitle={(record) =>
        `${personName(record.customerId)} · ${yuan(number(record.amountCents, 0))}`
      }
      fields={({ record }) => [
        {
          label: t('purchases.fields.customer'),
          value: personName(record.customerId),
        },
        {
          label: t('purchases.fields.amount'),
          value: yuan(number(record.amountCents, 0)),
        },
        {
          label: t('purchases.fields.reservation'),
          value: text(record.reservationId) || '—',
        },
        {
          label: t('purchases.fields.paymentRef'),
          value: text(record.paymentRef) || '—',
        },
      ]}
      banner={({ record }) => {
        const state = text(record.status);
        const error = text(record.lastError);
        switch (state) {
          case 'draft':
            return { tone: 'neutral', text: t('purchases.banner.draft') };
          case 'reserving':
          case 'charging':
            return { tone: 'info', text: t(`purchases.banner.${state}`) };
          case 'releasing':
            return {
              tone: 'warning',
              text: t('purchases.banner.releasing', { error }),
            };
          case 'compensationNeedsAttention':
            return {
              tone: 'danger',
              text: t('purchases.banner.compensationNeedsAttention', { error }),
            };
          case 'confirmed':
            return { tone: 'success', text: t('purchases.banner.confirmed') };
          case 'cancelled':
            return {
              tone: 'neutral',
              text: t(
                `purchases.banner.cancelled.${text(record.cancelReason) || 'customer'}`,
                {
                  error,
                },
              ),
            };
          default:
            return null;
        }
      }}
      destructive={['abandon']}
      Form={NewPurchase}
      Outside={Saga}
    />
  );
}

function NewPurchase({ onCancel, onCreated }: FlowFormProps): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const translate = useTranslate();
  const client = flowApi(useApiClient());
  const [customerId, setCustomerId] = useState(DEFAULT_CUSTOMER);
  const [sku, setSku] = useState('headphones');
  const [quantity, setQuantity] = useState('1');
  const [declineCharge, setDeclineCharge] = useState(false);
  const [failReleases, setFailReleases] = useState('0');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const price = saleItem(sku)?.priceCents ?? 0;

  const submit = async (): Promise<void> => {
    setBusy(true);
    setError('');
    try {
      const created = await client.create('purchases', {
        customerId,
        sku,
        quantity: Number(quantity),
        declineCharge,
        failReleases: Number(failReleases),
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
        <h2 className='text-lg font-medium'>{t('purchases.form.title')}</h2>
        <CustomerChoice value={customerId} onChange={setCustomerId} />
        <div className='grid gap-4 sm:grid-cols-[1fr_8rem]'>
          <div className='space-y-1.5'>
            <span className='text-sm'>{t('purchases.form.item')}</span>
            <Choice
              label={t('purchases.form.item')}
              className='w-full'
              value={sku}
              onChange={setSku}
              options={SALE_ITEMS.map((option) => ({
                value: option.sku,
                label: `${t(`purchases.items.${option.sku}`)} · ${yuan(option.priceCents)}`,
              }))}
            />
          </div>
          <label className='block space-y-1.5'>
            <span className='text-sm'>{t('purchases.form.quantity')}</span>
            <Input
              type='number'
              min={1}
              max={5}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </label>
        </div>
        <p className='text-sm'>
          {t('purchases.form.total', {
            total: yuan(price * number(quantity, 0)),
          })}
        </p>
        <DemoOptions>
          <label className='flex items-center gap-2'>
            <input
              type='checkbox'
              className='size-4 accent-primary'
              checked={declineCharge}
              onChange={(event) => setDeclineCharge(event.target.checked)}
            />
            {t('purchases.form.declineCharge')}
          </label>
          <NumberOption
            label={t('purchases.form.failReleases')}
            value={failReleases}
            onChange={setFailReleases}
          />
          <p className='text-xs text-muted-foreground'>
            {t('purchases.form.failHint')}
          </p>
        </DemoOptions>
        {error ? <p className='text-sm text-destructive'>{error}</p> : null}
        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button disabled={busy} onClick={() => void submit()}>
            {t('purchases.form.submit')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const STEP_TONES: Readonly<Record<string, string>> = {
  pending: 'border-dashed text-muted-foreground',
  queued: 'border-primary/40 bg-primary/5',
  running: 'border-primary bg-primary/10',
  succeeded: 'border-emerald-500/50 bg-emerald-500/10',
  failed: 'border-destructive/50 bg-destructive/10',
  dead: 'border-destructive/50 bg-destructive/10',
  cancelled: 'text-muted-foreground',
};

function Step({
  label,
  run,
}: {
  readonly label: string;
  readonly run: EffectRun | undefined;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const status = run?.status ?? 'pending';
  return (
    <div
      className={cn(
        'min-w-32 flex-1 rounded-lg border px-3 py-2 text-xs',
        STEP_TONES[status],
      )}
    >
      <div className='font-medium'>{label}</div>
      <div className='text-muted-foreground'>
        {run
          ? `${t(`runs.${run.status}`)} · ${t('lifecycle.attempts', {
              attempts: run.attempts,
              max: run.maxAttempts,
            })}`
          : t('purchases.outside.notYet')}
      </div>
      {run?.error ? (
        <div className='mt-0.5 break-words text-destructive'>{run.error}</div>
      ) : null}
    </div>
  );
}

/** The steps across the two systems, the compensation, and the warehouse's shelf. */
function Saga({ detail, revision }: FlowDetailProps): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const api = sandboxApi(useApiClient());
  const record = detail.record;
  // The warehouse's shelf, read again with the purchase.
  const stock = useLoader(() => api.stock(), 'stock', revision);
  const runs = detail.history.effectRuns;
  const last = (effect: string) =>
    [...runs].reverse().find((run) => run.effect === effect);

  return (
    <OutsideCard
      title={t('purchases.outside.title')}
      description={t('purchases.outside.description')}
    >
      <Section
        title={t('purchases.outside.steps')}
        hint={t('purchases.outside.stepsHint')}
      >
        <div className='flex flex-wrap items-stretch gap-2'>
          <Step
            label={t('purchases.outside.reserve')}
            run={last('purchases.reserveStock')}
          />
          <ArrowRight className='size-4 self-center text-muted-foreground' />
          <Step
            label={t('purchases.outside.charge')}
            run={last('purchases.chargeCard')}
          />
        </div>
        <div className='flex flex-wrap items-stretch gap-2'>
          <Undo2 className='size-4 self-center text-muted-foreground' />
          <Step
            label={t('purchases.outside.release')}
            run={last('purchases.releaseStock')}
          />
        </div>
      </Section>
      <Section
        title={t('purchases.outside.stock')}
        hint={t('purchases.outside.stockHint')}
      >
        <table className='w-full text-sm'>
          <thead className='text-left text-xs text-muted-foreground'>
            <tr>
              <th className='py-1 font-normal'>
                {t('purchases.outside.item')}
              </th>
              <th className='py-1 font-normal'>
                {t('purchases.outside.available')}
              </th>
              <th className='py-1 font-normal'>
                {t('purchases.outside.reserved')}
              </th>
            </tr>
          </thead>
          <tbody>
            {(stock.data ?? []).map((level) => (
              <tr
                key={level.sku}
                className={cn(
                  'border-t',
                  level.sku === record.sku && 'font-medium',
                )}
              >
                <td className='py-1'>{t(`purchases.items.${level.sku}`)}</td>
                <td className='py-1'>{level.available}</td>
                <td className='py-1'>{level.reserved}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </OutsideCard>
  );
}
