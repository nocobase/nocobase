import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import reactProviders from './react-providers/index.js';

const demoMode: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-demo-mode',
  locales,
  reactProviders,
});

export default demoMode;
