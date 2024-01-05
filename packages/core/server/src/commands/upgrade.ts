import Application from '../application';

/**
 * TODO
 */
export default (app: Application) => {
  app
    .command('upgrade')
    .ipc()
    .auth()
    .action(async (options) => {
      await app.upgrade(options);
      app.log.info(`✨  NocoBase has been upgraded to v${app.getVersion()}`);
    });
};
