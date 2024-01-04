import Application from '../application';

/**
 * TODO
 */
export default (app: Application) => {
  app
    .command('upgrade')
    .ipc()
    .action(async (options) => {
      await app.upgrade(options);
    });
};
