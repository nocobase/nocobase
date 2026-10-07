/**
 * The usage page's rules, pure so they are tested without rendering: the default range, the grouping read from the URL,
 * how amounts, tokens, durations and ranges read, the range presets, where a row links to, and the daily trend chart's series.
 */
import {
  USAGE_GROUP_BYS,
  type Costs,
  type UsageGroupBy,
  type UsageReport,
  type UsageSeriesPoint,
} from '../../../shared/reports.js';
import type { SubjectVocabulary } from '../../../shared/vocabulary.js';

/** `YYYY-MM-DD` of a local date. */
export function toDay(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The last `days` calendar days ending today (30, today included). */
export function defaultRange(
  today: Date = new Date(),
  days = 30,
): { readonly from: string; readonly to: string } {
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - (days - 1),
  );
  return { from: toDay(start), to: toDay(today) };
}

export function readGroup(value: string | null): UsageGroupBy {
  return (USAGE_GROUP_BYS as readonly string[]).includes(value ?? '')
    ? (value as UsageGroupBy)
    : 'agent';
}

/** An amount in its currency; sub-cent amounts keep four decimals. */
export function formatAmount(
  amount: number,
  currency: string,
  locale: string,
): string {
  const small = amount !== 0 && Math.abs(amount) < 0.01;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: small ? 4 : 2,
      maximumFractionDigits: small ? 4 : 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(small ? 4 : 2)} ${currency}`;
  }
}

/** "—" when nothing was priced; several currencies are joined. */
export function formatCost(
  costs: Costs | null | undefined,
  locale: string,
): string {
  const entries = Object.entries(costs ?? {});
  if (entries.length === 0) return '—';
  return entries
    .map(([currency, amount]) => formatAmount(amount, currency, locale))
    .join(' + ');
}

/** Tokens in compact notation (12.3K, 4.5M); exact below a thousand. */
export function formatTokens(value: number, locale: string): string {
  if (Math.abs(value) < 1000)
    return new Intl.NumberFormat(locale).format(value);
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

const DURATION_UNITS: readonly (readonly [
  NonNullable<Intl.NumberFormatOptions['unit']>,
  number,
])[] = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
  ['second', 1000],
];

/**
 * A duration as people say it, in its two largest units: 850 ms, 42 s, 3 min 20 s, 5 hr 12 min, 2 days 3 hr. "—" when
 * there is none.
 */
export function formatDuration(
  ms: number | null | undefined,
  locale: string,
): string {
  if (!ms || !Number.isFinite(ms) || ms <= 0) return '—';
  const unit = (value: number, name: Intl.NumberFormatOptions['unit']) =>
    new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: name,
      unitDisplay: 'short',
      maximumFractionDigits: 0,
    }).format(value);
  if (ms < 1000) return unit(Math.round(ms), 'millisecond');
  let rest = Math.round(ms / 1000) * 1000;
  const parts: string[] = [];
  for (const [name, size] of DURATION_UNITS) {
    if (parts.length === 2) break;
    const count = Math.floor(rest / size);
    rest -= count * size;
    if (count > 0) parts.push(unit(count, name));
    else if (parts.length > 0) break;
  }
  return parts.join(' ');
}

/** The quick ranges the date range picker offers. */
export const RANGE_PRESETS = [
  'last7',
  'last30',
  'thisMonth',
  'lastMonth',
  'last90',
] as const;

export type RangePreset = (typeof RANGE_PRESETS)[number];

/** The `from` and `to` days of a preset, relative to `today`. */
export function presetRange(
  preset: RangePreset,
  today: Date = new Date(),
): { readonly from: string; readonly to: string } {
  const year = today.getFullYear();
  const month = today.getMonth();
  switch (preset) {
    case 'last7':
      return defaultRange(today, 7);
    case 'last30':
      return defaultRange(today, 30);
    case 'last90':
      return defaultRange(today, 90);
    case 'thisMonth':
      return { from: toDay(new Date(year, month, 1)), to: toDay(today) };
    case 'lastMonth':
      return {
        from: toDay(new Date(year, month - 1, 1)),
        to: toDay(new Date(year, month, 0)),
      };
  }
}

/** A local date of `YYYY-MM-DD`; undefined when it is not one. */
export function fromDay(day: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return undefined;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** A range in the locale's words, the year said once when both ends share it: "2026年9月6日 – 10月5日", "Sep 6, 2026 – Oct 5". */
export function formatDayRange(
  from: string,
  to: string,
  locale: string,
): string {
  const start = fromDay(from);
  const end = fromDay(to);
  if (!start || !end) return `${from} – ${to}`;
  const full = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  if (from === to) return full.format(start);
  const short = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  });
  const sameYear = start.getFullYear() === end.getFullYear();
  return `${full.format(start)} – ${(sameYear ? short : full).format(end)}`;
}

/**
 * Where a row links to: an agent to its page, a group or a subject (`kind:id`) to where the application shows it
 * (`SubjectVocabulary.path`, `groupPath`); null when nowhere.
 */
export function rowLink(
  groupBy: UsageGroupBy,
  key: string,
  subjects: readonly SubjectVocabulary[],
): string | null {
  if (!key) return null;
  const fill = (path: string | null | undefined, id: string) =>
    path ? path.replace('{id}', encodeURIComponent(id)) : null;
  switch (groupBy) {
    case 'agent':
      return `/agents/${encodeURIComponent(key)}`;
    case 'group':
      return fill(
        subjects.find((subject) => subject.groupPath)?.groupPath,
        key,
      );
    case 'subject': {
      const at = key.indexOf(':');
      if (at < 0) return null;
      const kind = key.slice(0, at);
      return fill(
        subjects.find((subject) => subject.kind === kind)?.path,
        key.slice(at + 1),
      );
    }
    default:
      return null;
  }
}

/** The groupings the trend chart stacks by their top series; the others show one series, the day's total. */
export const STACKED_GROUP_BYS: readonly UsageGroupBy[] = ['agent', 'model'];

/** How many groups the chart stacks before the rest become "other". */
export const CHART_TOP = 5;

export type ChartMetric = 'cost' | 'tokens';

/** A series of the chart: `total`, `other`, or a row's key under a CSS-safe id (`s0`, `s1`, …). */
export interface ChartSeries {
  readonly id: string;
  readonly key?: string;
}

export interface UsageChartData {
  /** The currency costs are charted in: the one with the largest total; null when nothing was priced. */
  readonly currency: string | null;
  readonly series: readonly ChartSeries[];
  /** One per day of the range, oldest first: `day` and a value per series id. */
  readonly points: readonly Readonly<Record<string, number | string>>[];
}

/** Every `YYYY-MM-DD` day from `from` to `to`, both included. */
export function rangeDays(from: string, to: string): string[] {
  const days: string[] = [];
  const end = Date.parse(`${to}T00:00:00Z`);
  for (
    let at = Date.parse(`${from}T00:00:00Z`);
    at <= end && days.length <= 366;
    at += 86_400_000
  )
    days.push(new Date(at).toISOString().slice(0, 10));
  return days;
}

/** The currency with the largest amount; null when there is none. */
export function chartCurrency(costs: Costs | null | undefined): string | null {
  const entries = Object.entries(costs ?? {}).sort(([, a], [, b]) => b - a);
  return entries[0]?.[0] ?? null;
}

/**
 * The chart of `report.daily` for `metric`: tokens count every kind (input, output, cache read and write), cost the
 * chart's currency only. Stacked (`daily[].series` present), the first `top` rows are their own series and the rest
 * add up to `other`; a single extra row is shown rather than folded.
 */
export function usageChart(
  report: UsageReport,
  metric: ChartMetric,
  top: number = CHART_TOP,
): UsageChartData {
  const currency = chartCurrency(report.totals.cost);
  const value = (cell: Omit<UsageSeriesPoint, 'key'>): number =>
    metric === 'tokens'
      ? cell.inputTokens +
        cell.outputTokens +
        cell.cacheReadTokens +
        cell.cacheWriteTokens
      : currency
        ? (cell.cost?.[currency] ?? 0)
        : 0;
  const stacked = report.daily.some((point) => point.series);
  const keys = report.rows.map((row) => row.key);
  const shown = !stacked
    ? []
    : keys.length <= top + 1
      ? keys
      : keys.slice(0, top);
  const idOf = new Map(shown.map((key, index) => [key, `s${index}`]));
  const series: ChartSeries[] = !stacked
    ? [{ id: 'total' }]
    : [
        ...shown.map((key, index) => ({ id: `s${index}`, key })),
        ...(keys.length > shown.length ? [{ id: 'other' }] : []),
      ];
  const byDay = new Map(report.daily.map((point) => [point.day, point]));
  const points = rangeDays(report.from, report.to).map((day) => {
    const point: Record<string, number | string> = { day };
    for (const one of series) point[one.id] = 0;
    const daily = byDay.get(day);
    if (!daily) return point;
    if (!stacked) point.total = value(daily);
    else
      for (const cell of daily.series ?? []) {
        const id = idOf.get(cell.key) ?? 'other';
        point[id] = Number(point[id] ?? 0) + value(cell);
      }
    return point;
  });
  return { currency, series, points };
}
