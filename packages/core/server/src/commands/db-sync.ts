import Application from '../application';

export default (app: Application) => {
  app.command('db:sync').action(async (...cliArgs) => {
    const [opts] = cliArgs;
    console.log('db sync...');
    await app.emitAsync('cli.beforeDbSync', ...cliArgs);
    const force = false;
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
