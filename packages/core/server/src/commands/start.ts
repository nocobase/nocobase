import Application from '../application';
import { Gateway } from '../gateway';

export default (app: Application) => {
  app
    .command('start')
    .option('-s, --silent')
    .option('-p, --port [post]')
    .option('-h, --host [host]')
    .option('--db-sync')
    .action(async (...cliArgs) => {
      const [opts] = cliArgs;
      const port = opts.port || process.env['APP_PORT'] || 13000;
      const host = opts.host || process.env['APP_HOST'] || '0.0.0.0';

      Gateway.getInstance().start({
        port,
        host,
      });

      await app.start({
        dbSync: opts?.dbSync,
        cliArgs,
      });
    });
};
