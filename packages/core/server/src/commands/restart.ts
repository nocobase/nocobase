import Application from '../application';

export default (app: Application) => {
  app
    .command('restart')
    .option('--db-sync')
    .action(async (...cliArgs) => {
      await app.restart({
        cliArgs,
      });
    });
};
