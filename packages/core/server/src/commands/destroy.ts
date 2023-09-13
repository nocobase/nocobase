import Application from '../application';

export default (app: Application) => {
  app.command('destroy').action(async (...cliArgs) => {
    await app.destroy({
      cliArgs,
    });
  });
};
