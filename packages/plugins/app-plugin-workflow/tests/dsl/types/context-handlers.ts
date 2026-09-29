import type { WorkflowRunOptions } from '../../../server/instructions/run/instruction.js';
import type { FlowContext } from './workflow-context.js';

export async function calculate(
  context: FlowContext,
  options: WorkflowRunOptions,
): Promise<{ total: number }> {
  options.signal.throwIfAborted();
  await Promise.resolve();
  return { total: context.input.amount * 2 };
}

export function check(context: FlowContext): boolean {
  const result = context.nodeResults.calculate;
  // The complete workflow is typed, including later and mutually exclusive nodes.
  const later: string | undefined = context.nodeResults.after;
  const otherBranch: number | undefined = context.nodeResults.noBranch;
  void later;
  void otherBranch;
  return result !== undefined && result.total >= context.parameters.limit;
}

export function nested(context: FlowContext): { label: string } {
  return { label: context.nodeResults.decide ? 'yes' : 'no' };
}
