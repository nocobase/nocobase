import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import serviceProviders from './service-provider.js';

export interface MailClientOptions {
  readonly placeholder?: never;
}

const mail: AppClientPluginFactory<MailClientOptions> = defineClientPlugin({
  packageName: '@nocobase/app-plugin-mail',
  locales,
  serviceProviders,
});

export default mail;
