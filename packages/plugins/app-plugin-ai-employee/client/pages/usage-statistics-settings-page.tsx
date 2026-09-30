import { useTranslation } from '@nocobase/i18n/client';
import { Download, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useSearchParams } from 'react-router';
import { useAIEmployeeClient } from '../ai-employee-client.js';
import { DelayedLoading } from '../components/delayed-loading.js';
import { Alert, AlertDescription } from '../components/ui/alert.js';
import { Button } from '../components/ui/button.js';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js';
import { Empty, EmptyDescription } from '../components/ui/empty.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.js';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs.js';
import { useT } from '../locales/index.js';
import { SettingsShell } from '../settings-shell.js';
import {
  USAGE_BREAKDOWN_DIMENSIONS,
  type UsageBreakdown,
  type UsageFilterOptions,
  type UsageQuery,
  type UsageSeries,
  type UsageSummary,
  type UsageTotals,
} from '../usage-statistics-service.js';
import {
  USAGE_DIMENSION_LABELS,
  USAGE_RANGE_DAYS,
  USAGE_RANGE_KEYS,
  buildUsageRange,
  downloadCsv,
  usageBreakdownCsv,
  usageDelta,
} from './usage/display.js';
import { UsageOptionFilter, UsageRangeFilter } from './usage/filters.js';
import { UsageTrendChart } from './usage/trend-chart.js';

/** The search parameters the usage page keeps its filters in. */
const USAGE_SEARCH_PARAMS = {
  range: 'range',
  dimension: 'by',
  model: 'model',
  employee: 'employee',
} as const;

const HOURS_PER_DAY = 24;

const METRICS = [
  { key: 'totalTokens', label: 'usage.totalTokens' },
  { key: 'inputTokens', label: 'usage.inputTokens' },
  { key: 'outputTokens', label: 'usage.outputTokens' },
  { key: 'cachedTokens', label: 'usage.cachedTokens' },
  { key: 'reasoningTokens', label: 'usage.reasoningTokens' },
  { key: 'eventCount', label: 'usage.llmCalls' },
  { key: 'toolCallCount', label: 'usage.toolCalls' },
] as const satisfies readonly { key: keyof UsageTotals; label: string }[];

const BREAKDOWN_COLUMNS = [
  ['usage.inputTokens', 'inputTokens'],
  ['usage.cachedTokens', 'cachedTokens'],
  ['usage.outputTokens', 'outputTokens'],
  ['usage.llmCalls', 'eventCount'],
] as const satisfies readonly (readonly [string, keyof UsageTotals])[];

interface UsageOverview {
  summary: UsageSummary;
  series: UsageSeries;
  options: UsageFilterOptions;
}

/** A request's state; a reload keeps the previous result on screen until the next one arrives. */
type LoadState<T> =
  | { status: 'loading'; previous?: T }
  | { status: 'error' }
  | { status: 'ready'; result: T };

function loading<T>(current: LoadState<T>): LoadState<T> {
  return {
    status: 'loading',
    previous:
      current.status === 'ready'
        ? current.result
        : current.status === 'loading'
          ? current.previous
          : undefined,
  };
}

function resultOf<T>(state: LoadState<T>): T | undefined {
  return state.status === 'ready'
    ? state.result
    : state.status === 'loading'
      ? state.previous
      : undefined;
}

export default function UsageStatisticsSettingsPage(): ReactElement {
  return (
    <SettingsShell title='Usage statistics' description='usage.pageDescription'>
      <UsageStatistics />
    </SettingsShell>
  );
}

