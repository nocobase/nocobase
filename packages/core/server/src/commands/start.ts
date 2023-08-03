import { AppSupervisor } from '../app-supervisor';
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

      if (!(await app.isInstalled())) {
        AppSupervisor.getInstance().setAppError(
          app.name,
          new Error('App is not installed, please run `yarn run nocobase install` first'),
        );
      }

      if (!AppSupervisor.getInstance().hasAppError(app.name)) {
        await app.start({
          dbSync: opts?.dbSync,
          cliArgs,
        });
      }
    });
};
