import {
  defineClientPlugin,
  defineAppRoutes,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';
import { Settings } from 'lucide-react';
import { access } from '../shared/access.js';
interface InspectorOptions {
  settingsOwner?: string;
}
const plugin: AppClientPluginFactory<InspectorOptions> =
  defineClientPlugin<InspectorOptions>({
    packageName: '@nocobase/app-plugin-config-inspector',
    locales: {
      'en-US': () => import('./en-US.js'),
      'zh-CN': () => import('./zh-CN.js'),
    },
    routes: ({ settingsOwner }) =>
      defineAppRoutes([
        {
          ...(settingsOwner
            ? { parent: settingsOwner + ':settingsSystem' }
            : {}),
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
