import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import {
  createAgentSessionsRoutes,
  type AgentSessionsRouteOptions,
} from './routes.js';

/** The page's options, or `routes: false` for an application that routes `agentSessionsRoute` itself. */
export type AgentSessionsClientOptions =
  | { readonly routes: false }
  | (AgentSessionsRouteOptions & { readonly routes?: true });

const agentSessions: AppClientPluginFactory<AgentSessionsClientOptions> =
  defineClientPlugin<AgentSessionsClientOptions>({
    packageName: '@nocobase/app-plugin-agent-sessions',
    locales,
    routes: (options) =>
      options.routes === false ? [] : createAgentSessionsRoutes(options),
  });

export default agentSessions;
