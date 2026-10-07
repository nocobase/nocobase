import type { WorkflowRunOptions } from '@nocobase/app-plugin-workflow';
import type { FlowContext } from '../workflow.js';

export function run(
  { nodeResults }: FlowContext,
  options: WorkflowRunOptions,
): {
  quotationId: string;
  totalCents: number;
  route: string;
  taskId: number;
  reviewerId: string;
  confirmedBy: string;
  decision: string;
  comment: string;
} {
  options.signal.throwIfAborted();
  const calculated = nodeResults.calculate;
  const args = { ...calculated, needsFollowUp: nodeResults.needsFollowUp };
  const review = nodeResults.awaitRoutingConfirmation;
  if (
    !args ||
    typeof args.quotationId !== 'string' ||
    typeof args.totalCents !== 'number' ||
    typeof args.needsFollowUp !== 'boolean' ||
    !Number.isSafeInteger(review?.taskId) ||
    typeof review?.reviewerId !== 'string' ||
    typeof review?.confirmedBy !== 'string' ||
    review.confirmedBy.length === 0 ||
    (review.decision !== 'approved' && review.decision !== 'rejected') ||
    typeof review.comment !== 'string'
  )
    throw new Error('Invalid quotation result.');
  return {
    quotationId: args.quotationId,
    totalCents: args.totalCents,
    route: args.needsFollowUp ? 'manual-follow-up' : 'standard',
    taskId: review.taskId,
    reviewerId: review.reviewerId,
    confirmedBy: review.confirmedBy,
    decision: review.decision,
    comment: review.comment,
  };
}
