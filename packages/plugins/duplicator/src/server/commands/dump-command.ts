import { Application } from '@nocobase/server';
import { Dumper } from '../dumper';

export default function addDumpCommand(app: Application) {
  app
    .command('dump')
    .option('-a, --app <appName>', 'sub app name if you dump sub app in multiple apps')
    .action(async (options) => {
      if (!options.app) {
        await dumpAction(app);
        return;
      }

      const subApp = await app.appManager.getApplication(options.app);
      if (!subApp) {
        app.log.error(`app ${options.app} not found`);
        await app.stop();
        return;
      }

      await dumpAction(subApp);
    });
}

async function dumpAction(app) {
  const dumper = new Dumper(app);
  await dumper.dump({});

  await app.stop();
}
