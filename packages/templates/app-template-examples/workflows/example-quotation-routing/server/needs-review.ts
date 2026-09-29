import type { FlowContext } from '../workflow.js';

/** Whether the calculated total reaches the administrator's review threshold. */
export function run({ nodeResults, parameters }: FlowContext): boolean {
  const calculated = nodeResults.calculate;
  const threshold = parameters.reviewThresholdCents;
  return (
    calculated !== undefined &&
    typeof threshold === 'number' &&
    calculated.totalCents >= threshold
  );
}
