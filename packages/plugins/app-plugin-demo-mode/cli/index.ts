import { defineCliPlugin, type AppCliPlugin } from '@nocobase/app-cli';
import DemoData from './data.js';

const plugin: AppCliPlugin = defineCliPlugin({
  packageName: '@nocobase/app-plugin-demo-mode',
  description: 'Manage the application’s demo dataset.',
  commands: { data: DemoData },
});

export default plugin;
