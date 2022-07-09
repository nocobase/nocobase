import Application from '../application';

export default (app: Application) => {
  app
    .command('migrator')
    .action(async (opts) => {
      console.log('migrating...');
      await app.emitAsync('cli.beforeMigrator', opts);
      await app.db.migrator.runAsCLI(process.argv.slice(3));
      await app.stop();
    });
};
