import Application from '../application';

export default (app: Application) => {
  app
    .command('migrator')
    .action(async (opts) => {
      await app.start();
      console.log('migrating...');
      await app.db.migrator.runAsCLI(process.argv.slice(3));
      await app.stop();
    });
};
