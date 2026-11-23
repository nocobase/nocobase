import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import { mailRoutes, type MailRouteOptions } from './routes.js';
import serviceProviders from './service-provider.js';

export interface MailClientOptions {
  /** Register both mail workspace pages. Defaults to false. */
  readonly workspaceRoutes?: boolean;
  /** Where the Mail and Team mail pages appear in the navigation, or `false` to leave one out of it. */
  readonly routes?: MailRouteOptions;
}

const mail: AppClientPluginFactory<MailClientOptions> =
  defineClientPlugin<MailClientOptions>({
    packageName: '@nocobase/app-plugin-mail',
    locales,
    serviceProviders,
    routes: (options) =>
      mailRoutes(options?.routes, options?.workspaceRoutes === true),
  });

export default mail;
