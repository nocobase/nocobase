import Application from '../application';

export default (app: Application) => {
  app
    .command('pm')
    .argument('<method>')
    .arguments('<plugins...>')
    .option('-S, --skip-yarn-install', 'skip yarn install')
    .action(async (method, plugins, options, ...args) => {
      if (method === 'add' && !options.skipYarnInstall) {
        const { run } = require('@nocobase/cli/src/util');
        console.log('Install dependencies and rebuild workspaces');
        await run('yarn', ['install']);
      }

      app.pm.clientWrite({ method, plugins });
    });
};
