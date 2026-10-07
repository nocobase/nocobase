// The plugin's public client surface. The default export is the registration factory an application lists in its
// client/plugins.ts; `client/api` holds the headless hooks and `client/pages` the page and its parts.
export { default } from './plugin.js';
export type { KnowledgeClientOptions } from './plugin.js';
export {
  createKnowledgeRoutes,
  knowledgeDefinition,
  type KnowledgeRouteOptions,
} from './routes.js';
