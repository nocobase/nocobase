import agents from '@nocobase/app-plugin-agents/cli';
import authorization from '@nocobase/app-plugin-authorization/cli';
import { defineCliPlugins, type AppCliPlugins } from '@nocobase/app-cli';
import scheduler from '@nocobase/app-plugin-scheduler/cli';

// Array order is command registration order. A plugin contributes its commands
// by appearing in this list; removing its entry and its import removes them.
const cliPlugins: AppCliPlugins = defineCliPlugins([
  authorization,
  scheduler,
  agents,
]);

export default cliPlugins;
