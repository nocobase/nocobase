import { defineCliPlugins, type AppCliPlugins } from '@nocobase/app-cli';
import cliExample from '@nocobase/app-plugin-cli-example/cli';
import workflow from '@nocobase/app-plugin-workflow/cli';
import scheduler from '@nocobase/app-plugin-scheduler/cli';

// Array order is command registration order. A plugin contributes its commands
// by appearing in this list; removing its entry and its import removes them.
const cliPlugins: AppCliPlugins = defineCliPlugins([
  cliExample,
  workflow,
  scheduler,
]);

export default cliPlugins;
