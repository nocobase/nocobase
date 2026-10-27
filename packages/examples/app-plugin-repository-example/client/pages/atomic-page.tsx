import { createOperationKey } from '@nocobase/api-client';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { useApiClient, ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import {
  atomicRepository,
  atomicUpdate,
  type AtomicCounter,
  type AtomicChange,
} from '../atomic.js';
import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js';

const NS = '@nocobase/app-plugin-repository-example';
const scenarios = [
  {
    id: 'demo-stock',
    title: 'atomicStock',
    hint: 'atomicStockHint',
    initial: '10',
    actions: ['increment', 'decrement'],
  },
  {
    id: 'demo-wallet',
    title: 'atomicWallet',
    hint: 'atomicWalletHint',
    initial: '500',
    actions: ['increment', 'decrement'],
  },
  {
    id: 'demo-points',
    title: 'atomicPoints',
    hint: 'atomicPointsHint',
    initial: '10',
    actions: ['increment', 'multiply'],
  },
  {
    id: 'demo-visits',
    title: 'atomicVisits',
    hint: 'atomicVisitsHint',
    initial: '1',
    actions: ['increment', 'concurrent'],
  },
] as const;
interface Trace {
  readonly action: string;
  readonly input: unknown;
  readonly output: unknown;
}
export default function AtomicPage(): ReactElement {
  const api = useApiClient();
  const repo = useMemo(() => atomicRepository(api), [api]);
  const { t } = useTranslation(NS);
  const [records, setRecords] = useState<AtomicCounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const [amounts, setAmounts] = useState<Record<string, string>>(
    Object.fromEntries(
      scenarios.map((scenario) => [scenario.id, scenario.initial]),
    ),
  );
  const [traces, setTraces] = useState<Trace[]>([]);
  const trace = (entry: Trace): void =>
    setTraces((current) => [entry, ...current].slice(0, 10));
  useEffect(() => {
    let active = true;
    void repo
      .findMany({ limit: 100 })
      .then((result) => {
        if (active) setRecords(result);
      })
      .catch((value: unknown) => {
        if (active)
          setError(value instanceof Error ? value.message : t('loadError'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [repo, revision, t]);
  const reload = (): void => {
    setLoading(true);
    setError('');
    setRevision((value) => value + 1);
  };
  async function update(
    id: string,
    change: AtomicChange | 'concurrent',
  ): Promise<void> {
    setBusy(true);
    setError('');
    setNotice('');
    const input = atomicUpdate(
      id,
      change === 'concurrent' ? { increment: 1 } : change,
    );
    try {
      if (change === 'concurrent') {
        const results = await Promise.allSettled(
          Array.from({ length: 10 }, () =>
            repo.updateOne({ ...input, idempotencyKey: createOperationKey() }),
          ),
        );
        const succeeded = results.filter(
          (result) => result.status === 'fulfilled',
        ).length;
        trace({
          action: '10 × updateOne',
          input,
          output: results.map((result) =>
            result.status === 'fulfilled'
              ? result.value
              : {
                  error:
                    result.reason instanceof Error
                      ? result.reason.message
                      : t('error'),
                },
          ),
        });
        setNotice(t('atomicConcurrentResult', { count: succeeded }));
        if (succeeded !== 10) setError(t('atomicPartial'));
      } else {
        const result = await repo.updateOne({
          ...input,
          idempotencyKey: createOperationKey(),
        });
        trace({ action: 'updateOne', input, output: result });
        setNotice(t('atomicUpdated', { value: result.record.value }));
      }
    } catch (value) {
      const message =
        value instanceof ApiClientError && value.status === 404
          ? t('atomicInsufficient')
          : value instanceof Error
            ? value.message
            : t('error');
      trace({ action: 'updateOne', input, output: { error: message } });
      setError(message);
    } finally {
      // Read the committed value even after partial concurrency success or a
      // response failure; never derive the new value from a browser snapshot.
      try {
        setRecords(await repo.findMany({ limit: 100 }));
      } catch (value) {
        setError(value instanceof Error ? value.message : t('loadError'));
      }
      setBusy(false);
    }
  }
  return (
    <PageContainer>
      <PageHeader
        actions={
          <Button variant='outline' disabled={loading || busy} onClick={reload}>
            {t('refresh')}
          </Button>
        }
        description={t('atomicIntro')}
        title={t('atomicTitle')}
      />
      {error && (
        <p
          role='alert'
          className='rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs font-medium text-destructive'
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role='status'
          className='text-xs leading-relaxed text-muted-foreground'
        >
          {notice}
        </p>
      )}
      {loading && (
        <p
          role='status'
          className='text-xs leading-relaxed text-muted-foreground'
        >
          {t('loading')}
        </p>
      )}
      <div className='grid gap-4 md:grid-cols-2'>
        {scenarios.map((scenario) => {
          const record = records.find((entry) => entry.id === scenario.id);
          const amount = Number(amounts[scenario.id]);
          const valid =
            Number.isSafeInteger(amount) && amount > 0 && amount <= 1000000;
          return (
            <Card
              key={scenario.id}
              className='min-w-0 rounded-xl shadow-2xs'
              role='region'
              aria-label={t(scenario.title)}
            >
              <CardHeader>
                <CardTitle className='text-base font-semibold'>
                  {t(scenario.title)}
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-xs leading-relaxed text-muted-foreground'>
                  {t(scenario.hint)}
                </p>
                <output
                  aria-label={t(scenario.title)}
                  className='block rounded-lg border bg-muted/20 p-4 font-mono text-4xl font-semibold tabular-nums'
                >
                  {record?.value ?? '—'}
                </output>
                {!loading && !record && (
                  <p className='text-xs leading-relaxed text-muted-foreground'>
                    {t('atomicSeedHint')}
                  </p>
                )}
                <label className='block space-y-2 text-sm'>
                  <span>{t('atomicAmount')}</span>
                  <Input
                    type='number'
                    min={1}
                    max={1000000}
                    step={1}
                    aria-label={`${t(scenario.title)} — ${t('atomicAmount')}`}
                    disabled={busy || loading || !record}
                    value={amounts[scenario.id]}
                    onChange={(event) =>
                      setAmounts((current) => ({
                        ...current,
                        [scenario.id]: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className='flex flex-wrap gap-2'>
                  {scenario.actions.map((action) => (
                    <Button
                      key={action}
                      variant={action === 'decrement' ? 'outline' : 'default'}
                      disabled={
                        busy ||
                        loading ||
                        !record ||
                        ((action === 'increment' || action === 'decrement') &&
                          !valid)
                      }
                      onClick={() =>
                        void update(
                          scenario.id,
                          action === 'concurrent'
                            ? 'concurrent'
                            : action === 'multiply'
                              ? { multiply: 2 }
                              : action === 'increment'
                                ? { increment: amount }
                                : { decrement: amount },
                        )
                      }
                    >
                      {t(`atomic_${action}`)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <details className='rounded-xl border bg-card p-4 shadow-2xs' open>
        <summary className='cursor-pointer text-xs font-medium text-foreground'>
          {t('trace')}
        </summary>
        <p className='my-3 text-sm text-muted-foreground'>
          {t('atomicTraceHint')}
        </p>
        {traces.map((entry, index) => (
          <details
            key={`${traces.length - index}-${entry.action}`}
            className='my-2 rounded-lg border bg-muted/15 p-3'
            open={index === 0}
          >
            <summary className='cursor-pointer font-mono text-sm'>
              {entry.action}
            </summary>
            <div className='mt-3 grid gap-4 md:grid-cols-2'>
              <section>
                <h3 className='mb-2 text-xs font-medium'>{t('request')}</h3>
                <pre className='max-h-72 overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs text-foreground'>
                  {JSON.stringify(entry.input, null, 2)}
                </pre>
              </section>
              <section>
                <h3 className='mb-2 text-xs font-medium'>{t('response')}</h3>
                <pre className='max-h-72 overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs text-foreground'>
                  {JSON.stringify(entry.output, null, 2)}
                </pre>
              </section>
            </div>
          </details>
        ))}
      </details>
    </PageContainer>
  );
}
