import path from 'path';

import { Plugin } from '@nocobase/server';
import { Op } from '@nocobase/database';

import WorkflowModel from './models/Workflow';
import ExecutionModel from './models/Execution';
import initActions from './actions';
import initTriggers, { Trigger } from './triggers';
import { Registry } from '@nocobase/utils';



export default class extends Plugin {
  triggers: Registry<Trigger> = new Registry<Trigger>();

  getName(): string {
    return this.getPackageName(__dirname);
  }

  async load(options = {}) {
    const { db } = this.app;

    db.registerModels({
      WorkflowModel,
      ExecutionModel,
    });

    await db.import({
      directory: path.resolve(__dirname, 'collections'),
    });

    initActions(this);

    initTriggers(this);

    db.on('workflows.beforeSave', this.setCurrent);
    db.on('workflows.afterSave', (model: WorkflowModel) => this.toggle(model));
    db.on('workflows.afterDestroy', (model: WorkflowModel) => this.toggle(model, false));

    // [Life Cycle]:
    //   * load all workflows in db
    //   * add all hooks for enabled workflows
    //   * add hooks for create/update[enabled]/delete workflow to add/remove specific hooks
    this.app.on('beforeStart', async () => {
      const collection = db.getCollection('workflows');
      const workflows = await collection.repository.find({
        filter: { enabled: true },
      });

      workflows.forEach((workflow: WorkflowModel) => {
        this.toggle(workflow);
      });
    });
    // [Life Cycle]: initialize all necessary seed data
    // this.app.on('db.init', async () => {});
  }

  setCurrent = async (workflow: WorkflowModel, options) => {
    const others: { enabled?: boolean, current?: boolean } = {};

    if (workflow.enabled) {
      workflow.set('current', true);
      others.enabled = false;
    }

    if (workflow.current) {
      others.current = false;
      await (<typeof WorkflowModel>workflow.constructor).update(others, {
        where: {
          key: workflow.key,
          id: {
            [Op.ne]: workflow.id
          }
        },
        individualHooks: true,
        transaction: options.transaction
      });
    }
  }

  toggle(workflow: WorkflowModel, enable?: boolean) {
    const type = workflow.get('type');
    const trigger = this.triggers.get(type);
    if (typeof enable !== 'undefined' ? enable : workflow.get('enabled')) {
      // NOTE: remove previous listener if config updated
      const prev = workflow.previous();
      if (prev.config) {
        trigger.off({ ...workflow.get(), ...prev });
      }
      trigger.on(workflow);
    } else {
      trigger.off(workflow);
    }
  }
}
