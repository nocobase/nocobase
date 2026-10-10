import type { ApiKey } from '@better-auth/api-key';
import type { apiKeyClient } from '@better-auth/api-key/client';
// Loads the module the declaration below augments: TypeScript only augments a module that is part of the program.
import type {} from '@nocobase/app-plugin-authentication/client';

/**
 * Better Auth's API Key client plugin, which an application adds to `plugins`
 * in `client/config/auth.ts` so `authClient.apiKey.*` reaches the endpoints
 * the server plugin mounts.
 */
export { apiKeyClient } from '@better-auth/api-key/client';

// Tells the authentication client's type that this plugin is registered.
declare module '@nocobase/app-plugin-authentication/client' {
  interface AuthClientPluginRegistry {
    'api-key': ReturnType<typeof apiKeyClient>;
  }
}

/**
 * A key as the list endpoint returns it: Better Auth's own model, minus the
 * hash the endpoint strips before responding.
 */
export type ApiKeySummary = Omit<ApiKey, 'key'>;
