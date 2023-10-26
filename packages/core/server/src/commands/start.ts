import Application from '../application';

export default (app: Application) => {
  app
    .command('start')
    .option('--db-sync')
    .option('--quickstart')
    .action(async (...cliArgs) => {
      const [opts] = cliArgs;

      if (app.db.closed()) {
        await app.db.reconnect();
      }

      if (opts.quickstart) {
        if (await app.isInstalled()) {
          app.log.debug('installed....');
          await app.upgrade();
        } else {
          await app.install();
        }
      }

      await app.start({
        dbSync: opts?.dbSync,
        cliArgs,
        checkInstall: true,
      });
    });
};
