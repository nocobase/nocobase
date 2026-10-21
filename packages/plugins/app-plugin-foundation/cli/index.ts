import { defineCliPlugin, type AppCliPlugin } from '@nocobase/app-cli';
import BuildModuleManifest from './module-manifest.js';

const foundationCli: AppCliPlugin = defineCliPlugin({
  packageName: '@nocobase/app-plugin-foundation',
  devCommands: { 'modules:build': BuildModuleManifest },
  buildHooks: {
    afterServerBuild: [
      {
        label: 'Collect Foundation module associations',
        command: ['pnpm', 'nocobase', 'foundation', 'modules', 'build'],
      },
    ],
  },
});
export default foundationCli;
