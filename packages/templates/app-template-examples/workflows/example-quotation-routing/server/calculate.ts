import type { WorkflowRunOptions } from '@nocobase/app-plugin-workflow';
import type { FlowContext } from '../workflow.js';

export function calculateQuotation(input: unknown) {
  const args = input as { quotationId?: unknown; amountCents?: unknown } | null;
  if (
    !args ||
    typeof args.quotationId !== 'string' ||
    !args.quotationId.trim() ||
    args.quotationId.length > 64 ||
    typeof args.amountCents !== 'number' ||
    !Number.isSafeInteger(args.amountCents) ||
    args.amountCents < 0 ||
    args.amountCents > 100000000
  )
    throw new Error('Invalid quotation input.');
  return { quotationId: args.quotationId, totalCents: args.amountCents };
}
export function run(
  { input }: FlowContext,
  options: WorkflowRunOptions,
): ReturnType<typeof calculateQuotation> {
  options.signal.throwIfAborted();
  const result = calculateQuotation(input);
  options.logger.info('Quotation calculated', result);
  return result;
}
