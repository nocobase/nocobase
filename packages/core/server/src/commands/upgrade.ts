import chalk from 'chalk';
import Application from '../application';

/**
 * TODO
 */
export default (app: Application) => {
  app
    .command('upgrade')
    .action(async (...cliArgs) => {
      const [opts] = cliArgs;
      console.log('upgrading...');
      await app.upgrade();
      await app.stop({
        cliArgs,
      });
      console.log(chalk.green(`✨  NocoBase has been upgraded to v${app.getVersion()}`));
    });
};
