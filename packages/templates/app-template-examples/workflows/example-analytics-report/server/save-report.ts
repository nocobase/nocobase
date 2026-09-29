import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import type { WorkflowRunOptions } from '@nocobase/app-plugin-workflow';
import type { FlowContext } from '../workflow.js';
import { calculateReport } from './calculate-report.js';
import type { DailyReport } from './metrics.js';

export async function saveReport(
  database: DatabaseManager,
  input: unknown,
): Promise<DailyReport> {
  if (!input || typeof input !== 'object')
    throw new Error('Report is required.');
  // Recalculate derived values at the write boundary; only declared report fields are saved.
  const report = calculateReport({ ...input, count: 1 });
  const { date, ...values } = report;
  // The unique date selector makes repeated and concurrent invocations update one report.
  await database.repository('exampleDailyReports').upsertOne({
    filter: { date },
    create: { date, ...values },
    update: values,
  });
  return report;
}
export async function run(
  { nodeResults }: FlowContext,
  options: WorkflowRunOptions,
): Promise<DailyReport> {
  options.signal.throwIfAborted();
  const result = await saveReport(
    options.services.resolve(databaseManagerToken),
    nodeResults.calculateReport,
  );
  options.logger.info('Daily report saved', { date: result.date });
  return result;
}
