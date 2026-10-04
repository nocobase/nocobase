import { parseApiInput } from '@nocobase/app-server/router';
import type { Hono } from 'hono';
import { validator } from 'hono/validator';
import type { z } from 'zod';

import type { ServiceFactory } from '../factory/service-factory.js';
import type {
  UsageBreakdownResult,
  UsageFilterOptionsResult,
  UsageSeriesResult,
  UsageStatisticsRange,
  UsageStatisticsRequest,
  UsageSummaryResult,
} from '../service/ai-usage-statistics-service.js';
import type { AISettingsActor } from './settings-access.js';
import type { AIRouteGuards } from './settings-access.js';
import {
  UsageBreakdownQuery,
  UsageQuery,
  UsageSeriesQuery,
  UsageSummaryQuery,
} from './schemas.js';

/** A time the usage routes answer with: an RFC 3339 string, as their `start` and `end` parameters take. */
type Time = string;

/** The range a usage answer covers, as the caller sent it back in RFC 3339 rather than epoch milliseconds. */
export interface UsageRangeBody {
  readonly start: Time;
  readonly end: Time;
  readonly timezoneOffsetHours: number;
}

/** `/aiEmployee/usage`: token usage across every user, read on the AI settings page. */
export function createAIUsageStatisticsRouter(
  app: Hono,
  services: ServiceFactory,
  { settings }: AIRouteGuards,
): void {
  app.get(
    '/aiEmployee/usage/summary',
    settings,
    validator('query', (value) => parseApiInput(UsageSummaryQuery, value)),
    async (context) => {
      const { compareShiftHours, ...query } = context.req.valid('query');
      const data = await services.usageStatisticsService.summary({
        ...usageRequest(context.var.aiSettingsActor, query),
        compareShiftHours,
      });
      return context.json({ data: summaryBody(data) });
    },
  );

  app.get(
    '/aiEmployee/usage/series',
    settings,
    validator('query', (value) => parseApiInput(UsageSeriesQuery, value)),
    async (context) => {
      const { granularity, ...query } = context.req.valid('query');
      const data = await services.usageStatisticsService.series({
        ...usageRequest(context.var.aiSettingsActor, query),
        granularity,
      });
      return context.json({ data: seriesBody(data) });
    },
  );

  app.get(
    '/aiEmployee/usage/breakdown',
    settings,
    validator('query', (value) => parseApiInput(UsageBreakdownQuery, value)),
    async (context) => {
      const { dimension, top, ...query } = context.req.valid('query');
      const data = await services.usageStatisticsService.breakdown({
        ...usageRequest(context.var.aiSettingsActor, query),
        dimension,
        limit: top,
      });
      return context.json({ data: withRange(data) });
    },
  );

  app.get(
    '/aiEmployee/usage/filterOptions',
    settings,
    validator('query', (value) => parseApiInput(UsageQuery, value)),
    async (context) => {
      const data = await services.usageStatisticsService.filterOptions(
        usageRequest(context.var.aiSettingsActor, context.req.valid('query')),
      );
      return context.json({ data: withRange(data) });
    },
  );
}

function usageRequest(
  actor: AISettingsActor,
  query: z.infer<typeof UsageQuery>,
): UsageStatisticsRequest {
  return { actor, ...query };
}

function time(epochMs: number): Time {
  return new Date(epochMs).toISOString();
}

function rangeBody(range: UsageStatisticsRange): UsageRangeBody {
  return {
    start: time(range.start),
    end: time(range.end),
    timezoneOffsetHours: range.timezoneOffsetHours,
  };
}

function withRange<T extends UsageBreakdownResult | UsageFilterOptionsResult>(
  result: T,
): Omit<T, 'range'> & { range: UsageRangeBody } {
  return { ...result, range: rangeBody(result.range) };
}

function summaryBody(result: UsageSummaryResult) {
  return {
    ...result,
    range: rangeBody(result.range),
    previousRange: {
      start: time(result.previousRange.start),
      end: time(result.previousRange.end),
    },
  };
}

function seriesBody(result: UsageSeriesResult) {
  return {
    ...result,
    range: rangeBody(result.range),
    buckets: result.buckets.map((bucket) => ({
      ...bucket,
      start: time(bucket.start),
    })),
  };
}
