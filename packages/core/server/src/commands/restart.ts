import Application from '../application';

export default (app: Application) => {
  app
    .command('restart')
    .ipc()
    .action(async (...cliArgs) => {
      await app.restart({
        cliArgs,
      });
    });
};
