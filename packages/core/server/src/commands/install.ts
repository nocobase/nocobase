import chalk from 'chalk';
import Application from '../application';
export default (app: Application) => {
  app
    .command('install')
    .option('-f, --force')
    .option('-c, --clean')
    .option('-s, --silent')
    .option('-r, --retry [retry]')
    .option('-I, --ignore-installed')
    .action(async (...cliArgs) => {
      const installed = await app.isInstalled();

      const [opts] = cliArgs;

      if (opts.ignoreInstalled && installed) {
        app.logger.info('NocoBase is already installed. Ignore install command.');
        return;
      }

      if (!opts?.clean && !opts?.force && installed) {
        if (!opts.silent) {
          console.log('NocoBase is already installed. To reinstall, please execute:');
          console.log();
          const command = '$ yarn nocobase install -f';
          console.log(chalk.yellow(command));
          console.log();
          console.log(chalk.red('This operation will clear the database!!!'));
          console.log();
        }
        return;
      }

      if (!opts.silent || !installed) {
        app.logger.info(`Start installing NocoBase`);
      }

      await app.install({
        cliArgs,
        clean: opts.clean,
        sync: {
          force: opts.force,
        },
      });

      await app.restart();
    });
};
