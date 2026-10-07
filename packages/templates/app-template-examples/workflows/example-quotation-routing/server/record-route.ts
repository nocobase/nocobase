import type { WorkflowRunOptions } from '@nocobase/app-plugin-workflow';
import type { FlowContext } from '../workflow.js';

export function run(
  { input, nodeResults }: FlowContext,
  options: WorkflowRunOptions,
): { quotationId: string; route: string } {
  options.signal.throwIfAborted();
  const args = {
    quotationId: input.quotationId,
    route: nodeResults.needsFollowUp ? 'manual-follow-up' : 'standard',
  };
  if (
    !args ||
    typeof args.quotationId !== 'string' ||
    !['standard', 'manual-follow-up'].includes(String(args.route))
  )
    throw new Error('Invalid routing input.');
  // This classifies the quotation without changing an order.
  const result = { quotationId: args.quotationId, route: String(args.route) };
  options.logger.info('Demonstration route selected', result);
  return result;
}
