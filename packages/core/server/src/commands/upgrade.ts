import chalk from 'chalk';
import Application from '../application';

/**
 * TODO
 */
export default (app: Application) => {
  app.command('upgrade').action(async (...cliArgs) => {
    app.log.debug('upgrading...');
    app.getFsmInterpreter().send('work', {
      workingType: 'upgrade',
      options: {},
    });
  });
};
