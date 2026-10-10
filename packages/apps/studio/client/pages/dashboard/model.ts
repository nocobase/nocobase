/**
 * The dashboard's rules, pure so they are tested without rendering: which figures it shows and which way each is
 * better, how a figure compares with the period before, how amounts, shares and durations read, and the rows of its
 * charts and its project table. What each figure means is defined on `DashboardFigures` (`shared/reports.ts`).
 */
import type {
  DashboardBucket,
  DashboardDay,
  DashboardFigures,
  DashboardProject,
  DashboardReport,
} from '../../../shared/reports.js';

export type FigureKey = keyof DashboardFigures;

/** How a figure reads: a count, a share (0 to 1), a duration, an amount, or a number with a decimal. */
export type FigureFormat =
  'count' | 'percent' | 'duration' | 'money' | 'number';

export interface FigureSpec {
  readonly key: FigureKey;
  readonly format: FigureFormat;
  /** Which way is good news. */
  readonly better: 'up' | 'down';
  /** The sparkline's value in a stretch of the period; none for the agents' figures. */
  readonly spark?: (bucket: DashboardBucket) => number | null;
}

/** The four headline figures: delivery, how fast, how much by agents, at what cost. */
export const HEADLINES: readonly FigureSpec[] = [
  {
    key: 'completed',
    format: 'count',
    better: 'up',
    spark: (bucket) => bucket.completed,
  },
  {
    key: 'cycleTimeP50Ms',
    format: 'duration',
    better: 'down',
    spark: (bucket) => bucket.cycleTimeP50Ms,
  },
  {
    key: 'agentShare',
    format: 'percent',
    better: 'up',
    spark: (bucket) => bucket.agentShare,
  },
  {
    key: 'costPerIssue',
    format: 'money',
    better: 'down',
    spark: (bucket) => bucket.costPerIssue,
  },
];

/** How the agents perform. */
export const AGENT_FIGURES: readonly FigureSpec[] = [
  { key: 'successRate', format: 'percent', better: 'up' },
  { key: 'reworkRate', format: 'percent', better: 'down' },
  { key: 'runsPerIssue', format: 'number', better: 'down' },
  { key: 'interventionRate', format: 'percent', better: 'down' },
  { key: 'queueWaitP50Ms', format: 'duration', better: 'down' },
];

/** The figures that need the projects plugin's issues. */
export const ISSUE_FIGURES: ReadonlySet<FigureKey> = new Set([
  'completed',
  'cycleTimeP50Ms',
  'agentShare',
  'costPerIssue',
  'reworkRate',
  'runsPerIssue',
]);

/** A figure as a number in the report's currency; null when there is none. */
export function figureValue(
  figures: DashboardFigures,
  key: FigureKey,
  currency: string,
): number | null {
  const value = figures[key];
  if (value === null) return null;
  if (typeof value === 'number') return value;
  return value[currency] ?? null;
}

export interface Trend {
  /** A share's change in percentage points, anything else's relative change. */
  readonly change: number;
  readonly unit: 'points' | 'ratio';
  /** Whether the change is good news; null when nothing changed. */
  readonly good: boolean | null;
}

/** How a figure compares with the period before; null when either has none, or the one before was zero. */
export function trendOf(
  spec: Pick<FigureSpec, 'key' | 'format' | 'better'>,
  report: Pick<DashboardReport, 'current' | 'previous' | 'currency'>,
): Trend | null {
  const now = figureValue(report.current, spec.key, report.currency);
  const before = figureValue(report.previous, spec.key, report.currency);
  if (now === null || before === null) return null;
  const share = spec.format === 'percent';
  if (!share && before === 0) return null;
  const change = share ? (now - before) * 100 : (now - before) / before;
  return {
    change,
    unit: share ? 'points' : 'ratio',
    good:
      Math.abs(change) < 1e-9
        ? null
        : spec.better === 'up'
          ? change > 0
          : change < 0,
  };
}

/** An amount in its currency, without cents from a hundred up. */
export function formatAmount(
  amount: number,
  currency: string,
  locale: string,
): string {
  const digits = Math.abs(amount) >= 100 ? 0 : 2;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);
  } catch {
    return `${amount.toFixed(digits)} ${currency}`;
  }
}

/** A share (0 to 1) as a whole percent. */
export function formatPercent(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value);
}

/** A duration in the largest unit that keeps it readable: 40 s, 45 min, 5.2 h, 3.5 d. */
export function formatDuration(ms: number, locale: string): string {
  const [unit, value]: [Intl.NumberFormatOptions['unit'], number] =
    ms < 60_000
      ? ['second', ms / 1000]
      : ms < 3_600_000
        ? ['minute', ms / 60_000]
        : ms < 86_400_000
          ? ['hour', ms / 3_600_000]
          : ['day', ms / 86_400_000];
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit,
    unitDisplay: 'short',
    maximumFractionDigits: unit === 'hour' || unit === 'day' ? 1 : 0,
  }).format(value);
}

/** A figure as the dashboard reads it; `—` when there is none. */
export function formatFigure(
  value: number | null,
  format: FigureFormat,
  currency: string,
  locale: string,
): string {
  if (value === null) return '—';
  switch (format) {
    case 'percent':
      return formatPercent(value, locale);
    case 'duration':
      return formatDuration(value, locale);
    case 'money':
      return formatAmount(value, currency, locale);
    case 'number':
      return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 1,
      }).format(value);
    default:
      return new Intl.NumberFormat(locale).format(value);
  }
}

/** A trend's size with its sign: `+12%`, `−3` (points, which the caller names). */
export function formatTrend(trend: Trend, locale: string): string {
  const sign = trend.change > 0 ? '+' : trend.change < 0 ? '−' : '±';
  const size = Math.abs(trend.change);
  return trend.unit === 'points'
    ? `${sign}${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(size)}`
    : `${sign}${formatPercent(size, locale)}`;
}

/** A `YYYY-MM-DD` day as the charts' axis reads it (`10/3`, `10月3日`). */
export function dayLabel(day: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'numeric',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${day}T00:00:00Z`));
}

/** A sparkline's points; null where a stretch has no value, so the line skips it. */
export function sparkPoints(
  buckets: readonly DashboardBucket[],
  spec: FigureSpec,
): { readonly index: number; readonly value: number | null }[] {
  return buckets.map((bucket, index) => ({
    index,
    value: spec.spark?.(bucket) ?? null,
  }));
}

/** Whether a sparkline has anything to draw: at least two stretches with a value. */
export function hasSpark(
  points: readonly { readonly value: number | null }[],
): boolean {
  return points.filter((point) => point.value !== null).length >= 2;
}

/** The runs chart's rows: each day with its axis label. */
export function runRows(
  days: readonly DashboardDay[],
  locale: string,
): (DashboardDay & { readonly label: string })[] {
  return days.map((day) => ({ ...day, label: dayLabel(day.day, locale) }));
}

/** Whether any run was queued in the period. */
export function hasRuns(days: readonly DashboardDay[]): boolean {
  return days.some(
    (day) =>
      day.runsCompleted + day.runsFailed + day.runsCancelled + day.runsOpen > 0,
  );
}

/** A project's progress, done over its live issues (0 without any). */
export function progressOf(
  project: Pick<DashboardProject, 'done' | 'total'>,
): number {
  return project.total > 0 ? project.done / project.total : 0;
}

/** The most projects the table lists. */
export const PROJECTS_SHOWN = 10;

/** Whole days between an instant and now, at least 0. */
export function daysSince(iso: string, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - Date.parse(iso)) / 86_400_000));
}
