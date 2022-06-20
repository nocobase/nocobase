import path from 'path';

import { Plugin } from '@nocobase/server';
import { Op, Transactionable } from '@nocobase/database';
import { Registry } from '@nocobase/utils';

import initActions from './actions';
import initTriggers, { Trigger } from './triggers';
import initInstructions, { Instruction } from './instructions';
import Processor from './Processor';
import WorkflowModel from './models/Workflow';
import ExecutionModel from './models/Execution';
import { EXECUTION_STATUS } from './constants';



async function setCurrent(instance: WorkflowModel, options) {
  const updates: { enabled?: boolean, current?: boolean } = {};

  if (!instance.changed('enabled')) {
    return;
  }

  if (instance.enabled) {
    instance.set('current', true);
    updates.enabled = false;
  }

  if (instance.current) {
    // NOTE: set to `null` but not `false` will not violate the unique index
    updates.current = null;
    const previous = await (<typeof WorkflowModel>instance.constructor).findOne({
      where: {
        key: instance.key,
        current: true
      }
    });

    if (previous) {
      await previous.update(updates, {
        transaction: options.transaction
      });
    }
  }
}

export default class WorkflowPlugin extends Plugin {
  instructions: Registry<Instruction> = new Registry();
  triggers: Registry<Trigger> = new Registry();

  getName(): string {
    return this.getPackageName(__dirname);
  }

  async load() {
    const { db, options } = this;

    await db.import({
      directory: path.resolve(__dirname, 'collections'),
    });

    initActions(this);
    initTriggers(this, options.triggers);
    initInstructions(this, options.instructions);

    db.on('workflows.beforeSave', setCurrent);
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

  async trigger(workflow, context: Object, options: Transactionable = {}) {
    // `null` means not to trigger
    if (context === null) {
      return;
    }

    let transaction = null;

    if (workflow.useTransaction) {
      // @ts-ignore
      transaction = options.transaction && !options.transaction.finished
        ? options.transaction
        : await (<typeof WorkflowModel>workflow.constructor).database.sequelize.transaction();

      const existed = await workflow.countExecutions({
        where: {
          transaction: transaction.id
        },
        transaction
      });

      if (existed) {
        console.warn(`workflow ${workflow.id} has already been triggered in same execution (${transaction.id}), and newly triggering will be skipped.`);
        return;
      }
    }

    const execution = await workflow.createExecution({
      context,
      key: workflow.key,
      status: EXECUTION_STATUS.STARTED,
      useTransaction: workflow.useTransaction,
      transaction: transaction.id
    }, { transaction });

    const executed = await workflow.countExecutions({ transaction });

    // NOTE: not to trigger afterUpdate hook here
    await workflow.update({ executed }, { transaction, hooks: false });

    const allExecuted = await (<typeof ExecutionModel>execution.constructor).count({
      where: {
        key: workflow.key
      },
      transaction
    });
    await (<typeof WorkflowModel>workflow.constructor).update({
      allExecuted
    }, {
      where: {
        key: workflow.key
      },
      individualHooks: true,
      transaction
    });

    execution.workflow = workflow;

    const processor = this.createProcessor(execution, { transaction });

    await processor.start();

    // @ts-ignore
    if (transaction && (!options.transaction || options.transaction.finished)) {
      await transaction.commit();
    }

    return execution;
  }

  createProcessor(execution: ExecutionModel, options = {}): Processor {
    return new Processor(execution, { ...options, plugin: this });
  }
}
