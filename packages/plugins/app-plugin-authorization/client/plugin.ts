import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import reactProviders from './react-providers.js';
import serviceProviders from './service-provider.js';

export interface AuthorizationClientOptions {
  readonly placeholder?: never;
}

const authorization: AppClientPluginFactory<AuthorizationClientOptions> =
  defineClientPlugin({
    packageName: '@nocobase/app-plugin-authorization',
    locales,
    serviceProviders,
    reactProviders,
  });

export default authorization;
