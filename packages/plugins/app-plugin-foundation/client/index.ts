// The plugin's public client surface. The default export is the registration factory an application lists in
// its client/plugins.ts.
export { default, type FoundationClientOptions } from './plugin.js';
export {
  groupFoundationNavigation,
  type FoundationNavigationNode,
} from './navigation.js';
export {
  createFoundationRoutes,
  foundationDefinition,
  type FoundationRouteOptions,
} from './routes.js';
export {
  fetchFoundationOverview,
  useFoundationOverview,
  type FoundationLoadError,
  type FoundationOverviewState,
} from './api.js';
export type * from '../shared/foundation.js';
