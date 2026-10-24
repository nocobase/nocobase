import {
  defineClientPlugin,
  type AppClientPluginFactory,
  type AppClientReactProviderDefinition,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import {
  createAgentSessionsRoutes,
  type AgentSessionsRouteOptions,
} from './routes.js';

/** The page's options, or `routes: false` for an application that routes `agentSessionsRoute` itself. */
export type AgentSessionsClientOptions = (
  | { readonly routes: false }
  | (AgentSessionsRouteOptions & { readonly routes?: true })
) & {
  /** An owner-aware application cache mounted in the plugin provider layer. */
  readonly cacheProvider?: AppClientReactProviderDefinition;
};

const agentSessions: AppClientPluginFactory<AgentSessionsClientOptions> =
  defineClientPlugin<AgentSessionsClientOptions>({
    packageName: '@nocobase/app-plugin-agent-sessions',
    locales,
    reactProviders: (options) =>
      options.cacheProvider ? [options.cacheProvider] : [],
    routes: (options) =>
      options.routes === false ? [] : createAgentSessionsRoutes(options),
  });

export default agentSessions;
