import { normalizeBasePath } from '@nocobase/app-server/support';
import type {
  ApiDocsAccess,
  ApiDocumentFragment,
  OpenAPIV3_1,
} from '@nocobase/app-server/router';
import { APIError } from 'better-auth';

import type { Auth, AuthOpenAPIOperation } from './auth.js';

/** The tag every Better Auth operation carries in the application's API document. */
export const AUTHENTICATION_API_TAG = 'Authentication';

/** The prefix an `operationId` or component name takes when it collides with one already in the document. */
export const AUTHENTICATION_API_NAMESPACE = 'auth';

/**
 * Better Auth endpoints left out of the API document, as paths relative to Better Auth's base path. Each is a step of
 * a browser flow a script cannot meaningfully call on its own: the OAuth redirects and the provider callback, the
 * links sent by email that redirect the browser on, and the HTML error page those flows land on.
 */
export const BROWSER_ONLY_AUTH_PATHS: readonly string[] = [
  '/sign-in/social',
  '/link-social',
  '/callback/{id}',
  '/verify-email',
  '/reset-password/{token}',
  '/delete-user/callback',
  '/error',
];

/**
 * Better Auth endpoints a caller reaches without being signed in, as paths relative to Better Auth's base path. Their
 * operations declare `security: []`, so the document does not claim they need the credential every other operation
 * does. A path the configured Better Auth plugins do not serve is simply absent from the document.
 */
export const PUBLIC_AUTH_PATHS: readonly string[] = [
  '/ok',
  '/get-session',
  '/sign-up/email',
  '/sign-in/email',
  '/sign-in/username',
  '/is-username-available',
  '/request-password-reset',
  '/forget-password',
  '/reset-password',
  '/send-verification-email',
  '/sign-in/anonymous',
  '/sign-in/magic-link',
  '/sign-in/email-otp',
  '/email-otp/send-verification-otp',
  '/email-otp/verify-email',
  '/email-otp/reset-password',
  '/forget-password/email-otp',
  // The device authorization a CLI starts and polls (RFC 8628): the device code is its credential.
  '/device/code',
  '/device/token',
];

/** The security scheme a signed-in session's cookie satisfies, in `components.securitySchemes`. */
export const SESSION_SECURITY_SCHEME = 'cookieAuth';

/**
 * The security scheme a session token sent as `Authorization: Bearer` satisfies, in `components.securitySchemes`.
 * Documented only while the application enables Better Auth's `bearer()` plugin, which is what accepts it.
 */
export const BEARER_SECURITY_SCHEME = 'bearerAuth';

const PACKAGE_NAME = '@nocobase/app-plugin-authentication';

/**
 * Lets a request with a signed-in session read the API documentation. The session is resolved exactly as the
 * plugin's routes resolve it, but without extending its expiry, and the cookies Better Auth would set are discarded, so
 * reading the documentation changes no state. A credential Better Auth refuses is simply not allowed here.
 */
export function createSessionApiDocsAccess(
  resolveAuth: () => Auth,
): ApiDocsAccess {
  return {
    name: PACKAGE_NAME,
    check: async (context) => {
      try {
        const session = await resolveAuth().getSession(
          context.req.raw.headers,
          { disableRefresh: true },
        );
        return session !== null;
      } catch (error) {
        if (error instanceof APIError) return false;
        throw error;
      }
    },
  };
}

/**
 * The session cookie as the document's security scheme, `cookieAuth`, and a top-level requirement naming it. The
 * cookie's name is the one Better Auth sets under this configuration, prefix and `__Secure-` included. A browser on
 * the application's origin sends it with every request, Swagger UI's included, so there is nothing to enter under
 * "Authorize" for it. When the application enables Better Auth's `bearer()` plugin, the same session's token sent as
 * `Authorization: Bearer`, which a CLI signed in through the device authorization holds, is `bearerAuth`, an
 * alternative to the cookie.
 */
