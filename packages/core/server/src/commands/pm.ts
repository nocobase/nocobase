import Application from '../application';

export default (app: Application) => {
  app
    .command('pm')
    .argument('<method>')
    .arguments('<plugins...>')
    .action(async (method, plugins, options, ...args) => {
      try {
        await app.pm[method](plugins);
      } catch (error) {
        console.error(error.message);
      }
    });
};
