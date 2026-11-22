// The plugin's public client surface. The default export is the registration factory an application lists in its
// client/plugins.ts.
export { default } from './plugin.js';
export { PLUGINS_PATH, pluginsRoute } from './routes.js';
export { usePlugins, type FoundationPlugins } from './api.js';
export { PLUGINS_ACCESS } from '../shared/access.js';
export type * from '../shared/plugins.js';
