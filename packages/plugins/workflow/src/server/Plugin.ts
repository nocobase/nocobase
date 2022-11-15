import path from 'path';

import { Op, Transactionable } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import { Registry } from '@nocobase/utils';

import initActions from './actions';
import calculators from './calculators';
import { EXECUTION_STATUS } from './constants';
import extensions from './extensions';
import initInstructions, { Instruction } from './instructions';
import ExecutionModel from './models/Execution';
import WorkflowModel from './models/Workflow';
import Processor from './Processor';
import initTriggers, { Trigger } from './triggers';
import JobModel from './models/Job';



export default class WorkflowPlugin extends Plugin {
  instructions: Registry<Instruction> = new Registry();
  triggers: Registry<Trigger> = new Registry();
  calculators = calculators;
  extensions = extensions;
  executing: Promise<any> = null;
  pending: [ExecutionModel, JobModel][] = [];

  onBeforeSave = async (instance: WorkflowModel, options) => {
    const Model = <typeof WorkflowModel>instance.constructor;

    if (instance.enabled) {
      instance.set('current', true);
    } else if (!instance.current) {
      const count = await Model.count({
        where: {
          key: instance.key
        },
        transaction: options.transaction
      });
      if (!count) {
        instance.set('current', true);
      }
    }

    if (!instance.changed('enabled') || !instance.enabled) {
      return;
    }

    const previous = await Model.findOne({
      where: {
        key: instance.key,
        current: true,
        id: {
          [Op.ne]: instance.id
        }
      },
      transaction: options.transaction
    });

    if (previous) {
      // NOTE: set to `null` but not `false` will not violate the unique index
      await previous.update({ enabled: false, current: null }, {
        transaction: options.transaction,
        hooks: false
      });

      this.toggle(previous, false);
    }
  };

  async load() {
    const { db, options } = this;

    await db.import({
      directory: path.resolve(__dirname, 'collections'),
    });

    initActions(this);
    initTriggers(this, options.triggers);
    initInstructions(this, options.instructions);

    db.on('workflows.beforeSave', this.onBeforeSave);
    db.on('workflows.afterSave', (model: WorkflowModel) => this.toggle(model));
    db.on('workflows.afterDestroy', (model: WorkflowModel) => this.toggle(model, false));

    this.app.on('afterLoad', async () => {
      this.extensions.reduce((promise, extend) => promise.then(() => extend(this)), Promise.resolve());
    });

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

    this.app.on('beforeStop', async () => {
      const collection = db.getCollection('workflows');
      const workflows = await collection.repository.find({
        filter: { enabled: true },
      });

      workflows.forEach((workflow: WorkflowModel) => {
        this.toggle(workflow, false);
      });
    });
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

  public async trigger(workflow: WorkflowModel, context: Object, options: Transactionable & { context?: any } = {}): Promise<void> {
    // `null` means not to trigger
    if (context == null) {
      return null;
    }

    if (options.context?.executionId) {
      // NOTE: no transaction here for read-uncommitted execution
      const existed = await workflow.countExecutions({
        where: {
          id: options.context.executionId
        }
      });

      if (existed) {
        console.warn(`workflow ${workflow.id} has already been triggered in same execution (${options.context.executionId}), and newly triggering will be skipped.`);
        return;
      }
    }

    // @ts-ignore
    const transaction = options.transaction && !options.transaction.finished
      ? options.transaction
      : await (<typeof WorkflowModel>workflow.constructor).database.sequelize.transaction();

    const execution = await workflow.createExecution({
      context,
      key: workflow.key,
      status: EXECUTION_STATUS.CREATED,
      useTransaction: workflow.useTransaction,
    }, { transaction });

    console.log('workflow triggered:', new Date(), workflow.id, execution.id);

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

    // @ts-ignore
    if (transaction && (!options.transaction || options.transaction.finished)) {
      await transaction.commit();
    }

    setTimeout(() => this.dispatch(execution));
  }

  public async resume(job) {
    if (!job.execution) {
      job.execution = await job.getExecution();
    }

    setTimeout(() => this.dispatch(job.execution, job));
  }

  private async dispatch(execution?: ExecutionModel, job?: JobModel) {
    if (this.executing) {
      if (job) {
        this.pending.push([execution, job]);
      }
      return;
    }

    if (!execution) {
      execution = await this.db.getRepository('executions').findOne({
        filter: {
          status: EXECUTION_STATUS.CREATED
        },
        sort: 'createdAt'
      }) as ExecutionModel;
      if (!execution) {
        return;
      }
    }

    if (execution.status === EXECUTION_STATUS.CREATED) {
      await execution.update({ status: EXECUTION_STATUS.STARTED });
    }

    const processor = this.createProcessor(execution);

    this.executing = job ? processor.resume(job) : processor.start();

    await this.executing;

    this.executing = null;

    setTimeout(() => {
      const args = this.pending.length ? this.pending.shift() : [];
      this.dispatch(...args);
    });
  }

  private createProcessor(execution: ExecutionModel, options = {}): Processor {
    return new Processor(execution, { ...options, plugin: this });
  }
}
