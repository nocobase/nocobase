// The plugin's public client surface. The default export is the registration factory an application lists in
// its client/plugins.ts.
export { default } from './plugin.js';
export { DATABASE_EXPLORER_ACCESS } from './access.js';
export {
  DatabaseExplorerClient,
  type CollectionDetail,
  type CollectionListResult,
  type ConnectionListResult,
  type ConnectionSummary,
} from './database-explorer-client.js';
