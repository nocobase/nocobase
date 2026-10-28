// The plugin's public client surface. The default export is the registration factory an application lists in
// its client/plugins.ts.
export { default } from './plugin.js';
export { demoModeRoutes } from './demo-mode-routes.js';
export { DemoModeMenu } from './menu.js';
export { DemoEntryLoadingContext, useDemoMode } from './demo-mode-context.js';
