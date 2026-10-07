import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
} from '@nocobase/app-server/router';
import type { Hono } from 'hono';
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
import {
  requiresSettings,
  type AIRouteGuards,
  type AISettingsActor,
} from './settings-access.js';
import { tags } from './openapi.js';
import {
  UsageBreakdownQuery,
  UsageBreakdownResponse,
  UsageFilterOptionsResponse,
  UsageQuery,
  UsageSeriesQuery,
  UsageSeriesResponse,
  UsageSummaryQuery,
  UsageSummaryResponse,
} from './schemas.js';

const RANGE =
  '`start` and `end` are RFC 3339 times with an offset and default to the last 7 days; the range is cut into whole hours and may span at most 366 days, otherwise the request is answered `400`. `timezoneOffset` (east-positive minutes) decides where days, weeks and months begin. The other parameters each keep the events with that value. ' +
  requiresSettings(['usage', 'read']);

const invalidRange = apiErrorResponse(
  400,
  'The range ends before it starts or spans more than 366 days (`INVALID_REQUEST`).',
);

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
    settings(['usage', 'read']),
    describeRoute({
      tags,
      summary: 'Get token usage totals',
      operationId: 'aiEmployeesGetUsageSummary',
      description:
        'The totals of the range and of the window before it, for period-over-period comparison; `compareShiftHours` moves that window back by other than the length of the range. ' +
        RANGE,
      responses: {
        200: dataResponse(UsageSummaryResponse),
        400: invalidRange,
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', UsageSummaryQuery),
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
    settings(['usage', 'read']),
    describeRoute({
      tags,
      summary: 'Get token usage over time',
      operationId: 'aiEmployeesGetUsageSeries',
      description:
        'The totals of each bucket of the range. `granularity` defaults to `auto`: `hour` up to 2 days, `day` up to 92 days, `month` beyond. A granularity that would give more than 800 buckets is coarsened, so the answer names the one used. ' +
        RANGE,
      responses: {
        200: dataResponse(UsageSeriesResponse),
        400: invalidRange,
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', UsageSeriesQuery),
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
    settings(['usage', 'read']),
    describeRoute({
      tags,
      summary: 'Get token usage by one dimension',
      operationId: 'aiEmployeesGetUsageBreakdown',
      description:
        'The `top` rows (10 by default, at most 50) with the most tokens when grouped by `dimension`, beside the totals of the whole range. ' +
        RANGE,
      responses: {
        200: dataResponse(UsageBreakdownResponse),
        400: invalidRange,
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', UsageBreakdownQuery),
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
    settings(['usage', 'read']),
    describeRoute({
      tags,
      summary: 'List the values usage can be filtered by',
      operationId: 'aiEmployeesListUsageFilterOptions',
      description:
        'The models and employees that appear in the range, up to 100 of each by tokens, for choosing a filter. The other filters do not narrow them. ' +
        RANGE,
      responses: {
        200: dataResponse(UsageFilterOptionsResponse),
        400: invalidRange,
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', UsageQuery),
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
