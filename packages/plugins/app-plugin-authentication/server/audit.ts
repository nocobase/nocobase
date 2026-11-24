import type { AuditRouteOptions } from '@nocobase/app-server/audit';

const actions: ReadonlyMap<string, string> = new Map([
  ['/sign-in/email', 'auth:signIn'],
  ['/sign-in/username', 'auth:signIn'],
  ['/sign-up/email', 'auth:signUp'],
  ['/sign-out', 'auth:signOut'],
  ['/change-password', 'auth:changePassword'],
  ['/update-user', 'auth:updateProfile'],
]);

export function authAuditOptions(path: string): AuditRouteOptions | false {
  const action = actions.get(path);
  if (path === '/api-key/create' || path === '/api-key/delete') {
    return {
      action:
        path === '/api-key/create' ? 'auth:createApiKey' : 'auth:revokeApiKey',
      resource: 'apikey',
      captureBody: false,
      target: () => ({ collection: 'apikey' }),
    };
  }
  return action
    ? {
        action,
        resource: 'user',
        captureBody: false,
        authenticationAttempt: action === 'auth:signIn',
        target: () => ({ collection: 'user' }),
      }
    : false;
}
