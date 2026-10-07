import { defineCliPlugin, type AppCliPlugin } from '@nocobase/app-cli';

import RunnerToken from './runner-token.js';

const cliPlugin: AppCliPlugin = defineCliPlugin({
  packageName: '@nocobase/app-plugin-agents',
  description:
    "Manage the agents and the runners that run this application's work.",
  commands: { 'runner-token': RunnerToken },
});

export default cliPlugin;
