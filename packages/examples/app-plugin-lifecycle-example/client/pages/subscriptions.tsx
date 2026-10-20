import { useState, type ReactElement } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Play } from 'lucide-react';

import { yuan } from '../../shared/expense.js';
import { DEFAULT_CUSTOMER, planOf, PLANS } from '../../shared/flows.js';
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
import { errorMessage, exampleApi } from '../lib/api.js';
import { flowApi } from '../lib/flow-api.js';
import { countdown, dateTime, NAMESPACE } from '../lib/format.js';
import { useConsoleAction } from '../lib/use-console-action.js';
import { useTranslate } from '../lib/use-example-record.js';
import { cn } from '../lib/utils.js';

function number(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function SubscriptionsPage(): ReactElement {
  const { t, i18n } = useTranslation(NAMESPACE);
  const plan = (name: unknown) => t(`subscriptions.plans.${text(name)}`);
  return (
    <FlowPage
      flow='subscriptions'
      description={(parameters) =>
        t('subscriptions.description', {
          period: number(parameters.periodMinutes, 3),
          dunning: number(parameters.dunningMinutes, 1),
          tries: number(parameters.maxDunning, 3),
        })
      }
      title={(record) =>
        `${plan(record.plan)} · ${yuan(number(record.priceCents, 0))}`
      }
      subtitle={(record) =>
        `${personName(record.customerId)} · ${t('subscriptions.periodN', {
          count: number(record.periodCount, 0),
        })}`
      }
      fields={({ record, parameters }) => [
        {
          label: t('subscriptions.fields.customer'),
          value: personName(record.customerId),
        },
        {
          label: t('subscriptions.fields.periods'),
          value: number(record.periodCount, 0),
        },
        {
          label: t('subscriptions.fields.periodEnd'),
          value: record.currentPeriodEnd
            ? dateTime(record.currentPeriodEnd, i18n.language)
            : '—',
        },
        {
          label: t('subscriptions.fields.dunning'),
          value: `${number(record.dunningCount, 0)} / ${number(parameters.maxDunning, 3)}`,
        },
        {
          label: t('subscriptions.fields.lastCharge'),
          value: text(record.lastChargeRef) || '—',
        },
        {
          label: t('subscriptions.fields.card'),
          value:
            number(record.cardDeclines, 0) > 0
              ? t('subscriptions.fields.cardValue', {
                  count: number(record.cardDeclines, 0),
                })
              : t('subscriptions.fields.cardWorks'),
        },
      ]}
      banner={({ record, parameters }, now) => {
        const state = text(record.status);
        if (state === 'renewing')
          return { tone: 'info', text: t('subscriptions.banner.renewing') };
        if (state === 'active') {
          const left = countdown(
            Date.parse(text(record.currentPeriodEnd)),
            now,
          );
          return {
            tone: 'success',
            text: left
              ? t('subscriptions.banner.active', { time: left })
              : t('subscriptions.banner.due'),
          };
        }
        if (state === 'pastDue') {
          const left = countdown(
            Date.parse(text(record.statusChangedAt)) +
              number(parameters.dunningMinutes, 1) * 60_000,
            now,
          );
          return {
            tone: 'danger',
            text: t('subscriptions.banner.pastDue', {
              error: text(record.lastError),
              tries: number(record.dunningCount, 0),
              max: number(parameters.maxDunning, 3),
              time: left ?? '0:00',
            }),
          };
        }
        if (state === 'cancelled')
          return {
            tone: 'neutral',
            text: t(
              `subscriptions.banner.cancelled.${text(record.cancelReason) || 'customer'}`,
            ),
          };
        return null;
      }}
      destructive={['cancel']}
      Form={NewSubscription}
      Outside={Billing}
    />
  );
}

function NewSubscription({ onCancel, onCreated }: FlowFormProps): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const translate = useTranslate();
  const client = flowApi(useApiClient());
  const [customerId, setCustomerId] = useState(DEFAULT_CUSTOMER);
  const [plan, setPlan] = useState('pro');
  const [cardDeclines, setCardDeclines] = useState('0');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (): Promise<void> => {
    setBusy(true);
    setError('');
    try {
      const created = await client.create('subscriptions', {
        customerId,
        plan,
        cardDeclines: Number(cardDeclines),
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
        <h2 className='text-lg font-medium'>{t('subscriptions.form.title')}</h2>
        <CustomerChoice value={customerId} onChange={setCustomerId} />
        <div className='space-y-1.5'>
          <span className='text-sm'>{t('subscriptions.form.plan')}</span>
          <Choice
            label={t('subscriptions.form.plan')}
            className='w-full sm:w-72'
            value={plan}
            onChange={setPlan}
            options={PLANS.map((option) => ({
              value: option.plan,
              label: `${t(`subscriptions.plans.${option.plan}`)} · ${yuan(option.priceCents)}`,
            }))}
          />
        </div>
        <p className='text-sm text-muted-foreground'>
          {t('subscriptions.form.charge', {
            price: yuan(planOf(plan)?.priceCents ?? 0),
          })}
        </p>
        <DemoOptions>
          <NumberOption
            label={t('subscriptions.form.cardDeclines')}
            value={cardDeclines}
            onChange={setCardDeclines}
          />
          <p className='text-xs text-muted-foreground'>
            {t('subscriptions.form.failHint')}
          </p>
        </DemoOptions>
        {error ? <p className='text-sm text-destructive'>{error}</p> : null}
        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button disabled={busy} onClick={() => void submit()}>
            {t('subscriptions.form.submit')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** The billing history, read from the charge effect's runs, and the sweep that renews. */
function Billing({ detail, reload }: FlowDetailProps): ReactElement {
  const { t, i18n } = useTranslation(NAMESPACE);
  const client = exampleApi(useApiClient());
  const action = useConsoleAction(reload);
  const [note, setNote] = useState('');
  const charges = detail.history.effectRuns.filter(
    (run) => run.effect === 'subscriptions.charge',
  );

  return (
    <OutsideCard
      title={t('subscriptions.outside.title')}
      description={t('subscriptions.outside.description')}
    >
      <Section
        title={t('subscriptions.outside.charges')}
        hint={t('subscriptions.outside.chargesHint')}
      >
        {charges.length ? (
          <ul className='space-y-1 text-xs'>
            {charges.map((run) => {
              const ref = (run.result as { chargeRef?: unknown } | null)
                ?.chargeRef;
              return (
                <li
                  key={run.id}
                  className={cn(
                    'flex flex-wrap gap-x-3 rounded-md border px-3 py-1.5',
                    run.status === 'failed' &&
                      'border-destructive/40 bg-destructive/5',
                  )}
                >
                  <span>{dateTime(run.createdAt, i18n.language)}</span>
                  <span className='font-medium'>{t(`runs.${run.status}`)}</span>
                  <span className='font-mono text-muted-foreground'>
                    {typeof ref === 'string' ? ref : (run.error ?? '')}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className='text-sm text-muted-foreground'>
            {t('subscriptions.outside.noCharges')}
          </p>
        )}
      </Section>
      <Section
        title={t('subscriptions.outside.sweep')}
        hint={t('subscriptions.outside.sweepHint')}
      >
        <div className='flex flex-wrap items-center gap-2'>
          <Button
            size='sm'
            variant='outline'
            disabled={action.busy}
            onClick={() =>
              void action.run(async () => {
                const fired = await client.runTriggers();
                setNote(t('lifecycle.swept', { count: fired }));
              })
            }
          >
            <Play />
            {t('lifecycle.runTriggers')}
          </Button>
          <span className='text-xs text-muted-foreground'>{note}</span>
        </div>
        {action.error ? (
          <p className='text-sm text-destructive'>{action.error}</p>
        ) : null}
      </Section>
    </OutsideCard>
  );
}
