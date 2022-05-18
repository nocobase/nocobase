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
      const force = false;
      await app.db.sync({
        force,
        alter: {
          drop: force,
        },
      });
      await app.stop({
        cliArgs,
      });
      console.log(chalk.green(`✨  NocoBase has been upgraded to v${app.getVersion()}`));
    });
};
