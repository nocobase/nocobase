import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';
import { agentsSettingsRoutes } from './routes.js';

export interface AgentsClientOptions {
  /**
   * `true` registers the agent management pages as System settings pages in the built-in AI category
   * (`agentsSettingsRoutes` in `client/routes.ts`). Defaults to `false`.
   */
  readonly settingsRoutes?: boolean;
}

// By default the plugin has no routes of its own: an application routes the agent management pages
// (`client/routes.ts`) and the settings pages (`client/config.ts`) where it keeps them, or asks for them as System
// settings pages with `settingsRoutes`, and mounts the run panel (`client/runs.ts`) on the pages of the runner agents
// do.
const agents: AppClientPluginFactory<AgentsClientOptions> =
  defineClientPlugin<AgentsClientOptions>({
    packageName: '@nocobase/app-plugin-agents',
    locales,
    routes: (options) => (options.settingsRoutes ? [agentsSettingsRoutes] : []),
  });

export default agents;
