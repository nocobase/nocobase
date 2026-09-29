import type { FlowContext } from '../workflow.js';

export function run({ parameters, nodeResults }: FlowContext): boolean {
  return (
    nodeResults.calculate !== undefined &&
    nodeResults.calculate.total > parameters.limit
  );
}
