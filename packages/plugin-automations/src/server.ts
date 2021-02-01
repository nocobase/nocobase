import Database, { registerModels } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import path from 'path';
import { AutomationModel } from './models/automation';
import { AutomationJobModel } from './models/automation-job';

export default async function (options = {}) {
  const database: Database = this.database;
  const resourcer: Resourcer = this.resourcer;

  registerModels({
    AutomationModel,
    AutomationJobModel,
  });

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  const [Automation, AutomationJob] = database.getModels(['automations', 'automations_jobs']);

  Automation.addHook('afterUpdate', async (model: any) => {
    if (model.changed('enabled' as any)) {
      model.get('enabled') ? model.startJobs() : model.cancelJobs();
    }
  });

  Automation.addHook('beforeDestroy', async (model: any) => {
    await model.cancelJobs();
  });

  AutomationJob.addHook('afterCreate', async (model: any) => {
    await model.bootstrap();
  });

  AutomationJob.addHook('beforeDestroy', async (model: any) => {
    await model.cancel();
  });
}
