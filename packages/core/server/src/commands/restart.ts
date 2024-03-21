import Application from '../application';

export default (app: Application) => {
  app
    .command('restart')
    .ipc()
    .action(async (...cliArgs) => {
      if (!(await app.isStarted())) {
        app.log.info('app has not started');
        return;
      }
      await app.restart({
        cliArgs,
      });
      app.log.info('app has been restarted');
    });
};
