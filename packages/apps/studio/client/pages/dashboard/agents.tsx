/**
 * How the agents perform over the period (`AGENT_FIGURES`): run success, rework, runs per completed issue, human
 * intervention and queue wait, each against the period before with its definition behind ⓘ; then the runs queued each
 * day by how they ended, as stacked areas (bars over 7 days, where a few days read better as columns).
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { UseQueryResult } from '@tanstack/react-query';
import { BotIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Separator } from '@/components/ui/separator';
import { cn } from 'cn';

import type { DashboardReport } from '../../../shared/reports.js';
import {
  AGENT_FIGURES,
  figureValue,
  formatFigure,
  hasRuns,
  ISSUE_FIGURES,
  runRows,
  trendOf,
  type FigureSpec,
} from './model.js';
import {
  Bone,
  CardEmpty,
  CardError,
  DashboardCard,
  InfoTip,
  TrendText,
} from './parts.js';
import { useFormatLocale } from './use-format-locale.js';

const FIGURES_GRID = 'grid gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5';

export function AgentPerformance({
  report,
}: {
  readonly report: UseQueryResult<DashboardReport>;
}): ReactElement {
  const { t } = useTranslation();
  const data = report.data;
  return (
    <DashboardCard
      title={t('dashboard.agents.title')}
      description={t('dashboard.agents.description')}
    >
      {!data ? (
        report.isError ? (
          <CardError
            error={report.error}
            onRetry={() => void report.refetch()}
          />
        ) : (
          <div
            role='status'
            aria-label={t('dashboard.states.loading')}
            className='flex flex-col gap-6'
          >
            <div className={FIGURES_GRID}>
              {AGENT_FIGURES.map((spec) => (
                <div key={spec.key} className='flex flex-col gap-2'>
                  <Bone className='h-3.5 w-24' />
                  <Bone className='h-6 w-14' />
                </div>
              ))}
            </div>
            <Bone className='h-56 w-full' />
          </div>
        )
      ) : (
        <div
          className={cn(
            'flex flex-col gap-6 transition-opacity',
            report.isPlaceholderData && 'opacity-60',
          )}
        >
          <div className={FIGURES_GRID}>
            {AGENT_FIGURES.map((spec) => (
              <AgentFigure key={spec.key} spec={spec} report={data} />
            ))}
          </div>
          <Separator />
          <RunsChart report={data} />
        </div>
      )}
    </DashboardCard>
  );
}

function AgentFigure({
  spec,
  report,
}: {
  readonly spec: FigureSpec;
  readonly report: DashboardReport;
}): ReactElement {
  const { t } = useTranslation();
  const locale = useFormatLocale();
  const label = t(`dashboard.figures.${spec.key}.label`);
  const available = report.subjects || !ISSUE_FIGURES.has(spec.key);
  const value = available
    ? formatFigure(
        figureValue(report.current, spec.key, report.currency),
        spec.format,
        report.currency,
        locale,
      )
    : '—';
  return (
    <div className='flex min-w-0 flex-col gap-1'>
      <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
        <span className='truncate'>{label}</span>
        <InfoTip label={label} text={t(`dashboard.figures.${spec.key}.info`)} />
      </div>
      <div className='font-heading text-xl font-semibold tabular-nums'>
        {value}
      </div>
      <TrendText trend={available ? trendOf(spec, report) : null} />
    </div>
  );
}

function RunsChart({
  report,
}: {
  readonly report: DashboardReport;
}): ReactElement {
  const { t } = useTranslation();
  const locale = useFormatLocale();
  const config = {
    runsCompleted: {
      label: t('dashboard.series.completed'),
      color: 'var(--chart-1)',
    },
    runsFailed: {
      label: t('dashboard.series.failed'),
      color: 'var(--destructive)',
    },
    runsCancelled: {
      label: t('dashboard.series.cancelled'),
      color: 'var(--muted-foreground)',
    },
    runsOpen: {
      label: t('dashboard.series.open'),
      color: 'var(--border)',
    },
  } satisfies ChartConfig;
  const keys = Object.keys(config) as (keyof typeof config)[];
  const rows = runRows(report.daily, locale);
  const heading = (
    <div className='flex flex-col gap-0.5'>
      <h3 className='text-sm font-medium'>{t('dashboard.agents.chart')}</h3>
      <p className='text-sm text-muted-foreground'>
        {t('dashboard.agents.chartDescription')}
      </p>
    </div>
  );
  if (!hasRuns(report.daily))
    return (
      <div className='flex flex-col gap-4'>
        {heading}
        <CardEmpty
          icon={BotIcon}
          title={t('dashboard.agents.noRunsTitle')}
          description={t('dashboard.agents.noRunsDescription')}
        />
      </div>
    );
  const axes = (
    <>
      <CartesianGrid vertical={false} />
      <XAxis
        dataKey='label'
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        minTickGap={24}
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        width={32}
        allowDecimals={false}
      />
      <ChartTooltip content={<ChartTooltipContent indicator='dot' />} />
      <ChartLegend content={<ChartLegendContent />} />
    </>
  );
  return (
    <div className='flex flex-col gap-4'>
      {heading}
      <ChartContainer config={config} className='aspect-auto h-56 w-full'>
        {report.days === 7 ? (
          <BarChart accessibilityLayer data={rows}>
            {axes}
            {keys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                stackId='runs'
                fill={`var(--color-${key})`}
                radius={index === keys.length - 1 ? [3, 3, 0, 0] : 0}
              />
            ))}
          </BarChart>
        ) : (
          <AreaChart accessibilityLayer data={rows}>
            {axes}
            {keys.map((key) => (
              <Area
                key={key}
                dataKey={key}
                type='monotone'
                stackId='runs'
                stroke={`var(--color-${key})`}
                fill={`var(--color-${key})`}
                fillOpacity={key === 'runsCompleted' ? 0.25 : 0.35}
              />
            ))}
          </AreaChart>
        )}
      </ChartContainer>
    </div>
  );
}
