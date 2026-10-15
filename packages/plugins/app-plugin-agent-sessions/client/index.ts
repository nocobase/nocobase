// The plugin's public client surface: the registration factory an application lists in its client/plugins.ts, and
// the page's route definition for an application that routes it itself.
export { default, type AgentSessionsClientOptions } from './plugin.js';
export {
  agentSessionsRoute,
  type AgentSessionsRouteOptions,
} from './routes.js';
export type { LinkPanelProps } from './config.js';

export { AgentSessionsProvider } from './application-provider.js';
