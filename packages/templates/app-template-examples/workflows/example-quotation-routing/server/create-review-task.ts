import { databaseManagerToken } from '@nocobase/db';
import type { WorkflowRunOptions } from '@nocobase/app-plugin-workflow';
import type { FlowContext } from '../workflow.js';

export async function run(
  { nodeResults }: FlowContext,
  options: WorkflowRunOptions,
): Promise<{ runId: string }> {
  options.signal.throwIfAborted();
  const quotation = nodeResults.calculate;
  const route = nodeResults.needsFollowUp ? 'manual-follow-up' : 'standard';
  if (!quotation) throw new Error('Calculated quotation is required.');
  await options.services
    .resolve(databaseManagerToken)
    .repository('quotationReviewTasks')
    .upsertOne({
      filter: { runId: options.runId },
      create: {
        runId: options.runId,
        quotationId: quotation.quotationId,
        totalCents: quotation.totalCents,
        route,
        status: 'pending',
        createdAt: new Date(),
      },
      // A retried Run node must not reopen a task that a person submitted.
      update: {
        quotationId: quotation.quotationId,
        totalCents: quotation.totalCents,
        route,
      },
    });
  options.logger.info('Quotation review task created', {
    runId: options.runId,
  });
  return { runId: options.runId };
}
