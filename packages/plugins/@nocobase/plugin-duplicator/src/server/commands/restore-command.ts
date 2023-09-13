import { Application, AppSupervisor } from '@nocobase/server';
import { Restorer } from '../restorer';
import inquirer from 'inquirer';
import InquireQuestionBuilder from './inquire-question-builder';

export default function addRestoreCommand(app: Application) {
  app
    .command('restore')
    .argument('<string>', 'restore file path')
    .option('-a, --app <appName>', 'sub app name if you want to restore into a sub app')
    .option('-f, --force', 'force restore without warning')
    .action(async (restoreFilePath, options) => {
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

      // should confirm data will be overwritten
      if (!options.force && !(await restoreWarning())) {
        return;
      }

      await restoreActionCommand(importApp, restoreFilePath);
    });
}

interface RestoreContext {
  app: Application;
  dir: string;
}

async function restoreWarning() {
  const results = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Danger !!! This action will overwrite your current data, please make sure you have a backup❗️❗️',
      default: false,
    },
  ]);

  return results.confirm;
}

async function restoreActionCommand(app: Application, restoreFilePath: string) {
  const restorer = new Restorer(app, {
    backUpFilePath: restoreFilePath,
  });
  const restoreMeta = await restorer.parseBackupFile();

  const { requiredGroups, selectedOptionalGroups, selectedUserCollections } = restoreMeta;

  const questions = InquireQuestionBuilder.buildInquirerQuestions({
    requiredGroups,
    optionalGroups: selectedOptionalGroups,
    optionalCollections: await Promise.all(
      selectedUserCollections.map(async (name) => {
        return { name, title: await restorer.getImportCollectionTitle(name) };
      }),
    ),
    direction: 'restore',
  });

  const results = await inquirer.prompt(questions);

  await restorer.restore({
    selectedOptionalGroupNames: results.collectionGroups,
    selectedUserCollections: results.userCollections,
  });

  await app.stop();
}
