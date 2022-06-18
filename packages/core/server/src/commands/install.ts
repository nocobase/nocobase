import chalk from 'chalk';
import Application from '../application';

export default (app: Application) => {
  app
    .command('install')
    .option('-f, --force')
    .option('-c, --clean')
    .option('-s, --silent')
    .option('-r, --retry [retry]')
    .action(async (...cliArgs) => {
      let installed = false;
      const [opts] = cliArgs;

      try {
        await app.db.auth({ retry: opts.retry || 1 });
      } catch (error) {
        console.log(chalk.red('Unable to connect to the database. Please check the database environment variables in the .env file.'));
        return;
      }

      if (!opts?.clean && !opts?.force) {
        if (app.db.collectionExistsInDb('applicationVersion')) {
          installed = true;
          if (!opts.silent) {
            console.log('NocoBase is already installed. To reinstall, please execute:');
            console.log();
            let command = '$ yarn nocobase install -f';
            console.log(chalk.yellow(command));
            console.log();
          }
          return;
        }
      }

      if (!opts.silent || !installed) {
        console.log(`Start installing NocoBase`);
      }

      await app.install({
        cliArgs,
        clean: opts.clean,
        sync: {
          force: opts.force,
        },
      });

      await app.stop({
        cliArgs,
      });
    });
};