export async function createSessionSecurityFragment(
  auth: Pick<Auth, 'sessionCookieName' | 'plugin'>,
): Promise<ApiDocumentFragment> {
  const bearer = auth.plugin('bearer') !== undefined;
  return {
    owner: PACKAGE_NAME,
    namespace: AUTHENTICATION_API_NAMESPACE,
    components: {
      securitySchemes: {
        [SESSION_SECURITY_SCHEME]: {
          type: 'apiKey',
          in: 'cookie',
          name: await auth.sessionCookieName(),
          description:
            'The session cookie Better Auth sets on sign-in. A browser sends it by itself; a script signs in through `/api/auth/sign-in/*` and sends the cookie back.',
        },
        ...(bearer
          ? {
              [BEARER_SECURITY_SCHEME]: {
                type: 'http',
                scheme: 'bearer',
                description:
                  'A session token, as a CLI receives it from the device authorization (`/api/auth/device/token`). It is the same session the cookie carries and is renewed the same way.',
              },
            }
          : {}),
      },
    },
    security: [
      { [SESSION_SECURITY_SCHEME]: [] },
      ...(bearer ? [{ [BEARER_SECURITY_SCHEME]: [] }] : []),
    ],
  };
}

/**
 * Better Auth's endpoints as an API document fragment, built from Better Auth's own OpenAPI generator: every endpoint
 * the configured Better Auth plugins serve, at its full `/api/auth/...` path below the application's base path, tagged
 * `Authentication`. The endpoints in `BROWSER_ONLY_AUTH_PATHS` are left out, and those in `PUBLIC_AUTH_PATHS` declare
 * `security: []`.
 */
export async function createAuthenticationApiFragment(
  auth: Auth,
  publicBasePath: string,
): Promise<ApiDocumentFragment> {
  const schema = await auth.openAPISchema();
  const prefix = appLocalPath(schema.basePath, publicBasePath);
  const paths: OpenAPIV3_1.PathsObject = {};
  for (const [path, item] of Object.entries(schema.paths)) {
    if (BROWSER_ONLY_AUTH_PATHS.includes(path)) continue;
    const operations: OpenAPIV3_1.PathItemObject = {};
    for (const [method, operation] of Object.entries(item)) {
      (operations as Record<string, OpenAPIV3_1.OperationObject>)[method] =
        toOperation(operation, PUBLIC_AUTH_PATHS.includes(path));
    }
    paths[`${prefix}${path}`] = operations;
  }
  return {
    owner: PACKAGE_NAME,
    namespace: AUTHENTICATION_API_NAMESPACE,
    paths,
    components: {
      schemas: schema.components
        .schemas as OpenAPIV3_1.ComponentsObject['schemas'],
    },
    tags: [
      {
        name: AUTHENTICATION_API_TAG,
        description:
          "Sign-in, sessions, accounts and API keys, served by Better Auth under /api/auth. Better Auth answers errors in its own body, `{ message, code }`, rather than the application's standard error body.",
      },
    ],
  };
}

/** Better Auth's public base path, such as `/main/api/auth`, as the path below the application's, `/api/auth`. */
function appLocalPath(basePath: string, publicBasePath: string): string {
  const base = normalizeBasePath(publicBasePath);
  const path = normalizeBasePath(basePath);
  return base && path.startsWith(`${base}/`) ? path.slice(base.length) : path;
}

function toOperation(
  operation: AuthOpenAPIOperation,
  isPublic: boolean,
): OpenAPIV3_1.OperationObject {
  // Better Auth marks every operation as bearer-authenticated whatever is configured; the document's own requirement
  // says what authenticates these requests (the session cookie, a bearer session token where `bearer()` is enabled, or
  // an API key). A public endpoint opts out of that requirement with `security: []`.
  const { security: _security, description, tags: _tags, ...rest } = operation;
  const summary =
    description ??
    (operation.operationId ? sentence(operation.operationId) : undefined);
  return {
    ...(rest as OpenAPIV3_1.OperationObject),
    tags: [AUTHENTICATION_API_TAG],
    ...(summary ? { summary } : {}),
    ...(isPublic ? { security: [] } : {}),
  };
}

/** `isUsernameAvailable` as `Is username available`. */
function sentence(identifier: string): string {
  const words = identifier.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
