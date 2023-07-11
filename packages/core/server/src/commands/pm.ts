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
        console.log('Install dependencies');
        await run('yarn', ['install']);
      }

      await app.pm.clientWrite({ method, plugins });

      if (method === 'create') {
        console.log(`You can use \`yarn nocobase pm add ${plugins.join(' ')}\` to add plugins.`);
      }

      if (method === 'add') {
        console.log(`You can use \`yarn nocobase pm enable ${plugins.join(' ')}\` to enable plugins.`);
      }
    });
};
