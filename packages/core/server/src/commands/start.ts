import Application from '../application';

export default (app: Application) => {
  app
    .command('start')
    .option('--db-sync')
    .action(async (...cliArgs) => {
      const [opts] = cliArgs;

      await app.start({
        dbSync: opts?.dbSync,
        cliArgs,
        checkInstall: true,
      });
    });
};
