import type { FlowContext } from '../workflow.js';

export function run({ input, parameters }: FlowContext): { total: number } {
  return { total: input.amount * parameters.rate };
}
