import type {
  UsageBreakdown,
  UsageBreakdownDimension,
  UsageGranularity,
  UsageTotals,
} from '../../usage-statistics-service.js';

export const USAGE_RANGE_KEYS = ['today', '7d', '30d', '90d'] as const;
export type UsageRangeKey = (typeof USAGE_RANGE_KEYS)[number];

export const USAGE_RANGE_LABELS: Readonly<Record<UsageRangeKey, string>> = {
  today: 'usage.today',
  '7d': 'usage.last7Days',
  '30d': 'usage.last30Days',
  '90d': 'usage.last90Days',
};

export const USAGE_RANGE_DAYS: Readonly<Record<UsageRangeKey, number>> = {
  today: 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export const USAGE_DIMENSION_LABELS: Readonly<
  Record<UsageBreakdownDimension, string>
> = {
  model: 'usage.model',
  aiEmployeeUsername: 'usage.aiEmployee',
  userId: 'usage.user',
};

/** Spreadsheets only detect UTF-8 in a CSV that starts with a byte order mark. */
const UTF8_BOM = '﻿';

/** Whole local days ending at `now`, so a range never cuts a day in half. */
export function buildUsageRange(
  rangeKey: UsageRangeKey,
  now: number,
): { start: number; end: number } {
  const end = new Date(now);
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  start.setDate(start.getDate() - (USAGE_RANGE_DAYS[rangeKey] - 1));
  return { start: start.getTime(), end: now };
}

/** The relative change from `previous`, or `undefined` when there is nothing to compare against. */
export function usageDelta(
  current: number | undefined,
  previous: number | undefined,
): number | undefined {
  if (current === undefined || previous === undefined || previous === 0) {
    return undefined;
  }
  return (current - previous) / previous;
}

/** A bucket's label; `axis` drops the date from an hour, since hour buckets rarely span more than a day. */
export function formatUsageBucket(
  start: number,
  granularity: UsageGranularity,
  language: string,
  { axis = false }: { axis?: boolean } = {},
): string {
  const date = new Date(start);
  if (granularity === 'hour') {
    return new Intl.DateTimeFormat(
      language,
      axis
        ? { hour: 'numeric' }
        : { month: 'short', day: 'numeric', hour: 'numeric' },
    ).format(date);
  }
  if (granularity === 'month') {
    return new Intl.DateTimeFormat(language, {
      year: 'numeric',
      month: 'short',
    }).format(date);
  }
  return new Intl.DateTimeFormat(language, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/** The columns a breakdown exports, in order, each with its header key. */
const CSV_COLUMNS = [
  ['usage.totalTokens', 'totalTokens'],
  ['usage.inputTokens', 'inputTokens'],
  ['usage.cachedTokens', 'cachedTokens'],
  ['usage.outputTokens', 'outputTokens'],
  ['usage.llmCalls', 'eventCount'],
  ['usage.toolCalls', 'toolCallCount'],
] as const satisfies readonly (readonly [string, keyof UsageTotals])[];

function toCsv(rows: readonly (readonly string[])[]): string {
  return rows
    .map((row) =>
      row
        .map((cell) =>
          /[",\n]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell,
        )
        .join(','),
    )
    .join('\n');
}

export function usageBreakdownCsv(
  breakdown: UsageBreakdown,
  t: (key: string) => string,
): string {
  const csv = toCsv([
    [
      t(USAGE_DIMENSION_LABELS[breakdown.dimension]),
      ...CSV_COLUMNS.map(([label]) => t(label)),
    ],
    ...breakdown.rows.map((row) => [
      row.label || t('usage.unattributed'),
      ...CSV_COLUMNS.map(([, key]) => String(row[key])),
    ]),
  ]);
  return `${UTF8_BOM}${csv}`;
}

export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(
    new Blob([csv], { type: 'text/csv;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
