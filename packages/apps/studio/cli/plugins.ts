import {
  defineCliPlugin,
  defineCliPlugins,
  type AppCliPlugins,
} from '@nocobase/app-cli';
import agents from '@nocobase/app-plugin-agents/cli';
import scheduler from '@nocobase/app-plugin-scheduler/cli';

/**
 * Studio's own build step: records the runner and CLI versions it serves (`server/agents/served-versions.ts`), once
 * the server is compiled. It contributes no commands.
 */
const studio = defineCliPlugin({
  packageName: '@nocobase/studio',
  buildHooks: {
    afterServerBuild: [
      {
        command: ['node', 'dist/server/agents/record-served-versions.js'],
        label: 'Record the runner and CLI versions Studio serves',
      },
    ],
  },
});

// Array order is command registration order. A plugin contributes its commands
// by appearing in this list; removing its entry and its import removes them.
const cliPlugins: AppCliPlugins = defineCliPlugins([scheduler, agents, studio]);

export default cliPlugins;
