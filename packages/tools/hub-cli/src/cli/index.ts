// The commands an application gets by depending on this package. `nocobase.cli.entry` in `package.json` names this
// module, so the application's command line finds it without an entry in `cli/plugins.ts`, and imports it only when a
// run needs its commands.
//
// Both are development commands: they send the archive `nocobase build --tar` writes beside the sources, and a built
// `dist/` has no such archive.
import { defineCliPlugin, type AppCliPlugin } from '@nocobase/app-cli';

import HubDeploy from './deploy.ts';
import HubUpload from './upload.ts';

const cliPlugin: AppCliPlugin = defineCliPlugin({
  packageName: '@nocobase/hub-cli',
  description: 'Deploy this application to a NocoBase Hub.',
  devCommands: {
    deploy: HubDeploy,
    upload: HubUpload,
  },
});

export default cliPlugin;
