import chalk from 'chalk';
import Application from '../application';

export default (app: Application) => {
  app.command('upgrade').action(async (...cliArgs) => {
    console.log('upgrading...');
    await app.upgrade();
    console.log(chalk.green(`✨  NocoBase has been upgraded to v${app.getVersion()}`));
  });
};
