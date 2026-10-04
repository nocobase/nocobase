import type { ApiClient } from '@nocobase/app-client';

import { aiPath, requestAI, type AIRequestQuery } from './api-client.js';

export interface UsageTotals {
  eventCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedTokens: number;
  reasoningTokens: number;
  toolCallCount: number;
  autoToolCallCount: number;
}

export interface UsageRange {
  start: number;
  end: number;
  timezoneOffsetHours: number;
}

export interface UsageSummary {
  range: UsageRange;
  totals: UsageTotals;
  previous: UsageTotals;
  previousRange: { start: number; end: number };
}

export interface UsageSeriesBucket extends UsageTotals {
  start: number;
}

export type UsageGranularity = 'hour' | 'day' | 'week' | 'month';

export interface UsageSeries {
  range: UsageRange;
  granularity: UsageGranularity;
  buckets: UsageSeriesBucket[];
}

export const USAGE_BREAKDOWN_DIMENSIONS = [
  'model',
  'aiEmployeeUsername',
  'userId',
] as const;

export type UsageBreakdownDimension =
  (typeof USAGE_BREAKDOWN_DIMENSIONS)[number];

export interface UsageBreakdownRow extends UsageTotals {
  key: string;
  label: string;
}

export interface UsageBreakdown {
  range: UsageRange;
  dimension: UsageBreakdownDimension;
  rows: UsageBreakdownRow[];
  totals: UsageTotals;
}

export interface UsageFilterOption {
  value: string;
  label: string;
}

export interface UsageFilterOptions {
  range: UsageRange;
  models: UsageFilterOption[];
  aiEmployees: UsageFilterOption[];
}

export interface UsageQuery {
  /** Inclusive range start, epoch milliseconds. */
  start: number;
  /** Inclusive range end, epoch milliseconds. */
  end: number;
  /** East-positive minutes, as `-new Date().getTimezoneOffset()` reports. */
  timezoneOffset: number;
  model?: string;
  aiEmployeeUsername?: string;
}

/** The routes take and answer times as RFC 3339 strings; this module's callers work in epoch milliseconds. */
function time(epochMs: number): string {
  return new Date(epochMs).toISOString();
}

function epochMs(value: string | number): number {
  return typeof value === 'number' ? value : Date.parse(value);
}

type Wire<T> = Omit<T, 'range'> & {
  range: Omit<UsageRange, 'start' | 'end'> & { start: string; end: string };
};

function fromWireRange<T extends { range: UsageRange }>(body: Wire<T>): T {
  return {
    ...body,
    range: {
      ...body.range,
      start: epochMs(body.range.start),
      end: epochMs(body.range.end),
    },
  } as T;
}

function rangeQuery(query: UsageQuery): AIRequestQuery {
  return {
    start: time(query.start),
    end: time(query.end),
    timezoneOffset: query.timezoneOffset,
  };
}

function toQuery(query: UsageQuery): AIRequestQuery {
  return {
    ...rangeQuery(query),
    ...(query.model ? { model: query.model } : {}),
    ...(query.aiEmployeeUsername
      ? { aiEmployeeUsername: query.aiEmployeeUsername }
      : {}),
  };
}

export async function fetchUsageSummary(
  api: ApiClient,
  query: UsageQuery & {
    /** Hours to move the comparison window back by; defaults to the range length. */
    compareShiftHours?: number;
  },
  signal?: AbortSignal,
): Promise<UsageSummary> {
  const body = await requestAI<
    Wire<UsageSummary> & { previousRange: { start: string; end: string } }
  >(api, aiPath('aiEmployee', 'usage', 'summary'), {
    query: {
      ...toQuery(query),
      ...(query.compareShiftHours === undefined
        ? {}
        : { compareShiftHours: query.compareShiftHours }),
    },
    signal,
  });
  return {
    ...fromWireRange<UsageSummary>(body),
    previousRange: {
      start: epochMs(body.previousRange.start),
      end: epochMs(body.previousRange.end),
    },
  };
}

export async function fetchUsageSeries(
  api: ApiClient,
  query: UsageQuery,
  signal?: AbortSignal,
): Promise<UsageSeries> {
  const body = await requestAI<
    Wire<Omit<UsageSeries, 'buckets'> & { range: UsageRange }> & {
      buckets: Array<Omit<UsageSeriesBucket, 'start'> & { start: string }>;
    }
  >(api, aiPath('aiEmployee', 'usage', 'series'), {
    query: toQuery(query),
    signal,
  });
  return {
    ...fromWireRange<Omit<UsageSeries, 'buckets'>>(body),
    buckets: body.buckets.map((bucket) => ({
      ...bucket,
      start: epochMs(bucket.start),
    })),
  };
}

export async function fetchUsageBreakdown(
  api: ApiClient,
  query: UsageQuery & {
    dimension: UsageBreakdownDimension;
    /** How many of the largest rows to return; the route answers 10 by default and at most 50. */
    top?: number;
  },
  signal?: AbortSignal,
): Promise<UsageBreakdown> {
  const body = await requestAI<Wire<UsageBreakdown>>(
    api,
    aiPath('aiEmployee', 'usage', 'breakdown'),
    {
      query: {
        ...toQuery(query),
        dimension: query.dimension,
        ...(query.top === undefined ? {} : { top: query.top }),
      },
      signal,
    },
  );
  return fromWireRange<UsageBreakdown>(body);
}

export async function fetchUsageFilterOptions(
  api: ApiClient,
  query: UsageQuery,
  signal?: AbortSignal,
): Promise<UsageFilterOptions> {
  // Options describe the whole range, so the current selection is not applied.
  const body = await requestAI<Wire<UsageFilterOptions>>(
    api,
    aiPath('aiEmployee', 'usage', 'filterOptions'),
    { query: rangeQuery(query), signal },
  );
  return fromWireRange<UsageFilterOptions>(body);
}
