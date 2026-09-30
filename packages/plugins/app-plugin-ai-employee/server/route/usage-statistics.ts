import type { Context, Hono } from 'hono';

import type { ServiceFactory } from '../factory/service-factory.js';
import type { UsageStatisticsRequest } from '../service/ai-usage-statistics-service.js';
import { AI_USAGE_FILTER_FIELDS } from '../repository/ai-usage-event.js';

export const AI_USAGE_STATISTICS_PATHS = [
  '/aiUsage:summary',
  '/aiUsage:series',
  '/aiUsage:breakdown',
  '/aiUsage:filterOptions',
] as const;

export function createAIUsageStatisticsRouter(
  app: Hono,
  services: ServiceFactory,
): void {
  app.get('/aiUsage:summary', async (context) => {
    const result = await services.usageStatisticsService.summary({
      ...readRequest(context),
      compareShiftHours: context.req.query('compareShiftHours'),
    });
    return context.json(result as never);
  });

  app.get('/aiUsage:series', async (context) => {
    const result = await services.usageStatisticsService.series({
      ...readRequest(context),
      granularity: context.req.query('granularity'),
    });
    return context.json(result as never);
  });

  app.get('/aiUsage:breakdown', async (context) => {
    const result = await services.usageStatisticsService.breakdown({
      ...readRequest(context),
      dimension: context.req.query('dimension'),
      limit: context.req.query('limit'),
    });
    return context.json(result as never);
  });

  app.get('/aiUsage:filterOptions', async (context) => {
    const result = await services.usageStatisticsService.filterOptions(
      readRequest(context),
    );
    return context.json(result as never);
  });
}

function readRequest(context: Context): UsageStatisticsRequest {
  const filters: Record<string, string | undefined> = {};
  for (const field of AI_USAGE_FILTER_FIELDS) {
    filters[field] = context.req.query(field);
  }
  return {
    actor: context.get('usageStatisticsActor'),
    start: context.req.query('start'),
    end: context.req.query('end'),
    timezoneOffset: context.req.query('timezoneOffset'),
    ...filters,
  };
}
