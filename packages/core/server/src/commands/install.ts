import Application from '../application';

export default (app: Application) => {
  app
    .command('install')
    .ipc()
    .auth()
    .option('-f, --force')
    .option('-c, --clean')
    .option('--lang <lang>')
    .action(async (options) => {
      await app.install(options);
      const reinstall = options.clean || options.force;
      app.log.info(`app ${reinstall ? 'reinstalled' : 'installed'} successfully [v${app.getVersion()}]`);
    });
};
