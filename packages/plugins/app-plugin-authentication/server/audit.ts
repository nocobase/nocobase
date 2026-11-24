import {
  auditEnabled,
  recordAuditInTransaction,
  setAuditActor,
  setAuditTarget,
  type AuditRouteOptions,
} from '@nocobase/app-server/audit';
import { authTransactionConnection } from './better-auth/database-adapter.js';

export const passwordResetAuditAction = 'auth:resetPassword';

/** Record the reset inside Better Auth's password transaction, before its post-reset callback. */
export async function recordPasswordResetAudit(userId: string): Promise<void> {
  if (!auditEnabled(passwordResetAuditAction)) return;
  setAuditActor({ type: 'user', userId });
  setAuditTarget({ collection: 'user', key: userId });
  const connection = await authTransactionConnection();
  if (connection) await recordAuditInTransaction(connection);
}

const actions: ReadonlyMap<string, string> = new Map([
  ['/sign-in/email', 'auth:signIn'],
  ['/sign-in/username', 'auth:signIn'],
  ['/sign-up/email', 'auth:signUp'],
  ['/sign-out', 'auth:signOut'],
  ['/change-password', 'auth:changePassword'],
  ['/reset-password', passwordResetAuditAction],
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
        authenticationAttempt:
          action === 'auth:signIn' || action === passwordResetAuditAction,
        target: () => ({ collection: 'user' }),
      }
    : false;
}
