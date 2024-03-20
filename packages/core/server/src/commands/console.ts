import Application from '../application';

const REPL = require('repl');

export default (app: Application) => {
  app
    .command('console')
    .preload()
    .action(async () => {
      await app.start();
      const repl = (REPL.start('nocobase > ').context.app = app);
      repl.on('exit', async function (err) {
        if (err) {
          console.log(err);
          process.exit(1);
        }
        await app.stop();
        process.exit(0);
      });
    });
};
