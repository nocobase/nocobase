import type { FlowContext } from '../workflow.js';

export function run(context: FlowContext): {
  total: number;
  matched: boolean;
  snapshots: boolean;
} {
  const calculated = context.nodeResults.calculate;
  const matched = context.nodeResults.check;
  if (calculated === undefined || matched === undefined)
    throw new Error('Missing calculation or condition result');
  return {
    total: calculated.total,
    matched,
    snapshots:
      Object.isFrozen(context) &&
      Object.isFrozen(context.input) &&
      Object.isFrozen(context.parameters) &&
      Object.isFrozen(context.nodeResults),
  };
}
