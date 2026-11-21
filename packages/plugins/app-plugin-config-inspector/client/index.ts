import {
  defineClientPlugin,
  defineSystemSettingsRoutes,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';
import { Settings } from 'lucide-react';
import { access } from '../shared/access.js';
const plugin: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-config-inspector',
  locales: {
    'en-US': () => import('./en-US.js'),
    'zh-CN': () => import('./zh-CN.js'),
  },
  routes: defineSystemSettingsRoutes([
    {
      parent: 'settingsSystem',
      name: 'configInspector',
      path: '/config-inspector',
      auth: 'required',
      authz: access,
      navigation: { title: 'configInspector.title', icon: Settings },
      componentLoader: () => import('./page.js'),
    },
  ]),
});
export default plugin;
