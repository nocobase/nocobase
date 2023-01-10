import chalk from 'chalk';
import Application from '../application';

export default (app: Application) => {
  app
    .command('install')
    .option('-f, --force')
    .option('-c, --clean')
    .option('-u', '--underscored')
    .option('-s, --silent')
    .option('-r, --retry [retry]')
    .option('-I, --ignore-installed')
    .action(async (...cliArgs) => {
      let installed = false;
      const [opts] = cliArgs;

      if (opts.ignoreInstalled) {
        if (await app.isInstalled()) {
          console.log('Application installed');
          return;
        }
      }

      if (!opts?.clean && !opts?.force) {
        if (await app.isInstalled()) {
          installed = true;
          if (!opts.silent) {
            console.log('NocoBase is already installed. To reinstall, please execute:');
            console.log();
            let command = '$ yarn nocobase install -f';
            console.log(chalk.yellow(command));
            console.log();
            console.log(chalk.red('This operation will clear the database!!!'));
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
