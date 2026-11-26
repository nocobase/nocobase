import { auditRecordKey, type AuditRouteOptions } from '@nocobase/audit';
import type { Context } from 'hono';
import auditLabels from '../locales/en-US.js';
import type { AuthEnv } from './auth.js';

const labels = auditLabels.audit.operations;
type Operation = keyof typeof labels;
const operations: ReadonlyMap<string, readonly [Operation, boolean?]> = new Map(
  [
    ['/sign-in/email', ['signIn', true]],
    ['/sign-in/username', ['signIn', true]],
    ['/sign-up/email', ['signUp', true]],
    ['/sign-out', ['signOut']],
    ['/change-password', ['changePassword']],
    ['/reset-password', ['resetPassword', true]],
    ['/update-user', ['updateProfile']],
  ],
);

function operationName(
  operation: Operation,
): NonNullable<AuditRouteOptions['operationName']> {
  return {
    ns: '@nocobase/app-plugin-authentication',
    key: `audit.operations.${operation}`,
    defaultValue: labels[operation],
  };
}

export function authAuditOptions(path: string): AuditRouteOptions | false {
  if (path === '/api-key/create' || path === '/api-key/delete') {
    const create = path === '/api-key/create';
    return {
      action: create ? 'auth:createApiKey' : 'auth:revokeApiKey',
      operationName: operationName(create ? 'createApiKey' : 'revokeApiKey'),
      resource: 'apikey',
      captureBody: false,
      resultFrom: create ? 'response' : 'request',
      target: () => ({ collection: 'apikey' }),
      resolveTargets: ({ request, response }) => ({
        collection: 'apikey',
        key: create
          ? auditRecordKey(response, 'id')
          : auditRecordKey(request, 'keyId'),
      }),
    };
  }
  const operation = operations.get(path);
  if (!operation) return false;
  const [name, authenticationAttempt] = operation;
  return {
    action: `auth:${name}`,
    operationName: operationName(name),
    resource: 'user',
    captureBody: false,
    resultFrom: 'context',
    authenticationAttempt,
    target: () => ({ collection: 'user' }),
    resolveTargets: (_result, context) => ({
      collection: 'user',
      key: (context as Context<AuthEnv>).get('authHttpIdentity')?.userId,
    }),
  };
}
