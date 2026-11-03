import type { PublicAppConfig } from '@nocobase/app-client';
import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import type { AccountSwitcherMode } from '../shared/types.js';
import locales from './locales/index.js';
import reactProviders from './react-providers/index.js';

declare module '@nocobase/app-client' {
  interface PublicAppConfig {
    accountSwitcher?: { mode?: AccountSwitcherMode };
  }
}
export type { PublicAppConfig };

const accountSwitcher: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-account-switcher',
  locales,
  reactProviders,
});

export default accountSwitcher;
