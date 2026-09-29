import type { ConditionDataBindings } from '@nocobase/app-plugin-workflow';

export function run(bindings: unknown): boolean {
  const { nodeResults, parameters } = bindings as ConditionDataBindings;
  const risk = nodeResults.calculateRisk as { score?: unknown } | undefined;
  const limit = parameters.approvalLimit;
  return (
    typeof risk?.score === 'number' &&
    typeof limit === 'number' &&
    risk.score > limit
  );
}
