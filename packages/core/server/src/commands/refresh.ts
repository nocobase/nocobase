import Application from '../application';

export default (app: Application) => {
  app
    .command('refresh')
    .ipc()
    .action(async (cliArgs) => {
      await app.restart({
        cliArgs,
      });
      app.log.info('refreshing...');
    });
};
