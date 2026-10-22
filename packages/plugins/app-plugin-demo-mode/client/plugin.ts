import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import { demoModeReactProviders } from './react-providers/index.js';
import routes from './routes.js';

export interface DemoModeClientOptions {
  /**
   * Where signed-in visitors switch demo accounts: `floating`, a corner button on every page (the default, needing no
   * application code), or `menu`, the application's account menu through `DemoAccountMenu`, the corner button then
   * showing only to visitors who have not signed in.
   */
  readonly accountSwitcher?: 'floating' | 'menu';
  /** Whether to render the floating entry at all. Account-menu and direct sign-in routes remain available. */
  readonly showFloatingAccountSwitcher?: boolean;
}

const demoMode: AppClientPluginFactory<DemoModeClientOptions> =
  defineClientPlugin<DemoModeClientOptions>({
    packageName: '@nocobase/app-plugin-demo-mode',
    locales,
    reactProviders: (options) => demoModeReactProviders(options),
    routes,
  });

export default demoMode;
