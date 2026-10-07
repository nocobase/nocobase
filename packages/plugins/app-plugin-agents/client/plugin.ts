import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import locales from './locales/index.js';

// The plugin has no routes of its own: an application routes the agent team pages (`client/routes.ts`) and the
// settings pages (`client/config.ts`) where it keeps them, and mounts the run panel (`client/runs.ts`) on the pages of
// the runner agents do.
const agents: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-agents',
  locales,
});

export default agents;
