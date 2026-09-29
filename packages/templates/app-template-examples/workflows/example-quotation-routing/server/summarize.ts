import type { WorkflowRunOptions } from '@nocobase/app-plugin-workflow';
import type { FlowContext } from '../workflow.js';

export function run(
  { nodeResults }: FlowContext,
  options: WorkflowRunOptions,
): { quotationId: string; totalCents: number; route: string } {
  options.signal.throwIfAborted();
  const calculated = nodeResults.calculate;
  const args = { ...calculated, needsFollowUp: nodeResults.needsFollowUp };
  if (
    !args ||
    typeof args.quotationId !== 'string' ||
    typeof args.totalCents !== 'number' ||
    typeof args.needsFollowUp !== 'boolean'
  )
    throw new Error('Invalid quotation result.');
  return {
    quotationId: args.quotationId,
    totalCents: args.totalCents,
    route: args.needsFollowUp ? 'manual-follow-up' : 'standard',
  };
}
