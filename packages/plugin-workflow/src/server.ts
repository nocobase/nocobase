import path from 'path';

import { Plugin } from '@nocobase/server';

import WorkflowModel from './models/Workflow';
import ExecutionModel from './models/Execution';

export default class WorkflowPlugin extends Plugin {
  async load(options = {}) {
    const { db } = this.app;

    db.registerModels({
      WorkflowModel,
      ExecutionModel,
    });

    await db.import({
      directory: path.resolve(__dirname, 'collections'),
    });

    // [Life Cycle]:
    //   * load all workflows in db
    //   * add all hooks for enabled workflows
    //   * add hooks for create/update[enabled]/delete workflow to add/remove specific hooks
    this.app.on('beforeStart', async () => {
      const { model } = db.getCollection('workflows');
      await (model as typeof WorkflowModel).mount();
    })

    // [Life Cycle]: initialize all necessary seed data
    this.app.on('db.init', async () => {

    });

    // const [Automation, AutomationJob] = database.getModels(['automations', 'automations_jobs']);

    // Automation.addHook('afterCreate', async (model: AutomationModel) => {
    //   model.get('enabled') && await model.loadJobs();
    // });

    // Automation.addHook('afterUpdate', async (model: AutomationModel) => {
    //   if (!model.changed('enabled' as any)) {
    //     return;
    //   }
    //   model.get('enabled') ? await model.loadJobs() : await model.cancelJobs();
    // });

    // Automation.addHook('beforeDestroy', async (model: AutomationModel) => {
    //   await model.cancelJobs();
    // });

    // AutomationJob.addHook('afterCreate', async (model: AutomationJobModel) => {
    //   await model.bootstrap();
    // });

    // AutomationJob.addHook('beforeDestroy', async (model: AutomationJobModel) => {
    //   await model.cancel();
    // });
  }
}
