import {
  apiKey as betterAuthApiKey,
  type ApiKeyConfigurationOptions,
} from '@better-auth/api-key';
import { createAuthEndpoint } from 'better-auth/api';
import type { ApiKey } from '@better-auth/api-key';
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
  return {
    ...plugin,
    options: { configurations },
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
