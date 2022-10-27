import Application from '../application';

export default (app: Application) => {
  app
    .command('pm')
    .argument('<method>')
    .arguments('<plugins...>')
    .action(async (method, plugins, options, ...args) => {
      app.pm.clientWrite({ method, plugins });
    });
};
