/* istanbul ignore file -- @preserve */

import Application from '../application';

export default (app: Application) => {
  app
    .command('destroy')
    .preload()
    .action(async (...cliArgs) => {
      await app.destroy({
        cliArgs,
      });
    });
};
