/** Capabilities a generated plugin may provide to an App or another plugin. */
export const PLUGIN_CAPABILITIES = [
  'database',
  'server.service-providers',
  'server.routes',
  'server.jobs',
  'server.locales',
  'client.routes',
  'client.components',
  'client.service-providers',
  'client.react-providers',
  'client.locales',
  'cli',
  'skills',
] as const;

export type PluginCapability = (typeof PLUGIN_CAPABILITIES)[number];

/**
 * Selects every capability at once.
 *
 * Not a capability itself: it never reaches `PluginCapabilities`, and asking whether a plugin "has all" is not a
 * question the generated plugin answers. It exists because naming every capability to get a plugin that does
 * everything is a list nobody wants to type or keep current as capabilities are added.
 */
export const ALL_PLUGIN_CAPABILITIES = 'all';

export interface PluginCapabilities {
  readonly database: boolean;
  readonly server: {
    readonly serviceProviders: boolean;
    readonly routes: boolean;
    readonly jobs: boolean;
    readonly locales: boolean;
  };
  readonly client: {
    readonly routes: boolean;
    readonly components: boolean;
    readonly serviceProviders: boolean;
    readonly reactProviders: boolean;
    readonly locales: boolean;
  };
  readonly cli: boolean;
  readonly skills: boolean;
}

export function normalizePluginCapabilities(
  requested: readonly PluginCapability[],
): PluginCapabilities {
  const selected = new Set(requested);
  return {
    database: selected.has('database'),
    server: {
      serviceProviders: selected.has('server.service-providers'),
      routes: selected.has('server.routes'),
      jobs: selected.has('server.jobs'),
      locales: selected.has('server.locales'),
    },
    client: {
      routes: selected.has('client.routes'),
      components: selected.has('client.components'),
      serviceProviders: selected.has('client.service-providers'),
      reactProviders: selected.has('client.react-providers'),
      locales: selected.has('client.locales'),
    },
    cli: selected.has('cli'),
    skills: selected.has('skills'),
  };
}

export function isPluginCapability(value: string): value is PluginCapability {
  return (PLUGIN_CAPABILITIES as readonly string[]).includes(value);
}
