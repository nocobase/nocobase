import {
  apiKey as betterAuthApiKey,
  type ApiKeyConfigurationOptions,
} from '@better-auth/api-key';
import { isServiceAccount } from '@nocobase/app-plugin-authentication/server';
import {
  APIError,
  createAuthEndpoint,
  createAuthMiddleware,
  getSessionFromCtx,
} from 'better-auth/api';
import type { ApiKey } from '@better-auth/api-key';

import { isDeviceApprovalPath, isKeyManagementPath } from './key-sessions.js';
type ServerEndpoint<
  Options extends Parameters<typeof createAuthEndpoint.serverOnly>[0],
  Result,
> = ReturnType<typeof createAuthEndpoint.serverOnly<string, Options, Result>>;

type UpstreamPlugin = ReturnType<typeof betterAuthApiKey>;
type ManagedQuery = ReturnType<
  UpstreamPlugin['endpoints']['getApiKey']['options']['query']['partial']
>;
type ManagedBody =
  UpstreamPlugin['endpoints']['deleteApiKey']['options']['body'];
/** The configurations the plugin was created with, after this package's defaults are applied. */
export interface ApiKeysPluginOptions {
  readonly configurations: readonly ApiKeyConfigurationOptions[];
}

export type ApiKeysPlugin = Omit<UpstreamPlugin, 'endpoints'> & {
  /** Read by this package's server, for instance to find the key a request carries; Better Auth ignores it. */
  options: ApiKeysPluginOptions;
  endpoints: UpstreamPlugin['endpoints'] & {
    getServerApiKey: ServerEndpoint<
      { method: 'GET'; query: ManagedQuery },
      Omit<ApiKey, 'key'> | null
    >;
    deleteServerApiKey: ServerEndpoint<
      { method: 'POST'; body: ManagedBody },
      { success: boolean }
    >;
  };
};

/**
 * Where the plugin's provider puts the application's own-key policy (`ScopedApiKeys.setOwnKeyPolicy`), so the hook on
 * Better Auth's own `/api-key/create` asks the same question `/api/apiKeys` does.
 */
export const OWN_KEY_POLICY_SLOT: unique symbol = Symbol.for(
  '@nocobase/app-plugin-api-keys/own-key-policy',
);

export interface OwnKeyPolicySlot {
  current: ((userId: string) => Promise<boolean>) | null;
}

/** The slot of a plugin `apiKey()` made, or undefined for any other plugin. */
export function ownKeyPolicySlotOf(
  plugin: unknown,
): OwnKeyPolicySlot | undefined {
  if (typeof plugin !== 'object' || plugin === null) return undefined;
  return Reflect.get(plugin, OWN_KEY_POLICY_SLOT) as
    OwnKeyPolicySlot | undefined;
}

/**
 * Better Auth's API Key plugin with the defaults a NocoBase application wants.
 *
 * `enableSessionForAPIKeys` is the one that has to be set: Better Auth
 * defaults it off, and with it off a key authenticates nothing — the Settings
 * page still issues keys, and every request carrying one answers 401.
 *
 * Every option is overridable, `enableSessionForAPIKeys` included, so passing
 * all three back reproduces Better Auth's own behaviour exactly.
 */
