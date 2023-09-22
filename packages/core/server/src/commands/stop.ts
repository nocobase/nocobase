import Application from '../application';

export default (app: Application) => {
  app
    .command('stop')
    .ipc()
    .action(async (...cliArgs) => {
      await app.stop({
        cliArgs,
      });
    });
};
