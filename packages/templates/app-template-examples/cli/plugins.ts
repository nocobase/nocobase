import { defineCliPlugins, type AppCliPlugins } from '@nocobase/app-cli';
import aiEmployee from '@nocobase/app-plugin-ai-employee/cli';
import cliExample from '@nocobase/app-plugin-cli-example/cli';
import workflow from '@nocobase/app-plugin-workflow/cli';
import scheduler from '@nocobase/app-plugin-scheduler/cli';

// Array order is command registration order. A plugin contributes its commands
// by appearing in this list; removing its entry and its import removes them.
const cliPlugins: AppCliPlugins = defineCliPlugins([
  cliExample,
  workflow,
  scheduler,
  aiEmployee,
]);

export default cliPlugins;
