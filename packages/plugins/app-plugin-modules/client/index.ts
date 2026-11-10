export { ModuleLayout } from './layout.js';
export { ModuleLayoutHost } from './layout-context.js';
export type {
  ModuleLayoutProps,
  ModuleNavigationItem,
  ModuleLayoutRenderer,
} from './layout-context.js';
export { ModulePage } from './page.js';
export type { ModuleDescriptor } from '../shared/types.js';

import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';
const plugin: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-modules',
});
export default plugin;
