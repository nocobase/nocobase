import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import { PmQueryProvider } from './providers/query-provider.js';
import routes from './routes.js';

export interface ProjectsClientOptions {
  /**
   * `false` leaves the work pages unregistered, for an application that routes them itself from `client/pages.ts`.
   * Defaults to `true`.
   */
  readonly routes?: boolean;
}

const projects: AppClientPluginFactory<ProjectsClientOptions> =
  defineClientPlugin<ProjectsClientOptions>({
    packageName: '@nocobase/app-plugin-projects',
    locales,
    routes: (options) => (options.routes === false ? [] : routes),
    reactProviders: [{ name: 'pm-query', component: PmQueryProvider }],
  });

export default projects;
