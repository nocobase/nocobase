import Application from '../application';

export default (app: Application) => {
  app
    .command('db:auth')
    .option('-r, --retry [retry]')
    .action(async (opts) => {
      await app.db.auth({ retry: opts.retry || 10 });
    });
};
