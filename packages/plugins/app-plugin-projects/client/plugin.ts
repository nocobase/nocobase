import {
  createElement,
  type ComponentType,
  type PropsWithChildren,
} from 'react';
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
  /** Application effects mounted inside the projects query cache. */
  readonly queryEffects?: ComponentType;
  /** Set false when the application refreshes its own route cache. Defaults to true. */
  readonly realtime?: boolean;
}

const projects: AppClientPluginFactory<ProjectsClientOptions> =
  defineClientPlugin<ProjectsClientOptions>({
    packageName: '@nocobase/app-plugin-projects',
    locales,
    routes: (options) => (options.routes === false ? [] : routes),
    reactProviders: (options) => {
      const Effects = options.queryEffects;
      const component = ({ children }: PropsWithChildren) =>
        createElement(
          PmQueryProvider,
          { realtime: options.realtime },
          Effects ? createElement(Effects) : null,
          children,
        );
      return [{ name: 'pm-query', component }];
    },
  });

export default projects;
