import {
  auditRecordKey,
  type AuditRouteOptions,
} from '@nocobase/app-server/audit';
import type { Context } from 'hono';
import type { AuthEnv } from './auth.js';

const operations: ReadonlyMap<string, readonly [string, string, boolean?]> =
  new Map([
    ['/sign-in/email', ['auth:signIn', 'Sign in', true]],
    ['/sign-in/username', ['auth:signIn', 'Sign in', true]],
    ['/sign-up/email', ['auth:signUp', 'Sign up', true]],
    ['/sign-out', ['auth:signOut', 'Sign out']],
    ['/change-password', ['auth:changePassword', 'Change password']],
    ['/reset-password', ['auth:resetPassword', 'Reset password', true]],
    ['/update-user', ['auth:updateProfile', 'Update profile']],
  ]);

export function authAuditOptions(path: string): AuditRouteOptions | false {
  if (path === '/api-key/create' || path === '/api-key/delete') {
    const create = path === '/api-key/create';
    return {
      action: create ? 'auth:createApiKey' : 'auth:revokeApiKey',
      operationName: create ? 'Create an API key' : 'Revoke an API key',
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
  const [action, operationName, authenticationAttempt] = operation;
  return {
    action,
    operationName,
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
