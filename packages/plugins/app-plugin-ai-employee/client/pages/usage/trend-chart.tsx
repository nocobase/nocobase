import { useMemo, type ReactElement } from 'react';
import { cn } from '../../lib/utils.js';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui/tooltip.js';
import { useT } from '../../locales/index.js';
import type {
  UsageSeries,
  UsageSeriesBucket,
} from '../../usage-statistics-service.js';
import { formatUsageBucket } from './display.js';

/**
 * The trend's series, in the host theme's chart color order. Cached tokens are part of the input tokens, so the input
 * bar is split into its uncached and cached parts rather than gaining a segment: stacked, the two still add up to the
 * input total.
 */
export const USAGE_TREND_SERIES = [
  {
    key: 'uncachedInput',
    label: 'usage.uncachedInputTokens',
    color: 'bg-chart-1',
    value: (bucket: UsageSeriesBucket): number =>
      Math.max(0, bucket.inputTokens - bucket.cachedTokens),
  },
  {
    key: 'cached',
    label: 'usage.cachedTokens',
    color: 'bg-chart-2',
    value: (bucket: UsageSeriesBucket): number => bucket.cachedTokens,
  },
  {
    key: 'output',
    label: 'usage.outputTokens',
    color: 'bg-chart-3',
    value: (bucket: UsageSeriesBucket): number => bucket.outputTokens,
  },
] as const;

const TICK_COUNT = 4;
/** At most this many period labels sit under the axis, so they never collide. */
const MAX_AXIS_LABELS = 8;

/** A round axis maximum at or above `value`, split into `TICK_COUNT` equal steps. */
export function usageAxisMax(value: number): number {
  if (value <= 0) return TICK_COUNT;
  const rawStep = value / TICK_COUNT;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step =
    [1, 2, 2.5, 5, 10].find((factor) => factor * magnitude >= rawStep) ?? 10;
  return step * magnitude * TICK_COUNT;
}

function percent(value: number, max: number): string {
  return `${(value / max) * 100}%`;
}

export function UsageTrendChart({
  series,
  language,
}: {
  series: UsageSeries;
  language: string;
}): ReactElement {
  const t = useT();
  const numberFormat = useMemo(
    () => new Intl.NumberFormat(language),
    [language],
  );
  const compactFormat = useMemo(
    () =>
      new Intl.NumberFormat(language, {
        notation: 'compact',
        maximumFractionDigits: 1,
      }),
    [language],
  );
  const buckets = series.buckets.map((bucket) => ({
    bucket,
    label: formatUsageBucket(bucket.start, series.granularity, language),
    axisLabel: formatUsageBucket(bucket.start, series.granularity, language, {
      axis: true,
    }),
    values: USAGE_TREND_SERIES.map((item) => item.value(bucket)),
  }));
  const max = usageAxisMax(
    Math.max(
      0,
      ...series.buckets.map((bucket) =>
        Math.max(bucket.inputTokens, bucket.outputTokens),
      ),
    ),
  );
  const ticks = Array.from(
    { length: TICK_COUNT + 1 },
    (_, index) => (max / TICK_COUNT) * index,
  );
  const labelEvery = Math.ceil(buckets.length / MAX_AXIS_LABELS);

  return (
    <figure className='flex min-w-0 flex-col gap-3'>
      <ul
        aria-label={t('usage.trend')}
        className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'
      >
        {USAGE_TREND_SERIES.map((item) => (
          <li key={item.key} className='flex items-center gap-1.5'>
            <span
              aria-hidden='true'
              className={cn('size-2.5 rounded-xs', item.color)}
            />
            {t(item.label)}
          </li>
        ))}
      </ul>
      {/* The table below carries the same values for assistive technology. */}
      <div aria-hidden='true' className='flex min-w-0 gap-2'>
        <div className='relative h-56 w-12 shrink-0 text-right text-xs text-muted-foreground tabular-nums'>
          {ticks.map((tick) => (
            <span
              key={tick}
              className='absolute right-0 translate-y-1/2'
              style={{ bottom: percent(tick, max) }}
            >
              {compactFormat.format(tick)}
            </span>
          ))}
        </div>
        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          <div className='relative h-56'>
            {ticks.map((tick) => (
              <div
                key={tick}
                className='absolute inset-x-0 border-t border-border'
                style={{ bottom: percent(tick, max) }}
              />
            ))}
            <div className='absolute inset-0 flex items-end gap-px'>
              {buckets.map(({ bucket, label, values }) => (
                <Tooltip key={bucket.start}>
                  <TooltipTrigger
                    render={
                      <div className='flex h-full min-w-0 flex-1 items-end justify-center gap-0.5 rounded-sm px-px hover:bg-muted/60' />
                    }
                  >
                    <UsageBar
                      segments={[
                        [values[0] ?? 0, USAGE_TREND_SERIES[0].color],
                        [values[1] ?? 0, USAGE_TREND_SERIES[1].color],
                      ]}
                      max={max}
                    />
                    <UsageBar
                      segments={[[values[2] ?? 0, USAGE_TREND_SERIES[2].color]]}
                      max={max}
                    />
                  </TooltipTrigger>
                  <TooltipContent className='flex-col items-stretch gap-1'>
                    <span className='font-medium'>{label}</span>
                    {USAGE_TREND_SERIES.map((item, index) => (
                      <span
                        key={item.key}
                        className='flex items-center gap-1.5'
                      >
                        <span
                          aria-hidden='true'
                          className={cn(
                            'size-2 rounded-xs ring-1 ring-background/50',
                            item.color,
                          )}
                        />
                        <span>{t(item.label)}</span>
                        <span className='ml-auto pl-3 tabular-nums'>
                          {numberFormat.format(values[index] ?? 0)}
                        </span>
                      </span>
                    ))}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
          <div className='flex gap-px text-xs text-muted-foreground'>
            {buckets.map(({ bucket, axisLabel }, index) => (
              <span
                key={bucket.start}
                className='min-w-0 flex-1 overflow-visible text-center whitespace-nowrap'
              >
                {index % labelEvery === 0 ? axisLabel : null}
              </span>
            ))}
          </div>
        </div>
      </div>
      <table className='sr-only'>
        <caption>{t('usage.trend')}</caption>
        <thead>
          <tr>
            <th scope='col'>{t('usage.period')}</th>
            {USAGE_TREND_SERIES.map((item) => (
              <th key={item.key} scope='col'>
                {t(item.label)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {buckets.map(({ bucket, label, values }) => (
            <tr key={bucket.start}>
              <th scope='row'>{label}</th>
              {values.map((value, index) => (
                <td key={USAGE_TREND_SERIES[index]?.key}>
                  {numberFormat.format(value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** One bar, its segments stacked from the baseline with a thin gap between them and the top end rounded. */
function UsageBar({
  segments,
  max,
}: {
  segments: readonly (readonly [number, string])[];
  max: number;
}): ReactElement {
  const visible = segments.filter(([value]) => value > 0);
  const total = visible.reduce((sum, [value]) => sum + value, 0);
  return (
    <div
      data-slot='usage-bar'
      className='flex w-full max-w-3 flex-col-reverse gap-0.5'
      style={{ height: percent(total, max) }}
    >
      {visible.map(([value, color], index) => (
        <div
          key={color}
          className={cn(
            'min-h-px',
            color,
            index === visible.length - 1 && 'rounded-t-sm',
          )}
          style={{ flex: `${value} 1 0` }}
        />
      ))}
    </div>
  );
}
