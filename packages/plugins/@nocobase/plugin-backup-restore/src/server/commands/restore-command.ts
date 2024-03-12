import { Application, AppSupervisor } from '@nocobase/server';
import { Restorer } from '../restorer';
import { DumpRulesGroupType } from '@nocobase/database';

export default function addRestoreCommand(app: Application) {
  app
    .command('restore')
    .ipc()
    .argument('<string>', 'restore file path')
    .option('-a, --app <appName>', 'sub app name if you want to restore into a sub app')
    .option('-f, --force', 'force restore')
    .option(
      '-g, --groups <groups>',
      'groups to restore',
      (value, previous) => {
        return previous.concat([value]);
      },
      [],
    )
    .action(async (restoreFilePath, options) => {
      // should confirm data will be overwritten
      if (!options.force) {
        app.log.warn('This action will overwrite your current data, please make sure you have a backup❗️❗️');
        return;
      }

      let importApp = app;

      if (options.app) {
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

        const subApp = await AppSupervisor.getInstance().getApp(options.app);

        if (!subApp) {
          app.log.error(`app ${options.app} not found`);
          await app.stop();
          return;
        }

        importApp = subApp;
      }

      const groups: Set<string> = new Set<DumpRulesGroupType>(options.groups);
      groups.add('required');

      const restorer = new Restorer(importApp, {
        backUpFilePath: restoreFilePath,
      });

      await restorer.restore({
        groups,
      });

      await app.upgrade();
    });
}