function UsageStatistics(): ReactElement {
  const ai = useAIEmployeeClient();
  const t = useT();
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? 'en';
  const [searchParams, setSearchParams] = useSearchParams();
  const range =
    USAGE_RANGE_KEYS.find(
      (key) => key === searchParams.get(USAGE_SEARCH_PARAMS.range),
    ) ?? '7d';
  const dimension =
    USAGE_BREAKDOWN_DIMENSIONS.find(
      (key) => key === searchParams.get(USAGE_SEARCH_PARAMS.dimension),
    ) ?? 'model';
  const model = searchParams.get(USAGE_SEARCH_PARAMS.model) || undefined;
  const aiEmployeeUsername =
    searchParams.get(USAGE_SEARCH_PARAMS.employee) || undefined;
  // Refreshing re-anchors the range to the current time; nothing else moves it.
  const [anchor, setAnchor] = useState(() => Date.now());

  const query = useMemo<UsageQuery>(
    () => ({
      ...buildUsageRange(range, anchor),
      timezoneOffset: -new Date().getTimezoneOffset(),
      ...(model ? { model } : {}),
      ...(aiEmployeeUsername ? { aiEmployeeUsername } : {}),
    }),
    [range, anchor, model, aiEmployeeUsername],
  );
  // The range ends at the current moment, so the comparison window moves back by the preset's whole period: today is
  // measured against the same hours yesterday, not against the stretch that just ended.
  const compareShiftHours = USAGE_RANGE_DAYS[range] * HOURS_PER_DAY;

  const [overview, setOverview] = useState<LoadState<UsageOverview>>({
    status: 'loading',
  });
  const [breakdown, setBreakdown] = useState<LoadState<UsageBreakdown>>({
    status: 'loading',
  });

  useEffect(() => {
    const controller = new AbortController();
    setOverview(loading);
    void Promise.all([
      ai.fetchUsageSummary({ ...query, compareShiftHours }, controller.signal),
      ai.fetchUsageSeries(query, controller.signal),
      ai.fetchUsageFilterOptions(query, controller.signal),
    ]).then(
      ([summary, series, options]) => {
        if (!controller.signal.aborted)
          setOverview({
            status: 'ready',
            result: { summary, series, options },
          });
      },
      () => {
        if (!controller.signal.aborted) setOverview({ status: 'error' });
      },
    );
    return () => controller.abort();
  }, [ai, query, compareShiftHours]);

  useEffect(() => {
    const controller = new AbortController();
    setBreakdown(loading);
    void ai
      .fetchUsageBreakdown({ ...query, dimension }, controller.signal)
      .then(
        (result) => {
          if (!controller.signal.aborted)
            setBreakdown({ status: 'ready', result });
        },
        () => {
          if (!controller.signal.aborted) setBreakdown({ status: 'error' });
        },
      );
    return () => controller.abort();
  }, [ai, query, dimension]);

  function updateSearch(
    changes: Readonly<Record<string, string | undefined>>,
  ): void {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [name, value] of Object.entries(changes)) {
          if (value) next.set(name, value);
          else next.delete(name);
        }
        return next;
      },
      { replace: true },
    );
  }

  const data = resultOf(overview);
  const rows = resultOf(breakdown);
  const failed = overview.status === 'error' || breakdown.status === 'error';
  const empty = overview.status === 'ready' && !data?.summary.totals.eventCount;

  return (
    <div className='flex min-w-0 flex-col gap-4'>
      <div
        role='search'
        aria-label={t('usage.filters')}
        className='flex flex-wrap items-end gap-3'
      >
        <UsageRangeFilter
          range={range}
          onChange={(value) =>
            updateSearch({ [USAGE_SEARCH_PARAMS.range]: value })
          }
        />
        <UsageOptionFilter
          label={t('usage.aiEmployee')}
          placeholder={t('usage.allAiEmployees')}
          emptyLabel={t('usage.noAiEmployees')}
          options={data?.options.aiEmployees ?? []}
          value={aiEmployeeUsername}
          onChange={(value) =>
            updateSearch({ [USAGE_SEARCH_PARAMS.employee]: value })
          }
        />
        <UsageOptionFilter
          label={t('usage.model')}
          placeholder={t('usage.allModels')}
          emptyLabel={t('usage.noModels')}
          options={data?.options.models ?? []}
          value={model}
          onChange={(value) =>
            updateSearch({ [USAGE_SEARCH_PARAMS.model]: value })
          }
        />
        <Button
          variant='outline'
          className='ml-auto'
          onClick={() => setAnchor(Date.now())}
        >
          <RefreshCw data-icon='inline-start' />
          {t('usage.refresh')}
        </Button>
      </div>
      {failed ? (
        <Alert variant='destructive'>
          <AlertDescription className='flex flex-col items-start gap-3'>
            <p>{t('usage.error')}</p>
            <Button variant='outline' onClick={() => setAnchor(Date.now())}>
              {t('Retry')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {!data ? (
        overview.status === 'loading' ? (
          <DelayedLoading label={t('usage.loading')} />
        ) : null
      ) : (
        <div
          aria-busy={overview.status === 'loading'}
          className='flex min-w-0 flex-col gap-4'
        >
          <UsageMetrics summary={data.summary} language={language} />
          {empty ? (
            <Empty role='status' className='border'>
              <EmptyDescription>{t('usage.empty')}</EmptyDescription>
            </Empty>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle role='heading' aria-level={2}>
                    {t('usage.trend')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UsageTrendChart series={data.series} language={language} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle role='heading' aria-level={2}>
                    {t('usage.breakdown')}
                  </CardTitle>
                  <CardAction className='flex flex-wrap items-center gap-2'>
                    <Tabs
                      value={dimension}
                      onValueChange={(value) =>
                        updateSearch({
                          [USAGE_SEARCH_PARAMS.dimension]: String(value),
                        })
                      }
                    >
                      <TabsList aria-label={t('usage.breakdownBy')}>
                        {USAGE_BREAKDOWN_DIMENSIONS.map((key) => (
                          <TabsTrigger key={key} value={key}>
                            {t(USAGE_DIMENSION_LABELS[key])}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={!rows?.rows.length}
                      onClick={() => {
                        if (!rows) return;
                        downloadCsv(
                          `ai-usage-${rows.dimension}-${new Date(query.start)
                            .toISOString()
                            .slice(0, 10)}.csv`,
                          usageBreakdownCsv(rows, t),
                        );
                      }}
                    >
                      <Download data-icon='inline-start' />
                      {t('usage.exportCsv')}
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className='px-0'>
                  {rows ? (
                    <UsageBreakdownTable
                      breakdown={rows}
                      busy={breakdown.status === 'loading'}
                      language={language}
                    />
                  ) : breakdown.status === 'loading' ? (
                    <DelayedLoading label={t('usage.loading')} />
                  ) : null}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function UsageMetrics({
  summary,
  language,
}: {
  summary: UsageSummary;
  language: string;
}): ReactElement {
  const t = useT();
  const numberFormat = new Intl.NumberFormat(language);
  const percentFormat = new Intl.NumberFormat(language, {
    style: 'percent',
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  });
  return (
    <section aria-label={t('usage.summary')}>
      <dl className='grid grid-cols-2 gap-3 md:grid-cols-4'>
        {METRICS.map((metric) => {
          const delta = usageDelta(
            summary.totals[metric.key],
            summary.previous[metric.key],
          );
          const Trend =
            delta !== undefined && delta < 0 ? TrendingDown : TrendingUp;
          return (
            <Card key={metric.key} size='sm'>
              <CardContent className='flex flex-col gap-1'>
                <dt className='text-xs text-muted-foreground'>
                  {t(metric.label)}
                </dt>
                <dd className='text-2xl font-semibold tabular-nums'>
                  {numberFormat.format(summary.totals[metric.key])}
                </dd>
                <dd className='flex items-center gap-1 text-xs text-muted-foreground'>
                  {delta === undefined ? (
                    t('usage.noComparison')
                  ) : (
                    <>
                      <Trend aria-hidden='true' className='size-3.5' />
                      <span className='font-medium text-foreground tabular-nums'>
                        {percentFormat.format(delta)}
                      </span>
                      {t('usage.vsPreviousPeriod')}
                    </>
                  )}
                </dd>
              </CardContent>
            </Card>
          );
        })}
      </dl>
    </section>
  );
}

function UsageBreakdownTable({
  breakdown,
  busy,
  language,
}: {
  breakdown: UsageBreakdown;
  busy: boolean;
  language: string;
}): ReactElement {
  const t = useT();
  const numberFormat = new Intl.NumberFormat(language);
  const percentFormat = new Intl.NumberFormat(language, {
    style: 'percent',
    maximumFractionDigits: 1,
  });
  const total = breakdown.totals.totalTokens;
  return (
    <Table aria-label={t('usage.breakdown')} aria-busy={busy}>
      <TableHeader>
        <TableRow>
          <TableHead className='pl-4'>
            {t(USAGE_DIMENSION_LABELS[breakdown.dimension])}
          </TableHead>
          <TableHead className='text-right'>{t('usage.totalTokens')}</TableHead>
          <TableHead className='text-right'>{t('usage.share')}</TableHead>
          {BREAKDOWN_COLUMNS.map(([label]) => (
            <TableHead key={label} className='text-right last:pr-4'>
              {t(label)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {breakdown.rows.length ? (
          breakdown.rows.map((row) => (
            <TableRow key={row.key || '—'}>
              <TableCell className='max-w-72 pl-4 font-medium'>
                <span className='block truncate' title={row.label}>
                  {row.label || t('usage.unattributed')}
                </span>
              </TableCell>
              <TableCell className='text-right tabular-nums'>
                {numberFormat.format(row.totalTokens)}
              </TableCell>
              <TableCell className='text-right text-muted-foreground tabular-nums'>
                {total > 0
                  ? percentFormat.format(row.totalTokens / total)
                  : '—'}
              </TableCell>
              {BREAKDOWN_COLUMNS.map(([label, key]) => (
                <TableCell
                  key={label}
                  className='text-right tabular-nums last:pr-4'
                >
                  {numberFormat.format(row[key])}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={3 + BREAKDOWN_COLUMNS.length}
              className='py-10 text-center text-muted-foreground'
            >
              {t('usage.empty')}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
