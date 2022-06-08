import Application from '../application';

export default (app: Application) => {
  app
    .command('db:sync')
    .option('-f, --force')
    .action(async (...cliArgs) => {
      const [opts] = cliArgs;
      console.log('db sync...');
      const force = !!opts.force;
      await app.db.sync({
        force,
        alter: {
          drop: force,
        },
      });
      await app.stop({
        cliArgs,
      });
    });
};
