import type { ConditionDataBindings } from '@nocobase/app-plugin-workflow';

export function run(bindings: unknown): boolean {
  const { nodeResults } = bindings as ConditionDataBindings;
  const order = nodeResults.loadOrder as { inStock?: unknown } | undefined;
  return order?.inStock === true;
}
