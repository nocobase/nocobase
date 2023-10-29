import inquirer from 'inquirer';
import { Application, AppSupervisor } from '@nocobase/server';
import { Dumper } from '../dumper';
import InquireQuestionBuilder from './inquire-question-builder';

export default function addDumpCommand(app: Application) {
  app
    .command('dump')
    .option('-a, --app <appName>', 'sub app name if you dump sub app in multiple apps')
    .action(async (options) => {
      let dumpApp = app;

      if (options.app) {
        const subApp = await AppSupervisor.getInstance().getApp(options.app);

        if (!subApp) {
          app.log.error(`app ${options.app} not found`);
          await app.stop();
          return;
        }

        dumpApp = subApp;
      }

      await dumpCommandAction(dumpApp);
    });
}

async function dumpCommandAction(app: Application) {
  const dumper = new Dumper(app);

  const questions = InquireQuestionBuilder.buildInquirerDataTypeQuestions({
    direction: 'dump',
  });

  const results = await inquirer.prompt(questions);

  const { filePath } = await dumper.dump({
    dataTypes: new Set(results.dataTypes),
  });

  app.log.info(`dumped to ${filePath}`);

  await app.stop();
}
