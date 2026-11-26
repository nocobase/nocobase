import type { MiddlewareHandler } from 'hono';

import labels from './locales/en-US.js';
import { describeAudit } from './request.js';

/** Declare audit on a generated Repository endpoint. Repository queries also use POST, so explicitly exclude them. */
export function describeRepositoryAudit(
  exposure: string,
  collection: string,
  action: string,
): MiddlewareHandler {
  if (
    action !== 'createOne' &&
    action !== 'updateOne' &&
    action !== 'deleteOne'
  )
    return describeAudit(false);
  return describeAudit({
    action: `${exposure}:${action}`,
    resource: exposure,
    operationName: {
      ns: '@nocobase/audit',
      key: `audit.operations.${action}`,
      defaultValue: labels.audit.operations[action],
    },
    target: () => ({ collection }),
    resolveTargets: ({ value }) => ({ collection, key: value }),
    // Collection values and filter operands can contain application secrets under arbitrary names.
    captureBody: false,
    resultFrom: 'context',
  });
}
