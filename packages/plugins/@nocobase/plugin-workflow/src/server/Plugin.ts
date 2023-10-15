import path from 'path';

import LRUCache from 'lru-cache';
import winston from 'winston';

import { Op } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import { Registry } from '@nocobase/utils';

import { createLogger, getLoggerFilePath, getLoggerLevel, Logger, LoggerOptions } from '@nocobase/logger';
import Processor from './Processor';
import initActions from './actions';
import { EXECUTION_STATUS } from './constants';
import initFields from './fields';
import initFunctions, { CustomFunction } from './functions';
import initInstructions, { Instruction } from './instructions';
import initTriggers, { Trigger } from './triggers';

import type { ExecutionModel, JobModel, WorkflowModel } from './types';

type Pending = [ExecutionModel, JobModel?];

type ID = number | string;
export default class WorkflowPlugin extends Plugin {
  instructions: Registry<Instruction> = new Registry();
  triggers: Registry<Trigger> = new Registry();
  functions: Registry<CustomFunction> = new Registry();

  private ready = false;
  private executing: Promise<void> | null = null;
  private pending: Pending[] = [];
  private events: [WorkflowModel, any, { context?: any }][] = [];

  private loggerCache: LRUCache<string, Logger>;

  getLogger(workflowId: ID): Logger {
    const now = new Date();
    const date = `${now.getFullYear()}-${`0${now.getMonth() + 1}`.slice(-2)}-${`0${now.getDate()}`.slice(-2)}`;
    const key = `${date}-${workflowId}}`;
    if (this.loggerCache.has(key)) {
      return this.loggerCache.get(key);
    }

    const logger = createLogger({
      transports: [
        'console',
        new winston.transports.File({
          filename: getLoggerFilePath('workflows', date, `${workflowId}.log`),
          level: getLoggerLevel(),
        }),
      ],
    } as LoggerOptions);

    this.loggerCache.set(key, logger);

    return logger;
  }

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

    initFields(this);
    initActions(this);
    initTriggers(this, options.triggers);
    initInstructions(this, options.instructions);
    initFunctions(this, options.functions);

    this.loggerCache = new LRUCache({
      max: 20,
      updateAgeOnGet: true,
      dispose(logger) {
        (<Logger>logger).end();
      },
    });

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

    this.app.acl.registerSnippet({
      name: 'ui.*',
      actions: ['workflows:list'],
    });

    this.app.acl.allow('users_jobs', ['list', 'get', 'submit'], 'loggedIn');
    this.app.acl.allow('workflows', ['trigger'], 'loggedIn');

    await db.import({
      directory: path.resolve(__dirname, 'collections'),
    });

    this.db.addMigrations({
      namespace: this.name,
      directory: path.resolve(__dirname, 'migrations'),
      context: {
        plugin: this,
      },
    });

    db.on('workflows.beforeSave', this.onBeforeSave);
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

    this.app.on('afterStart', () => {
      this.app.setMaintainingMessage('check for not started executions');
      this.ready = true;
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

      this.ready = false;
      await this.prepare();
      if (this.executing) {
        await this.executing;
      }
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

  public trigger(workflow: WorkflowModel, context: object, options: { context?: any } = {}): void {
    // `null` means not to trigger
    if (!this.ready || context == null) {
      return;
    }

    this.events.push([workflow, context, options]);

    this.getLogger(workflow.id).info(`new event triggered, now events: ${this.events.length}`);
    this.getLogger(workflow.id).debug(`event data:`, {
      data: context,
    });

    if (this.events.length > 1) {
      return;
    }

    // NOTE: no await for quick return
    setTimeout(this.prepare);
  }

  public async resume(job) {
    if (!job.execution) {
      job.execution = await job.getExecution();
    }

    this.pending.push([job.execution, job]);
    this.dispatch();
  }

  public createProcessor(execution: ExecutionModel, options = {}): Processor {
    return new Processor(execution, { ...options, plugin: this });
  }

  private prepare = async () => {
    const [event] = this.events;
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
        this.getLogger(workflow.id).warn(
          `workflow ${workflow.id} has already been triggered in same execution (${options.context.executionId}), and newly triggering will be skipped.`,
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
            status: EXECUTION_STATUS.QUEUEING,
          },
          { transaction },
        );

        await workflow.increment('executed', { transaction });

        await (<typeof WorkflowModel>workflow.constructor).increment('allExecuted', {
          where: {
            key: workflow.key,
          },
          transaction,
        });

        execution.workflow = workflow;

        return execution;
      });

      this.getLogger(workflow.id).debug(`execution of workflow ${workflow.id} created as ${execution.id}`, {
        data: execution.context,
      });

      // NOTE: cache first execution for most cases
      if (!this.executing && !this.pending.length) {
        this.pending.push([execution]);
      }
    }

    this.events.shift();

    if (this.events.length) {
      await this.prepare();
    } else {
      this.dispatch();
    }
  };

  private dispatch() {
    if (!this.ready || this.executing) {
      return;
    }

    this.executing = (async () => {
      let next: Pending | null = null;
      // resuming has high priority
      if (this.pending.length) {
        next = this.pending.shift() as Pending;
        this.getLogger(next[0].workflowId).info(`pending execution (${next[0].id}) ready to process`);
      } else {
        const execution = (await this.db.getRepository('executions').findOne({
          filter: {
            status: EXECUTION_STATUS.QUEUEING,
            'workflow.id': {
              [Op.not]: null,
            },
          },
          appends: ['workflow'],
          sort: 'createdAt',
        })) as ExecutionModel;
        if (execution && execution.workflow.enabled) {
          this.getLogger(execution.workflowId).info(`execution (${execution.id}) fetched from db`);
          next = [execution];
        }
      }
      if (next) {
        await this.process(...next);
      }

      this.executing = null;

      if (next) {
        this.dispatch();
      }
    })();
  }

  private async process(execution: ExecutionModel, job?: JobModel) {
    if (execution.status === EXECUTION_STATUS.QUEUEING) {
      await execution.update({ status: EXECUTION_STATUS.STARTED });
    }

    const processor = this.createProcessor(execution);

    this.getLogger(execution.workflowId).info(`execution (${execution.id}) ${job ? 'resuming' : 'starting'}...`);

    try {
      await (job ? processor.resume(job) : processor.start());
      this.getLogger(execution.workflowId).info(
        `execution (${execution.id}) finished with status: ${execution.status}`,
      );
      if (execution.status && execution.workflow.options?.deleteExecutionOnStatus?.includes(execution.status)) {
        await execution.destroy();
      }
    } catch (err) {
      this.getLogger(execution.workflowId).error(`execution (${execution.id}) error: ${err.message}`, err);
    }
  }
}
