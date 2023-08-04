import { AppSupervisor } from '../app-supervisor';
import Application from '../application';
import { Gateway } from '../gateway';

export default (app: Application) => {
  app
    .command('start')
    .option('--db-sync')
    .action(async (...cliArgs) => {
      const [opts] = cliArgs;

      app.getFsmInterpreter().send('start', {
        dbSync: opts?.dbSync,
        cliArgs,
        checkInstall: true,
      });
    });
};
