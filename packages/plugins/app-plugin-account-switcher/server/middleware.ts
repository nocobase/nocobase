import type { Auth } from '@nocobase/app-plugin-authentication';
import { apiErrorHandler } from '@nocobase/app-server/router';
import type { MiddlewareHandler } from 'hono';

import { accountSwitchForbiddenAction } from './errors.js';
import type { AccountSwitcherService } from './tokens.js';

// The application's router sees every path below its public base path.
const API_ROOT = '/api';
const SIGN_OUT = '/auth/sign-out';

export interface AccountSwitcherGuardOptions {
  readonly auth: () => Auth;
  readonly service: () => AccountSwitcherService;
}

/** Issued keys outlive a switch and would keep acting as its target, and Better Auth writes act on the signed-in person. */
function guarded(path: string, method: string): boolean {
  if (path === '/apiKeys' || path.startsWith('/apiKeys/')) return true;
  return (
    path.startsWith('/auth/') && !['GET', 'HEAD', 'OPTIONS'].includes(method)
  );
}

/**
 * Keeps a switch away from what it must not reach, whichever route answers. Runs ahead of every route, and costs a
 * session lookup only on the paths it guards.
 */
export function createAccountSwitcherGuard(
  options: AccountSwitcherGuardOptions,
): MiddlewareHandler {
  return async (context, next) => {
    const { path, method } = context.req;
    if (!path.startsWith(`${API_ROOT}/`)) return next();
    const apiPath = path.slice(API_ROOT.length);
    if (!guarded(apiPath, method)) return next();

    const session = await options.auth().getSession(context.req.raw.headers, {
      disableRefresh: true,
    });
    const service = options.service();
    if (!session || !service.isSwitched(session)) return next();
    if (apiPath === SIGN_OUT) {
      await service.stop(session);
      return next();
    }
    return apiErrorHandler(accountSwitchForbiddenAction(), context);
  };
}
