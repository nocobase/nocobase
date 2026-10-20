import { defineCliPlugins, type AppCliPlugins } from '@nocobase/app-cli';
import cliExample from '@nocobase/app-plugin-cli-example/cli';
import scheduler from '@nocobase/app-plugin-scheduler/cli';
import agents from '@nocobase/app-plugin-agents/cli';

// Array order is command registration order. A plugin contributes its commands
// by appearing in this list; removing its entry and its import removes them.
const cliPlugins: AppCliPlugins = defineCliPlugins([
  cliExample,
  scheduler,
  agents,
]);

export default cliPlugins;
