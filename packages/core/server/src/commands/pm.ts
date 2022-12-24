import Application from '../application';

export default (app: Application) => {
  app
    .command('pm')
    .argument('<method>')
    .arguments('<plugins...>')
    .action(async (method, plugins, options, ...args) => {
      if (method === 'add') {
        const { run } = require('@nocobase/cli/src/util');
        console.log('Install dependencies and rebuild workspaces');
        await run('yarn', ['install']);
      }
      app.pm.clientWrite({ method, plugins });
    });
};
