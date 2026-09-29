import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import routes from './routes.js';
import serviceProviders from './service-provider.js';

export interface WorkflowClientOptions {
  /**
   * Where the application keeps its workflow packages, relative to its root.
   *
   * Read by this package's Vite contribution, which watches that directory and
   * rebuilds the client entries when a definition or a custom form changes.
   * The browser runtime never reads it. Keep it equal to the `sourceRoot` in
   * the application's server workflow configuration; the default is
   * `workflows`, the same one `workflow build` and `workflow check` assume.
   */
  readonly sourceRoot?: string;
}

const workflow: AppClientPluginFactory<WorkflowClientOptions> =
  defineClientPlugin({
    packageName: '@nocobase/app-plugin-workflow',
    serviceProviders,
    locales,
    routes,
  });

export default workflow;
