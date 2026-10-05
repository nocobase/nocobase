import type { Auth } from '@nocobase/app-plugin-authentication/server';
import type {
  ApiDocsAccess,
  ApiDocumentFragment,
} from '@nocobase/app-server/router';
import { APIError } from 'better-auth/api';

import {
  findRequestApiKey,
  requestApiKeyHeaders,
  type ApiKeysPlugin,
} from './api-keys.js';

const PACKAGE_NAME = '@nocobase/app-plugin-api-keys';

/** The security scheme an API key satisfies, in `components.securitySchemes`. */
export const API_KEY_SECURITY_SCHEME = 'apiKeyAuth';

/**
 * Lets a request carrying a valid API key read the API documentation. The key is checked exactly as for any other
 * request — Better Auth resolves it to its owner's session, which refuses a disabled, expired or unknown key and a key
 * whose owner is disabled — but without extending a session, so reading the documentation changes no state.
 *
 * Allows nothing when the application has not configured this package's `apiKey()` Better Auth plugin, or when the
 * request carries no key in the headers that plugin reads.
 */
export function createApiKeyApiDocsAccess(
  resolveAuth: () => Pick<Auth, 'getSession' | 'plugin'>,
): ApiDocsAccess {
  return {
    name: PACKAGE_NAME,
    check: async (context) => {
      const auth = resolveAuth();
      const plugin = auth.plugin<ApiKeysPlugin>('api-key');
      if (!plugin?.options?.configurations) return false;
      const headers = context.req.raw.headers;
      const key = findRequestApiKey(plugin, headers);
      if (!key) return false;
      try {
        const session = await auth.getSession(headers, {
          disableRefresh: true,
        });
        // Better Auth answers a request carrying a key with the key's session, whose token is the key itself.
        return session?.session.token === key;
      } catch (error) {
        if (error instanceof APIError) return false;
        throw error;
      }
    },
  };
}

/**
 * The API key header as the document's security scheme, `apiKeyAuth`, and a top-level requirement naming it, offered
 * beside the session cookie's: a request carrying either is authenticated. The header is the first one this package's
 * `apiKey()` Better Auth plugin reads a key from, `x-api-key` unless configured. Swagger UI's "Authorize" takes the key
 * and sends it in that header.
 *
 * Contributes nothing when the application has not configured the `apiKey()` plugin, or when no configuration turns
 * keys into sessions through a header, because then no request authenticates with a key.
 */
export function createApiKeySecurityFragment(
  resolveAuth: () => Pick<Auth, 'plugin'>,
): ApiDocumentFragment {
  const plugin = resolveAuth().plugin<ApiKeysPlugin>('api-key');
  const [header, ...alternatives] = plugin?.options?.configurations
    ? requestApiKeyHeaders(plugin)
    : [];
  if (!header) return { owner: PACKAGE_NAME };
  return {
    owner: PACKAGE_NAME,
    namespace: 'apiKeys',
    components: {
      securitySchemes: {
        [API_KEY_SECURITY_SCHEME]: {
          type: 'apiKey',
          in: 'header',
          name: header,
          description: `An API key issued on the API keys settings page or through \`/api/auth/api-key/create\`. It acts as the user who owns it.${alternatives.length > 0 ? ` The ${alternatives.map((name) => `\`${name}\``).join(', ')} header${alternatives.length > 1 ? 's carry' : ' carries'} it as well.` : ''}`,
        },
      },
    },
    security: [{ [API_KEY_SECURITY_SCHEME]: [] }],
  };
}
