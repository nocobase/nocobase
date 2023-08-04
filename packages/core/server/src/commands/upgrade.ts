import chalk from 'chalk';
import Application from '../application';

/**
 * TODO
 */
export default (app: Application) => {
  app.command('upgrade').action(async (...cliArgs) => {
    app.log.debug('upgrading...');
    await app.upgrade();
    app.log.debug(chalk.green(`✨  NocoBase has been upgraded to v${app.getVersion()}`));
  });
};
