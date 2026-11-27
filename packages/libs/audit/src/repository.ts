import labels from './locales/en-US.js';
import type { AuditRouteOptions } from './request.js';

/** Declare audit on a generated Repository endpoint. Repository queries also use POST, so explicitly exclude them. */
export function repositoryAuditOptions(
  exposure: string,
  collection: string,
  action: string,
): AuditRouteOptions | false {
  if (
    action !== 'createOne' &&
    action !== 'updateOne' &&
    action !== 'deleteOne'
  )
    return false;
  return {
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
  };
}
