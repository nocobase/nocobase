/**
 * The four headline figures over the period chosen (`HEADLINES`): issues completed, the median cycle time, the share
 * completed by agents and the cost per completed issue. Each card shows the figure large, its change against the period
 * before, and a sparkline over the period's stretches (`DashboardReport.buckets`).
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { Area, AreaChart, YAxis } from 'recharts';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { cn } from 'cn';

import type { DashboardReport } from '../../../shared/reports.js';
import {
  figureValue,
  formatFigure,
  hasSpark,
  HEADLINES,
  ISSUE_FIGURES,
  sparkPoints,
  trendOf,
  type FigureSpec,
} from './model.js';
import { Bone, CardError, InfoTip, TrendText } from './parts.js';
import { useFormatLocale } from './use-format-locale.js';

const GRID = 'grid gap-4 sm:grid-cols-2 xl:grid-cols-4';

export function HeadlineFigures({
  report,
}: {
  readonly report: UseQueryResult<DashboardReport>;
}): ReactElement {
  const { t } = useTranslation();
  if (!report.data)
    return report.isError ? (
      <CardError error={report.error} onRetry={() => void report.refetch()} />
    ) : (
      <div
        role='status'
        aria-label={t('dashboard.states.loading')}
        className={GRID}
      >
        {HEADLINES.map((spec) => (
          <Card key={spec.key}>
            <CardHeader className='gap-3'>
              <Bone className='h-3.5 w-28' />
              <Bone className='h-8 w-20' />
              <Bone className='h-3 w-32' />
            </CardHeader>
            <CardContent>
              <Bone className='h-10 w-full' />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  const data = report.data;
  return (
    <div
      className={cn(
        GRID,
        'transition-opacity',
        report.isPlaceholderData && 'opacity-60',
      )}
    >
      {HEADLINES.map((spec) => (
        <HeadlineCard key={spec.key} spec={spec} report={data} />
      ))}
    </div>
  );
}

function HeadlineCard({
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
  const text = (figures: DashboardReport['current']) =>
    available
      ? formatFigure(
          figureValue(figures, spec.key, report.currency),
          spec.format,
          report.currency,
          locale,
        )
      : '—';
  const points = sparkPoints(report.buckets, spec);
  return (
    <Card>
      <CardHeader className='gap-2'>
        <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
          <span className='truncate'>{label}</span>
          <InfoTip
            label={label}
            text={t(`dashboard.figures.${spec.key}.info`)}
          />
        </div>
        <div className='font-heading text-3xl font-semibold tracking-tight tabular-nums'>
          {text(report.current)}
        </div>
        <div className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1'>
          <TrendText trend={available ? trendOf(spec, report) : null} />
          <span className='truncate text-xs text-muted-foreground'>
            {available
              ? t('dashboard.previous', { value: text(report.previous) })
              : t('dashboard.needsIssues')}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {available && hasSpark(points) ? (
          <Sparkline points={points} label={label} />
        ) : (
          // Keeps the cards the same height when a figure has too little to draw.
          <div className='h-10' aria-hidden='true' />
        )}
      </CardContent>
    </Card>
  );
}

const SPARK: ChartConfig = { value: { color: 'var(--chart-1)' } };

function Sparkline({
  points,
  label,
}: {
  readonly points: readonly { index: number; value: number | null }[];
  readonly label: string;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <ChartContainer
      config={SPARK}
      className='aspect-auto h-10 w-full'
      role='img'
      aria-label={t('dashboard.sparkline', { name: label })}
    >
      <AreaChart
        data={[...points]}
        margin={{ top: 2, right: 0, bottom: 2, left: 0 }}
      >
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Area
          dataKey='value'
          type='monotone'
          connectNulls
          isAnimationActive={false}
          stroke='var(--color-value)'
          strokeWidth={1.5}
          fill='var(--color-value)'
          fillOpacity={0.12}
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
