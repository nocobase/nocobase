// The commands an application gets by depending on this package. `nocobase.cli.entry` in `package.json` names this
// module, so the application's command line finds it without an entry in `cli/plugins.ts`, and imports it only when a
// run needs its commands.
//
// All are development commands: they build and send the application from its sources, and a built `dist/` has none.
import { defineCliPlugin, type AppCliPlugin } from '@nocobase/app-cli';

import HubAuthLogin from './auth/login.ts';
import HubAuthLogout from './auth/logout.ts';
import HubAuthStatus from './auth/status.ts';
import HubDeploy from './deploy.ts';
import HubReleases from './releases.ts';
import HubRemoteAdd from './remote/add.ts';
import HubRemoteList from './remote/list.ts';
import HubRemoteRemove from './remote/remove.ts';
import HubStatus from './status.ts';
import HubUpload from './upload.ts';

const cliPlugin: AppCliPlugin = defineCliPlugin({
  packageName: '@nocobase/hub-cli',
  description: 'Publish this application to a NocoBase Hub.',
  topics: {
    remote: 'Manage the Hub Apps this application deploys to.',
    auth: 'Save, remove and check the API keys for the remotes.',
  },
  devCommands: {
    deploy: HubDeploy,
    upload: HubUpload,
    releases: HubReleases,
    status: HubStatus,
    'remote:add': HubRemoteAdd,
    'remote:list': HubRemoteList,
    'remote:remove': HubRemoteRemove,
    'auth:login': HubAuthLogin,
    'auth:logout': HubAuthLogout,
    'auth:status': HubAuthStatus,
  },
});

export default cliPlugin;
