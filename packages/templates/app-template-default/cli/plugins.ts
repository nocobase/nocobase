import { defineCliPlugins, type AppCliPlugins } from '@nocobase/app-cli';
import scheduler from '@nocobase/app-plugin-scheduler/cli';
import workflow from '@nocobase/app-plugin-workflow/cli';

// Array order is command registration order. A plugin contributes its commands
// by appearing in this list; removing its entry and its import removes them.
const cliPlugins: AppCliPlugins = defineCliPlugins([workflow, scheduler]);

export default cliPlugins;
