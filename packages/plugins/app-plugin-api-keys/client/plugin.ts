import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import { personalRoutes } from './routes.js';

export interface ApiKeysClientOptions {
  /** `false` leaves the API keys pages unregistered, for an application that builds its own. Defaults to `true`. */
  readonly routes?: boolean;
}

/**
 * Registers the plugin with the client application and its pages: Personal settings › API keys, where everyone
 * manages their own keys. An application replaces a page with `routeComponentOverrides` (route ids in
 * `API_KEY_ROUTES`) or leaves them all out with `routes: false`.
 */
const apiKeys: AppClientPluginFactory<ApiKeysClientOptions> =
  defineClientPlugin<ApiKeysClientOptions>({
    packageName: '@nocobase/app-plugin-api-keys',
    locales,
    routes: (options) => (options.routes === false ? [] : [personalRoutes]),
  });

export default apiKeys;
