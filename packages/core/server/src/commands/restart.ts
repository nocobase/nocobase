import Application from '../application';

export default (app: Application) => {
  app.command('restart').action(async (...cliArgs) => {
    await app.restart({
      cliArgs,
    });
  });
};
