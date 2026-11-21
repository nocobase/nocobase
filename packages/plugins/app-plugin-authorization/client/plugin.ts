import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import reactProviders from './react-providers.js';
import { authorizationSettingsRoutes } from './routes.js';
import serviceProviders from './service-provider.js';
import type { AuthorizationSettingsOptions } from './settings/extensions.js';

export interface AuthorizationClientOptions extends AuthorizationSettingsOptions {
  /** `false` leaves the Roles and permissions pages unregistered. Defaults to `true`. */
  readonly routes?: boolean;
}

const authorization: AppClientPluginFactory<AuthorizationClientOptions> =
  defineClientPlugin<AuthorizationClientOptions>({
    packageName: '@nocobase/app-plugin-authorization',
    locales,
    serviceProviders: (options) => serviceProviders(options),
    reactProviders,
    routes: (options) =>
      options.routes === false ? [] : [authorizationSettingsRoutes()],
  });

export default authorization;
