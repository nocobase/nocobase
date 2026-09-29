import type { FlowContext } from '../workflow.js';

import { requireCount } from './metrics.js';

/**
 * Whether the loaded metrics clear the administrator's minimum row count.
 *
 * A condition is a handler rather than a serialized expression, so the
 * comparison is ordinary TypeScript that the source checker typechecks with the
 * rest of the package.
 */
export function run({ nodeResults, parameters }: FlowContext): boolean {
  const metrics = nodeResults.loadMetrics;
  if (!metrics) return false;
  const minimumRows = parameters.minimumRows;
  return (
    requireCount(metrics.count) >=
    (typeof minimumRows === 'number' ? minimumRows : 1)
  );
}
