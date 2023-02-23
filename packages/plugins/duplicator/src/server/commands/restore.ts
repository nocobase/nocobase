import { Application } from '@nocobase/server';
import { Restorer } from '../restorer';

export default function addRestoreCommand(app: Application) {
  app
    .command('restore')
    .argument('<string>', 'restore file path')
    .option('-a, --app <appName>', 'sub app name if you want to restore into a sub app')
    .action(async (restoreFilePath, options) => {
      if (!options.app) {
        await restoreAction(app, restoreFilePath);
        return;
      }

      if (
        !(await app.db.getCollection('applications').repository.findOne({
          filter: { name: options.app },
        }))
      ) {
        // create sub app if not exists
        await app.db.getCollection('applications').repository.create({
          values: {
            name: options.app,
          },
        });
      }

      const subApp = await app.appManager.getApplication(options.app);

      if (!subApp) {
        app.log.error(`app ${options.app} not found`);
        await app.stop();
        return;
      }

      await restoreAction(subApp, restoreFilePath);
    });
}

interface RestoreContext {
  app: Application;
  dir: string;
}

async function restoreAction(app: Application, restoreFilePath: string) {
  const restorer = new Restorer(app);
  await restorer.restore(restoreFilePath);
  await app.stop();
}
