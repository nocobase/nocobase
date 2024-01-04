import Application from '../application';

export default (app: Application) => {
  app
    .command('install')
    .ipc()
    .option('-f, --force')
    .option('-c, --clean')
    .action(async (options) => {
      await app.install(options);
    });
};
