import { defineCliPlugin, type AppCliPlugin } from '@nocobase/app-cli';

import CountEntries from './count.js';

const plugin: AppCliPlugin = defineCliPlugin({
  packageName: '@example/app-plugin-reading-list',
  commands: { count: CountEntries },
});

export default plugin;
