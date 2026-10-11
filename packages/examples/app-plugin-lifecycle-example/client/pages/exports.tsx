import { useState, type ReactElement } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';

import { VENDOR_OUTCOMES } from '../../shared/flows.js';
import { text } from '../../shared/text.js';
import { Choice } from '../components/choice.js';
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
import { errorMessage } from '../lib/api.js';
import { flowApi } from '../lib/flow-api.js';
import { countdown, dateTime, NAMESPACE } from '../lib/format.js';
import { useTranslate } from '../lib/use-example-record.js';

function number(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function Progress({ value }: { readonly value: number }): ReactElement {
  return (
    <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
      <div
        className='h-full rounded-full bg-primary transition-[width]'
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export default function ExportsPage(): ReactElement {
  const { t, i18n } = useTranslation(NAMESPACE);
  return (
    <FlowPage
      flow='exports'
      description={(parameters) =>
        t('exports.description', {
          seconds: number(parameters.pollSeconds, 15),
          minutes: number(parameters.maxMinutes, 3),
        })
      }
      title={(record) => text(record.title)}
      subtitle={(record) => t(`exports.outcomes.${text(record.vendorOutcome)}`)}
      fields={({ record }) => [
        {
          label: t('exports.fields.vendor'),
          value: t('exports.fields.vendorValue', {
            seconds: number(record.durationSeconds, 0),
            outcome: t(`exports.outcomes.${text(record.vendorOutcome)}`),
          }),
        },
        { label: t('exports.fields.job'), value: text(record.jobId) || '—' },
        {
          label: t('exports.fields.polls'),
          value: number(record.pollCount, 0),
        },
        {
          label: t('exports.fields.deadline'),
          value: record.deadlineAt
            ? dateTime(record.deadlineAt, i18n.language)
            : '—',
        },
      ]}
      banner={({ record }, now) => {
        const state = text(record.status);
        const deadline = countdown(Date.parse(text(record.deadlineAt)), now);
        switch (state) {
          case 'draft':
            return { tone: 'neutral', text: t('exports.banner.draft') };
          case 'starting':
            return { tone: 'info', text: t('exports.banner.starting') };
          case 'processing':
            return {
              tone: 'warning',
              text: t('exports.banner.processing', {
                time: deadline ?? '0:00',
              }),
            };
          case 'done':
            return {
              tone: 'success',
              text: t('exports.banner.done', { url: text(record.outputUrl) }),
            };
          case 'failed':
            return {
              tone: 'danger',
              text: t('exports.banner.failed', {
                error: text(record.lastError),
              }),
            };
          case 'timedOut':
            return { tone: 'danger', text: t('exports.banner.timedOut') };
          case 'cancelled':
            return { tone: 'neutral', text: t('exports.banner.cancelled') };
          default:
            return null;
        }
      }}
      destructive={['cancel']}
      Form={NewExport}
      Outside={Vendor}
    />
  );
}

function NewExport({ onCancel, onCreated }: FlowFormProps): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const translate = useTranslate();
  const client = flowApi(useApiClient());
  const [title, setTitle] = useState('九月订单明细');
  const [seconds, setSeconds] = useState('45');
  const [outcome, setOutcome] = useState<string>('success');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (): Promise<void> => {
    setBusy(true);
    setError('');
    try {
      const created = await client.create('exports', {
        title,
        durationSeconds: Number(seconds),
        vendorOutcome: outcome,
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
        <h2 className='text-lg font-medium'>{t('exports.form.title')}</h2>
        <label className='block space-y-1.5'>
          <span className='text-sm'>{t('exports.form.name')}</span>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <div className='grid gap-4 sm:grid-cols-2'>
          <label className='block space-y-1.5'>
            <span className='text-sm'>{t('exports.form.duration')}</span>
            <Input
              type='number'
              min={5}
              max={600}
              value={seconds}
              onChange={(event) => setSeconds(event.target.value)}
            />
          </label>
          <div className='space-y-1.5'>
            <span className='text-sm'>{t('exports.form.outcome')}</span>
            <Choice
              label={t('exports.form.outcome')}
              className='w-full'
              value={outcome}
              onChange={setOutcome}
              options={VENDOR_OUTCOMES.map((key) => ({
                value: key,
                label: t(`exports.outcomes.${key}`),
              }))}
            />
          </div>
        </div>
        <p className='text-xs text-muted-foreground'>
          {t('exports.form.hint')}
        </p>
        {error ? <p className='text-sm text-destructive'>{error}</p> : null}
        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button disabled={busy} onClick={() => void submit()}>
            {t('exports.form.submit')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * What the export knows about the vendor's job: only what its last poll
 * saw, and when it asks next. The page does not ask the vendor itself — an
 * application cannot see into a vendor that sends no webhook, which is why
 * the export polls on the server — so it learns the job's progress with
 * each poll, pushed like any other transition.
 */
function Vendor({ detail, now }: FlowDetailProps): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const record = detail.record;
  const jobId = text(record.jobId);
  const state = text(record.status);
  const lastPoll = [...detail.history.effectRuns]
    .reverse()
    .find(
      (run) => run.effect === 'exports.checkJob' && run.status === 'succeeded',
    );
  const seen = lastPoll?.result as {
    progress?: unknown;
    status?: unknown;
  } | null;
  const pollSeconds = number(detail.parameters.pollSeconds, 15);
  const nextPoll = countdown(
    Date.parse(text(record.statusChangedAt)) + pollSeconds * 1000,
    now,
  );

  return (
    <OutsideCard
      title={t('exports.outside.title')}
      description={t('exports.outside.description')}
    >
      {jobId ? (
        <Section
          title={t('exports.outside.lifecycleSide')}
          hint={t('exports.outside.lifecycleHint', { id: jobId })}
        >
          <Progress value={number(seen?.progress, 0)} />
          <p className='text-xs text-muted-foreground'>
            {seen
              ? t('exports.outside.lastPoll', {
                  status: t(
                    `exports.jobStatus.${text(seen.status) || 'running'}`,
                  ),
                  progress: number(seen.progress, 0),
                  count: number(record.pollCount, 0),
                })
              : t('exports.outside.noPoll')}
            {state === 'processing'
              ? ` ${
                  nextPoll
                    ? t('exports.outside.nextPoll', { time: nextPoll })
                    : t('exports.outside.pollDue')
                }`
              : ''}
          </p>
        </Section>
      ) : (
        <p className='text-sm text-muted-foreground'>
          {t('exports.outside.noJob')}
        </p>
      )}
    </OutsideCard>
  );
}
