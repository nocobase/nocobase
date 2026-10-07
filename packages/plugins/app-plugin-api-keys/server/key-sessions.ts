/**
 * Telling a session made from an API key apart from a sign-in. Managing API keys takes a sign-in: no key, scoped or
 * not, creates, rotates or revokes keys, so a leaked key cannot mint its own successors or remove the evidence. For the
 * same reason no key approves another device's sign-in (Better Auth's device authorization), which issues a session.
 */
import type { AuthEnv } from '@nocobase/app-plugin-authentication/server';
import { ApiError, apiErrorHandler } from '@nocobase/app-server/router';
import type { MiddlewareHandler } from 'hono';

/** The header a key arrives in; Better Auth's default `apiKeyHeaders`. */
export const API_KEY_HEADER = 'x-api-key';

/** The Better Auth endpoints no API key may reach, whatever its scope: every `/api-key/*` endpoint. */
export const KEY_MANAGEMENT_PATH_PREFIXES: readonly string[] = ['/api-key/'];

/** Whether a Better Auth endpoint path manages API keys. */
export function isKeyManagementPath(path: string): boolean {
  return KEY_MANAGEMENT_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/**
 * Whether a session was made from an API key: Better Auth's key session carries the key as its token, which a
 * sign-in session never matches.
 */
export function isApiKeySession(
  session: { readonly session: { readonly token: string } },
  headers: Headers,
  headerNames: readonly string[] = [API_KEY_HEADER],
): boolean {
  return headerNames.some((name) => {
    const key = headers.get(name);
    return Boolean(key) && session.session.token === key;
  });
}

/**
 * The Better Auth endpoints that review, approve or deny a device authorization (`deviceAuthorization()`): approving
 * issues the device a session, so no API key reaches them.
 */
export const DEVICE_APPROVAL_PATHS: readonly string[] = [
  '/device',
  '/device/approve',
  '/device/deny',
];

/** Whether a Better Auth endpoint path reviews, approves or denies a device authorization. */
export function isDeviceApprovalPath(path: string): boolean {
  return DEVICE_APPROVAL_PATHS.includes(path);
}

/**
 * Refuses a request whose session came from an API key with 403 `API_KEY_SESSION_FORBIDDEN`. Install after
 * `auth.required()` on every route that manages keys, a service account's included.
 */
export function requireSignInSession(): MiddlewareHandler<AuthEnv> {
  return async (context, next) => {
    const auth = context.get('auth');
    if (auth && isApiKeySession(auth, context.req.raw.headers))
      return apiErrorHandler(
        new ApiError({
          status: 'PERMISSION_DENIED',
          reason: 'API_KEY_SESSION_FORBIDDEN',
          domain: 'apiKeys',
          message: 'API keys are managed only from a signed-in session.',
        }),
        context,
      );
    await next();
  };
}
