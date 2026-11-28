import { defineCliPlugin, type AppCliPlugin } from '@nocobase/app-cli';
import DevSession from './dev-session.js';

const authorizationCli: AppCliPlugin = defineCliPlugin({
  packageName: '@nocobase/app-plugin-authorization',
  devCommands: { 'dev-session': DevSession },
});
export default authorizationCli;