function createApiKeysPlugin(
  options: ApiKeyConfigurationOptions | ApiKeyConfigurationOptions[] = {},
): ApiKeysPlugin {
  const configurations = (Array.isArray(options) ? options : [options]).map(
    (configuration) => ({
      enableSessionForAPIKeys: true,
      rateLimit: { enabled: false },
      requireName: true,
      ...configuration,
    }),
  );
  const plugin = betterAuthApiKey(
    Array.isArray(options) ? configurations : configurations[0],
  );
  const managedQuery: ManagedQuery =
    plugin.endpoints.getApiKey.options.query.partial();
  const managedBody: ManagedBody = plugin.endpoints.deleteApiKey.options.body;
  function requireDatabaseConfiguration(configId: string | undefined): string {
    const id = configId ?? 'default';
    const config = configurations.find(
      (item) => (item.configId ?? 'default') === id,
    );
    if (!config)
      throw new Error(`API key configuration "${id}" is not registered.`);
    if (
      config.customStorage ||
      (config.storage && config.storage !== 'database')
    )
      throw new Error(
        'Server API key management requires the default database schema and storage.',
      );
    return id;
  }
  const headers = [
    ...new Set(
      configurations.flatMap((configuration) =>
        configuration.apiKeyHeaders === undefined
          ? ['x-api-key']
          : Array.isArray(configuration.apiKeyHeaders)
            ? configuration.apiKeyHeaders
            : [configuration.apiKeyHeaders],
      ),
    ),
  ];
  const policy: OwnKeyPolicySlot = { current: null };
  const presentedKey = (requestHeaders: Headers | undefined) => {
    for (const header of headers) {
      const value = requestHeaders?.get(header);
      if (value) return value;
    }
    return null;
  };
  const result = {
    ...plugin,
    options: { configurations },
    hooks: {
      ...plugin.hooks,
      before: [
        ...plugin.hooks.before,
        {
          // Runs after Better Auth has turned the key into a session. No key manages keys: every `/api-key/*`
          // endpoint takes a sign-in, and so does approving a device's sign-in (`/device/*`), which issues a session. A scoped key, and any key of a service account, reaches no account endpoint at
          // all: it cannot change the profile, list sessions or sign out either. Only `/get-session` answers, before
          // this hook runs.
          matcher: (ctx: { headers?: Headers }) =>
            presentedKey(ctx.headers) !== null,
          handler: createAuthMiddleware(async (ctx) => {
            const key = presentedKey(ctx.headers);
            const session = ctx.context.session;
            if (!key || !session || session.session.token !== key) return;
            if (isKeyManagementPath(ctx.path))
              throw APIError.from('FORBIDDEN', {
                code: 'API_KEY_SESSION_FORBIDDEN',
                message: 'API keys are managed only from a signed-in session.',
              });
            if (isDeviceApprovalPath(ctx.path))
              throw APIError.from('FORBIDDEN', {
                code: 'API_KEY_SESSION_FORBIDDEN',
                message:
                  'A device sign-in is approved only from a signed-in session.',
              });
            let scoped = isServiceAccount(session.user);
            if (!scoped) {
              const row = await ctx.context.adapter.findOne<{
                permissions: unknown;
              }>({
                model: 'apikey',
                where: [{ field: 'id', value: session.session.id }],
              });
              scoped = row?.permissions != null;
            }
            if (scoped)
              throw APIError.from('FORBIDDEN', {
                code: 'SCOPED_KEY_FORBIDDEN',
                message:
                  'A scoped API key or a service-account key cannot use account endpoints.',
              });
          }),
        },
        {
          // A person creating a key of their own from a sign-in: the application may say who may
          // (`ScopedApiKeys.setOwnKeyPolicy`). A server call carries no session and is the caller's to authorize.
          matcher: (ctx: { path?: string }) => ctx.path === '/api-key/create',
          handler: createAuthMiddleware(async (ctx) => {
            const check = policy.current;
            if (!check || presentedKey(ctx.headers) !== null) return;
            const session = await getSessionFromCtx(ctx);
            if (session && !(await check(session.user.id)))
              throw APIError.from('FORBIDDEN', {
                code: 'API_KEY_CREATION_FORBIDDEN',
                message: 'You may not create API keys of your own.',
              });
          }),
        },
        // The added hooks answer nothing, so they fit the upstream list, whose type names only what Better Auth's hook
        // returns.
      ] as unknown as UpstreamPlugin['hooks']['before'],
    },
    endpoints: {
      ...plugin.endpoints,
      getServerApiKey: createAuthEndpoint.serverOnly(
        { method: 'GET', query: managedQuery },
        async (ctx) => {
          const configId = requireDatabaseConfiguration(ctx.query.configId);
          if (!ctx.query.id) return null;
          const row = await ctx.context.adapter.findOne<ApiKey>({
            model: 'apikey',
            where: [
              { field: 'id', value: ctx.query.id },
              { field: 'configId', value: configId },
            ],
          });
          if (!row) return null;
          const { key: _hash, ...key } = row;
          return {
            ...key,
            permissions:
              typeof key.permissions === 'string'
                ? (JSON.parse(key.permissions) as ApiKey['permissions'])
                : (key.permissions ?? null),
          };
        },
      ),
      deleteServerApiKey: createAuthEndpoint.serverOnly(
        { method: 'POST', body: managedBody },
        async (ctx) => {
          const configId = requireDatabaseConfiguration(ctx.body.configId);
          await ctx.context.adapter.deleteMany({
            model: 'apikey',
            where: [
              { field: 'id', value: ctx.body.keyId },
              { field: 'configId', value: configId },
            ],
          });
          return { success: true };
        },
      ),
    },
  };
  Object.defineProperty(result, OWN_KEY_POLICY_SLOT, { value: policy });
  return result;
}

/**
 * The API key a request carries, read the way the plugin reads it to authenticate a request: from the header each
 * configuration that turns keys into sessions names, `x-api-key` unless configured. A configuration with a
 * `customAPIKeyGetter` is skipped, because that getter needs a Better Auth endpoint context this caller does not have.
 */
export function findRequestApiKey(
  plugin: Pick<ApiKeysPlugin, 'options'>,
  headers: Headers,
): string | undefined {
  for (const name of requestApiKeyHeaders(plugin)) {
    const value = headers.get(name);
    if (value) return value;
  }
  return undefined;
}

/**
 * The headers a request may carry its API key in, in the order `findRequestApiKey` reads them: those of each
 * configuration that turns keys into sessions, `x-api-key` unless configured, without one that has a
 * `customAPIKeyGetter`.
 */
export function requestApiKeyHeaders(
  plugin: Pick<ApiKeysPlugin, 'options'>,
): string[] {
  const headers: string[] = [];
  for (const configuration of plugin.options.configurations) {
    if (!configuration.enableSessionForAPIKeys) continue;
    if (configuration.customAPIKeyGetter) continue;
    const names = configuration.apiKeyHeaders ?? 'x-api-key';
    for (const name of Array.isArray(names) ? names : [names])
      if (!headers.includes(name)) headers.push(name);
  }
  return headers;
}

export function apiKey(
  options: ApiKeyConfigurationOptions | ApiKeyConfigurationOptions[] = {},
): ApiKeysPlugin {
  return createApiKeysPlugin(options);
}
