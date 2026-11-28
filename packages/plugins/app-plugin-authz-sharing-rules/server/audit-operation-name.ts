import type { AuditRouteOptions } from '@nocobase/audit';
import labels from '../locales/en-US.js';

const operations: typeof labels.audit.operations = labels.audit.operations;
type Operation = keyof typeof operations;

export function auditOperationName(
  operation: Operation,
): NonNullable<AuditRouteOptions['operationName']> {
  return {
    ns: '@nocobase/app-plugin-authz-sharing-rules',
    key: `audit.operations.${operation}`,
    defaultValue: operations[operation],
  };
}
