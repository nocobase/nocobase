import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import type { WorkflowRunOptions } from '@nocobase/app-plugin-workflow';
import type { FlowContext } from '../workflow.js';
import {
  requireCount,
  resolveReportDate,
  type DailyMetrics,
} from './metrics.js';

export async function loadMetrics(
  database: DatabaseManager,
  dateInput: unknown,
): Promise<DailyMetrics> {
  const date = resolveReportDate(dateInput);
  // Aggregate in the source database instead of persisting unbounded rows in a node result.
  const row = await database
    .query('analytics')
    .selectFrom('dailyMetrics')
    .where('date', '=', date)
    .select((eb) => [
      eb.fn.countAll().as('count'),
      ...[
        'impressions',
        'clicks',
        'conversions',
        'spendCents',
        'revenueCents',
      ].map((field) => eb.fn.sum(field).as(field)),
    ])
    .executeTakeFirst();
  return {
    date,
    count: requireCount(row?.count),
    impressions: requireCount(row?.impressions),
    clicks: requireCount(row?.clicks),
    conversions: requireCount(row?.conversions),
    spendCents: requireCount(row?.spendCents),
    revenueCents: requireCount(row?.revenueCents),
  };
}
export async function run(
  { input }: FlowContext,
  options: WorkflowRunOptions,
): Promise<DailyMetrics> {
  options.signal.throwIfAborted();
  const date = input.date;
  const result = await loadMetrics(
    options.services.resolve(databaseManagerToken),
    date,
  );
  options.signal.throwIfAborted();
  options.logger.info('Analytics metrics loaded', {
    date: result.date,
    count: result.count,
  });
  return result;
}
