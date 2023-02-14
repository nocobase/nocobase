import path from 'path';

import { Op } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import { Registry } from '@nocobase/utils';

import initActions from './actions';
import calculators from './calculators';
import { EXECUTION_STATUS } from './constants';
import extensions from './extensions';
import initInstructions, { Instruction } from './instructions';
import ExecutionModel from './models/Execution';
import JobModel from './models/Job';
import WorkflowModel from './models/Workflow';
import Processor from './Processor';
import initTriggers, { Trigger } from './triggers';

type Pending = [ExecutionModel, JobModel?];
export default class WorkflowPlugin extends Plugin {
  instructions: Registry<Instruction> = new Registry();
  triggers: Registry<Trigger> = new Registry();
  calculators = calculators;
  extensions = extensions;
  executing: ExecutionModel | null = null;
  pending: Pending[] = [];
  events: [WorkflowModel, any, { context?: any }][] = [];

  onBeforeSave = async (instance: WorkflowModel, options) => {
    const Model = <typeof WorkflowModel>instance.constructor;

    if (instance.enabled) {
      instance.set('current', true);
    } else if (!instance.current) {
      const count = await Model.count({
        where: {
          key: instance.key,
        },
        transaction: options.transaction,
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
          [Op.ne]: instance.id,
        },
      },
      transaction: options.transaction,
    });

    if (previous) {
      // NOTE: set to `null` but not `false` will not violate the unique index
      await previous.update(
        { enabled: false, current: null },
        {
          transaction: options.transaction,
          hooks: false,
        },
      );

      this.toggle(previous, false);
    }
  };

  async load() {
    const { db, options } = this;

    this.app.acl.registerSnippet({
      name: `pm.${this.name}.workflows`,
      actions: [
        'workflows:*',
        'workflows.nodes:*',
        'executions:list',
        'executions:get',
        'flow_nodes:update',
        'flow_nodes:destroy',
      ],
    });

    this.app.acl.allow('users_jobs', ['list', 'get', 'submit'], 'loggedIn');

    await db.import({
      directory: path.resolve(__dirname, 'collections'),
    });

    this.db.addMigrations({
      namespace: 'workflow',
      directory: path.resolve(__dirname, 'migrations'),
      context: {
        plugin: this,
      },
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

      // check for not started executions
      this.dispatch();
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

  public trigger(workflow: WorkflowModel, context: Object, options: { context?: any } = {}): void {
    // `null` means not to trigger
    if (context == null) {
      return;
    }

    this.events.push([workflow, context, options]);

    this.app.logger.debug(`[Workflow] new event triggered, now events: ${this.events.length}`);

    if (this.events.length > 1) {
      return;
    }

    // NOTE: no await for quick return
    setTimeout(this.prepare);
  }

  private prepare = async () => {
    const event = this.events.shift();
    if (!event) {
      return;
    }
    const [workflow, context, options] = event;

    let valid = true;
    if (options.context?.executionId) {
      // NOTE: no transaction here for read-uncommitted execution
      const existed = await workflow.countExecutions({
        where: {
          id: options.context.executionId,
        },
      });

      if (existed) {
        this.app.logger.warn(
          `[Workflow] workflow ${workflow.id} has already been triggered in same execution (${options.context.executionId}), and newly triggering will be skipped.`,
        );
        valid = false;
      }
    }

    if (valid) {
      const execution = await this.db.sequelize.transaction(async (transaction) => {
        const execution = await workflow.createExecution(
          {
            context,
            key: workflow.key,
            status: EXECUTION_STATUS.CREATED,
            useTransaction: workflow.useTransaction,
          },
          { transaction },
        );

        const executed = await workflow.countExecutions({ transaction });

        // NOTE: not to trigger afterUpdate hook here
        await workflow.update({ executed }, { transaction, hooks: false });

        const allExecuted = await (<typeof ExecutionModel>execution.constructor).count({
          where: {
            key: workflow.key,
          },
          transaction,
        });
        await (<typeof WorkflowModel>workflow.constructor).update(
          {
            allExecuted,
          },
          {
            where: {
              key: workflow.key,
            },
            individualHooks: true,
            transaction,
          },
        );

        execution.workflow = workflow;

        return execution;
      });

      this.app.logger.debug(`[Workflow] execution of workflow ${workflow.id} created as ${execution.id}`);

      // NOTE: cache first execution for most cases
      if (!this.executing && !this.pending.length) {
        this.pending.push([execution]);
      }
    }

    if (this.events.length) {
      await this.prepare();
    } else {
      this.dispatch();
    }
  };

  public async resume(job) {
    if (!job.execution) {
      job.execution = await job.getExecution();
    }

    this.pending.push([job.execution, job]);
    this.dispatch();
  }

  private async dispatch() {
    if (this.executing) {
      return;
    }

    let next: Pending | null = null;
    // resuming has high priority
    if (this.pending.length) {
      next = this.pending.shift() as Pending;
    } else {
      const execution = (await this.db.getRepository('executions').findOne({
        filter: {
          status: EXECUTION_STATUS.CREATED,
        },
        sort: 'createdAt',
      })) as ExecutionModel;
      if (execution) {
        next = [execution];
      }
    }
    if (next) {
      this.process(...next);
    }
  }

  private async process(execution: ExecutionModel, job?: JobModel) {
    this.executing = execution;

    if (execution.status === EXECUTION_STATUS.CREATED) {
      await execution.update({ status: EXECUTION_STATUS.STARTED });
    }

    const processor = this.createProcessor(execution);

    this.app.logger.info(`[Workflow] execution ${execution.id} ${job ? 'resuming' : 'starting'} ...`);

    try {
      await (job ? processor.resume(job) : processor.start());
    } catch (err) {
      this.app.logger.error(`[Workflow] ${err.message}`, err);
    }

    this.executing = null;

    this.dispatch();
  }

  private createProcessor(execution: ExecutionModel, options = {}): Processor {
    return new Processor(execution, { ...options, plugin: this });
  }
}
