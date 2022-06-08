import Application from '../application';

export default (app: Application) => {
  app
    .command('db:auth')
    .option('-r, --repeat [repeat]')
    .action(async (opts) => {
      await app.db.auth({ repeat: opts.repeat || 10 });
    });
};
