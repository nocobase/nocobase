/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';
import { randomUUID } from 'crypto';

import { Snowflake } from 'nodejs-snowflake';
import { Transaction, Transactionable } from 'sequelize';
import LRUCache from 'lru-cache';

import { FindOptions, Op } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import { Registry, uid } from '@nocobase/utils';
import { SequelizeCollectionManager } from '@nocobase/data-source-manager';
import { Logger, LoggerOptions } from '@nocobase/logger';

import Processor from './Processor';
import initActions from './actions';
import { EXECUTION_STATUS } from './constants';
import initFunctions, { CustomFunction } from './functions';
import Trigger from './triggers';
import CollectionTrigger from './triggers/CollectionTrigger';
import ScheduleTrigger from './triggers/ScheduleTrigger';
import { Instruction, InstructionInterface } from './instructions';
import CalculationInstruction from './instructions/CalculationInstruction';
import ConditionInstruction from './instructions/ConditionInstruction';
import EndInstruction from './instructions/EndInstruction';
import CreateInstruction from './instructions/CreateInstruction';
import DestroyInstruction from './instructions/DestroyInstruction';
import QueryInstruction from './instructions/QueryInstruction';
import UpdateInstruction from './instructions/UpdateInstruction';

import type { ExecutionModel, JobModel, WorkflowModel } from './types';
import WorkflowRepository from './repositories/WorkflowRepository';

type ID = number | string;

type Pending = [ExecutionModel, JobModel?];

export type EventOptions = {
  eventKey?: string;
  context?: any;
  deferred?: boolean;
  manually?: boolean;
  force?: boolean;
  stack?: Array<ID>;
  onTriggerFail?: Function;
  [key: string]: any;
} & Transactionable;

type CachedEvent = [WorkflowModel, any, EventOptions];

export default class PluginWorkflowServer extends Plugin {
  instructions: Registry<InstructionInterface> = new Registry();
  triggers: Registry<Trigger> = new Registry();
  functions: Registry<CustomFunction> = new Registry();
  enabledCache: Map<number, WorkflowModel> = new Map();
  snowflake: Snowflake;

  private ready = false;
  private executing: Promise<void> | null = null;
  private pending: Pending[] = [];
  private events: CachedEvent[] = [];
  private eventsCount = 0;

  private loggerCache: LRUCache<string, Logger>;
  private meter = null;
  private checker: NodeJS.Timeout = null;

  private onBeforeSave = async (instance: WorkflowModel, { transaction, cycling }) => {
    if (cycling) {
      return;
    }
    const Model = <typeof WorkflowModel>instance.constructor;

    if (!instance.key) {
      instance.set('key', uid());
    }

    if (instance.enabled) {
      instance.set('current', true);
    }

    const previous = await Model.findOne({
      where: {
        key: instance.key,
        current: true,
        id: {
          [Op.ne]: instance.id,
        },
      },
      transaction,
    });
    if (!previous) {
      instance.set('current', true);
    } else if (instance.current) {
      // NOTE: set to `null` but not `false` will not violate the unique index
      // @ts-ignore
      await previous.update(
        { enabled: false, current: null },
        {
          transaction,
          cycling: true,
        },
      );

      this.toggle(previous, false, { transaction });
    }
  };

  private onAfterCreate = async (model: WorkflowModel, { transaction }) => {
    const WorkflowStatsModel = this.db.getModel('workflowStats');
    let stats = await WorkflowStatsModel.findOne({
      where: { key: model.key },
      transaction,
    });
    if (!stats) {
      stats = await model.createStats({ executed: 0 }, { transaction });
    }
    model.stats = stats;
    model.versionStats = await model.createVersionStats({ id: model.id }, { transaction });
    if (model.enabled) {
      this.toggle(model, true, { transaction });
    }
  };

  private onAfterUpdate = async (model: WorkflowModel, { transaction }) => {
    model.stats = await model.getStats({ transaction });
    model.versionStats = await model.getVersionStats({ transaction });
    this.toggle(model, model.enabled, { transaction });
  };

  private onAfterDestroy = async (model: WorkflowModel, { transaction }) => {
    this.toggle(model, false, { transaction });

    const TaskRepo = this.db.getRepository('workflowTasks');
    await TaskRepo.destroy({
      filter: {
        workflowId: model.id,
      },
      transaction,
    });
  };

  // [Life Cycle]:
  //   * load all workflows in db
  //   * add all hooks for enabled workflows
  //   * add hooks for create/update[enabled]/delete workflow to add/remove specific hooks
  private onAfterStart = async () => {
    this.ready = true;

    const collection = this.db.getCollection('workflows');
    const workflows = await collection.repository.find({
      appends: ['versionStats'],
    });

    for (const workflow of workflows) {
      // NOTE: workflow stats may not be created in migration (for compatibility)
      if (workflow.current) {
        workflow.stats = await workflow.getStats();
        if (!workflow.stats) {
          workflow.stats = await workflow.createStats({ executed: 0 });
        }
      }
      // NOTE: workflow stats may not be created in migration (for compatibility)
      if (!workflow.versionStats) {
        workflow.versionStats = await workflow.createVersionStats({ executed: 0 });
      }

      if (workflow.enabled) {
        this.toggle(workflow, true, { silent: true });
      }
    }

    this.checker = setInterval(() => {
      this.getLogger('dispatcher').info(`(cycling) check for queueing executions`);
      this.dispatch();
    }, 300_000);

    this.app.on('workflow:dispatch', () => {
      this.app.logger.info('workflow:dispatch');
      this.dispatch();
    });

    // check for queueing executions
    this.getLogger('dispatcher').info('(starting) check for queueing executions');
    this.dispatch();

    this.ready = true;
  };

  private onBeforeStop = async () => {
    for (const workflow of this.enabledCache.values()) {
      this.toggle(workflow, false, { silent: true });
    }

    this.ready = false;
    if (this.events.length) {
      await this.prepare();
    }
    if (this.executing) {
      await this.executing;
    }

    if (this.checker) {
      clearInterval(this.checker);
    }
  };

  async handleSyncMessage(message) {
    if (message.type === 'statusChange') {
      if (message.enabled) {
        let workflow = this.enabledCache.get(message.workflowId);
        if (workflow) {
          await workflow.reload();
        } else {
          workflow = await this.db.getRepository('workflows').findOne({
            filterByTk: message.workflowId,
          });
        }
        if (workflow) {
          this.toggle(workflow, true, { silent: true });
        }
      } else {
        const workflow = this.enabledCache.get(message.workflowId);
        if (workflow) {
          this.toggle(workflow, false, { silent: true });
        }
      }
    }
  }

  /**
   * @experimental
   */
  getLogger(workflowId: ID = 'dispatcher'): Logger {
    const now = new Date();
    const date = `${now.getFullYear()}-${`0${now.getMonth() + 1}`.slice(-2)}-${`0${now.getDate()}`.slice(-2)}`;
    const key = `${date}-${workflowId}}`;
    if (this.loggerCache.has(key)) {
      return this.loggerCache.get(key);
    }

    const logger = this.createLogger({
      dirname: path.join('workflows', String(workflowId)),
      filename: '%DATE%.log',
    } as LoggerOptions);

    this.loggerCache.set(key, logger);

    return logger;
  }

  /**
   * @experimental
   * @param {WorkflowModel} workflow
   * @returns {boolean}
   */
  isWorkflowSync(workflow: WorkflowModel): boolean {
    const trigger = this.triggers.get(workflow.type);
    if (!trigger) {
      throw new Error(`invalid trigger type ${workflow.type} of workflow ${workflow.id}`);
    }
    return trigger.sync ?? workflow.sync;
  }

  public registerTrigger<T extends Trigger>(type: string, trigger: T | { new (p: Plugin): T }) {
    if (typeof trigger === 'function') {
      this.triggers.register(type, new trigger(this));
    } else if (trigger) {
      this.triggers.register(type, trigger);
    } else {
      throw new Error('invalid trigger type to register');
    }
  }

  public registerInstruction(
    type: string,
    instruction: InstructionInterface | { new (p: Plugin): InstructionInterface },
  ) {
    if (typeof instruction === 'function') {
      this.instructions.register(type, new instruction(this));
    } else if (instruction) {
      this.instructions.register(type, instruction);
    } else {
      throw new Error('invalid instruction type to register');
    }
  }

  private initTriggers<T extends Trigger>(more: { [key: string]: T | { new (p: Plugin): T } } = {}) {
    this.registerTrigger('collection', CollectionTrigger);
    this.registerTrigger('schedule', ScheduleTrigger);

    for (const [name, trigger] of Object.entries(more)) {
      this.registerTrigger(name, trigger);
    }
  }

  private initInstructions<T extends Instruction>(more: { [key: string]: T | { new (p: Plugin): T } } = {}) {
    this.registerInstruction('calculation', CalculationInstruction);
    this.registerInstruction('condition', ConditionInstruction);
    this.registerInstruction('end', EndInstruction);
    this.registerInstruction('create', CreateInstruction);
    this.registerInstruction('destroy', DestroyInstruction);
    this.registerInstruction('query', QueryInstruction);
    this.registerInstruction('update', UpdateInstruction);

    for (const [name, instruction] of Object.entries({ ...more })) {
      this.registerInstruction(name, instruction);
    }
  }

  async beforeLoad() {
    this.db.registerRepositories({
      WorkflowRepository,
    });

    const PluginRepo = this.db.getRepository<any>('applicationPlugins');
    const pluginRecord = await PluginRepo.findOne({
      filter: { name: this.name },
    });
    this.snowflake = new Snowflake({
      custom_epoch: pluginRecord?.createdAt.getTime(),
    });
  }

  /**
   * @internal
   */
  async load() {
    const { db, options } = this;

    initActions(this);
    this.initTriggers(options.triggers);
    this.initInstructions(options.instructions);
    initFunctions(this, options.functions);

    this.loggerCache = new LRUCache({
      max: 20,
      updateAgeOnGet: true,
      dispose(logger) {
        (<Logger>logger).end();
      },
    });

    this.meter = this.app.telemetry.metric.getMeter();
    const counter = this.meter.createObservableGauge('workflow.events.counter');
    counter.addCallback((result) => {
      result.observe(this.eventsCount);
    });

    this.app.acl.registerSnippet({
      name: `pm.${this.name}.workflows`,
      actions: [
        'workflows:*',
        'workflows.nodes:*',
        'executions:list',
        'executions:get',
        'executions:cancel',
        'executions:destroy',
        'flow_nodes:update',
        'flow_nodes:destroy',
        'flow_nodes:test',
        'jobs:get',
        'workflowCategories:*',
      ],
    });

    this.app.acl.registerSnippet({
      name: 'ui.workflows',
      actions: ['workflows:list'],
    });

    this.app.acl.allow('userWorkflowTasks', 'listMine', 'loggedIn');
    this.app.acl.allow('*', ['trigger'], 'loggedIn');

    db.on('workflows.beforeSave', this.onBeforeSave);
    db.on('workflows.afterCreate', this.onAfterCreate);
    db.on('workflows.afterUpdate', this.onAfterUpdate);
    db.on('workflows.afterDestroy', this.onAfterDestroy);

    this.app.on('afterStart', this.onAfterStart);
    this.app.on('beforeStop', this.onBeforeStop);
  }

  private toggle(
    workflow: WorkflowModel,
    enable?: boolean,
    { silent, transaction }: { silent?: boolean } & Transactionable = {},
  ) {
    const type = workflow.get('type');
    const trigger = this.triggers.get(type);
    if (!trigger) {
      this.getLogger(workflow.id).error(`trigger type ${workflow.type} of workflow ${workflow.id} is not implemented`);
      return;
    }
    const next = enable ?? workflow.get('enabled');
    if (next) {
      // NOTE: remove previous listener if config updated
      const prev = workflow.previous();
      if (prev.config) {
        trigger.off({ ...workflow.get(), ...prev });
        this.getLogger(workflow.id).info(`toggle OFF workflow ${workflow.id} based on configuration before updated`);
      }
      trigger.on(workflow);
      this.getLogger(workflow.id).info(`toggle ON workflow ${workflow.id}`);

      this.enabledCache.set(workflow.id, workflow);
    } else {
      trigger.off(workflow);
      this.getLogger(workflow.id).info(`toggle OFF workflow ${workflow.id}`);

      this.enabledCache.delete(workflow.id);
    }
    if (!silent) {
      this.sendSyncMessage(
        {
          type: 'statusChange',
          workflowId: workflow.id,
          enabled: next,
        },
        { transaction },
      );
    }
  }

  public trigger(
    workflow: WorkflowModel,
    context: object,
    options: EventOptions = {},
  ): void | Promise<Processor | null> {
    const logger = this.getLogger(workflow.id);
    if (!this.ready) {
      logger.warn(`app is not ready, event of workflow ${workflow.id} will be ignored`);
      logger.debug(`ignored event data:`, context);
      return;
    }
    if (!options.force && !options.manually && !workflow.enabled) {
      logger.warn(`workflow ${workflow.id} is not enabled, event will be ignored`);
      return;
    }
    const duplicated = this.events.find(([w, c, { eventKey }]) => {
      if (eventKey && options.eventKey) {
        return eventKey === options.eventKey;
      }
    });
    if (duplicated) {
      logger.warn(`event of workflow ${workflow.id} is duplicated (${options.eventKey}), event will be ignored`);
      return;
    }
    // `null` means not to trigger
    if (context == null) {
      logger.warn(`workflow ${workflow.id} event data context is null, event will be ignored`);
      return;
    }

    if (options.manually || this.isWorkflowSync(workflow)) {
      return this.triggerSync(workflow, context, options);
    }

    const { transaction, ...rest } = options;
    this.events.push([workflow, context, rest]);
    this.eventsCount = this.events.length;

    logger.info(`new event triggered, now events: ${this.events.length}`);
    logger.debug(`event data:`, { context });

    if (this.events.length > 1) {
      logger.info(`new event is pending to be prepared after previous preparation is finished`);
      return;
    }

    // NOTE: no await for quick return
    setImmediate(this.prepare);
  }

  private async triggerSync(
    workflow: WorkflowModel,
    context: object,
    { deferred, ...options }: EventOptions = {},
  ): Promise<Processor | null> {
    let execution;
    try {
      execution = await this.createExecution(workflow, context, options);
    } catch (err) {
      this.getLogger(workflow.id).error(`creating execution failed: ${err.message}`, err);
      return null;
    }

    try {
      return this.process(execution, null, options);
    } catch (err) {
      this.getLogger(execution.workflowId).error(`execution (${execution.id}) error: ${err.message}`, err);
    }
    return null;
  }

  public async resume(job) {
    if (!job.execution) {
      job.execution = await job.getExecution();
    }
    this.getLogger(job.execution.workflowId).info(
      `execution (${job.execution.id}) resuming from job (${job.id}) added to pending list`,
    );
    this.pending.push([job.execution, job]);
    if (this.executing) {
      await this.executing;
    }
    this.dispatch();
  }

  /**
   * Start a deferred execution
   * @experimental
   */
  public async start(execution: ExecutionModel) {
    if (execution.status !== EXECUTION_STATUS.STARTED) {
      return;
    }
    this.getLogger(execution.workflowId).info(`starting deferred execution (${execution.id})`);
    this.pending.push([execution]);
    if (this.executing) {
      await this.executing;
    }
    this.dispatch();
  }

  private async validateEvent(workflow: WorkflowModel, context: any, options: EventOptions) {
    const trigger = this.triggers.get(workflow.type);
    const triggerValid = await trigger.validateEvent(workflow, context, options);
    if (!triggerValid) {
      return false;
    }

    const { stack } = options;
    let valid = true;
    if (stack?.length > 0) {
      const existed = await workflow.countExecutions({
        where: {
          id: stack,
        },
        transaction: options.transaction,
      });

      const limitCount = workflow.options.stackLimit || 1;
      if (existed >= limitCount) {
        this.getLogger(workflow.id).warn(
          `workflow ${workflow.id} has already been triggered in stacks executions (${stack}), and max call coont is ${limitCount}, newly triggering will be skipped.`,
        );

        valid = false;
      }
    }
    return valid;
  }
  private async createExecution(
    workflow: WorkflowModel,
    context,
    options: EventOptions,
  ): Promise<ExecutionModel | null> {
    const { deferred } = options;
    const transaction = await this.useDataSourceTransaction('main', options.transaction, true);
    const sameTransaction = options.transaction === transaction;
    const valid = await this.validateEvent(workflow, context, { ...options, transaction });
    if (!valid) {
      if (!sameTransaction) {
        await transaction.commit();
      }
      options.onTriggerFail?.(workflow, context, options);
      return Promise.reject(new Error('event is not valid'));
    }

    let execution: ExecutionModel;
    try {
      execution = await workflow.createExecution(
        {
          context,
          key: workflow.key,
          eventKey: options.eventKey ?? randomUUID(),
          stack: options.stack,
          status: deferred ? EXECUTION_STATUS.STARTED : EXECUTION_STATUS.QUEUEING,
        },
        { transaction },
      );
    } catch (err) {
      if (!sameTransaction) {
        await transaction.rollback();
      }
      throw err;
    }

    this.getLogger(workflow.id).info(`execution of workflow ${workflow.id} created as ${execution.id}`);

    if (!workflow.stats) {
      workflow.stats = await workflow.getStats({ transaction });
    }
    await workflow.stats.increment('executed', { transaction });
    // NOTE: https://sequelize.org/api/v6/class/src/model.js~model#instance-method-increment
    if (this.db.options.dialect !== 'postgres') {
      await workflow.stats.reload({ transaction });
    }
    if (!workflow.versionStats) {
      workflow.versionStats = await workflow.getVersionStats({ transaction });
    }
    await workflow.versionStats.increment('executed', { transaction });
    if (this.db.options.dialect !== 'postgres') {
      await workflow.versionStats.reload({ transaction });
    }

    if (!sameTransaction) {
      await transaction.commit();
    }

    execution.workflow = workflow;

    return execution;
  }

  private prepare = async () => {
    if (this.executing && this.db.options.dialect === 'sqlite') {
      await this.executing;
    }

    const event = this.events.shift();
    this.eventsCount = this.events.length;
    if (!event) {
      this.getLogger('dispatcher').info(`events queue is empty, no need to prepare`);
      return;
    }

    const logger = this.getLogger(event[0].id);
    logger.info(`preparing execution for event`);

    try {
      const execution = await this.createExecution(...event);
      // NOTE: cache first execution for most cases
      if (execution?.status === EXECUTION_STATUS.QUEUEING && !this.executing && !this.pending.length) {
        this.pending.push([execution]);
      }
    } catch (error) {
      logger.error(`failed to create execution:`, { error });
      // this.events.push(event); // NOTE: retry will cause infinite loop
    }

    if (this.events.length) {
      await this.prepare();
    } else {
      this.getLogger('dispatcher').info('no more events need to be prepared, dispatching...');
      if (this.executing) {
        await this.executing;
      }
      this.dispatch();
    }
  };

  private dispatch() {
    if (!this.ready) {
      this.getLogger('dispatcher').warn(`app is not ready, new dispatching will be ignored`);
      return;
    }

    if (this.executing) {
      this.getLogger('dispatcher').warn(`workflow executing is not finished, new dispatching will be ignored`);
      return;
    }

    if (this.events.length) {
      return this.prepare();
    }

    this.executing = (async () => {
      let next: Pending | null = null;
      // resuming has high priority
      if (this.pending.length) {
        next = this.pending.shift() as Pending;
        this.getLogger(next[0].workflowId).info(`pending execution (${next[0].id}) ready to process`);
      } else {
        try {
          await this.db.sequelize.transaction(
            {
              isolationLevel:
                this.db.options.dialect === 'sqlite' ? [][0] : Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
            },
            async (transaction) => {
              const execution = (await this.db.getRepository('executions').findOne({
                filter: {
                  status: EXECUTION_STATUS.QUEUEING,
                  'workflow.enabled': true,
                },
                sort: 'id',
                transaction,
              })) as ExecutionModel;
              if (execution) {
                this.getLogger(execution.workflowId).info(`execution (${execution.id}) fetched from db`);
                await execution.update(
                  {
                    status: EXECUTION_STATUS.STARTED,
                  },
                  { transaction },
                );
                execution.workflow = this.enabledCache.get(execution.workflowId);
                next = [execution];
              } else {
                this.getLogger('dispatcher').info(`no execution in db queued to process`);
              }
            },
          );
        } catch (error) {
          this.getLogger('dispatcher').error(`fetching execution from db failed: ${error.message}`, { error });
        }
      }
      if (next) {
        await this.process(...next);
      }
      this.executing = null;

      if (next || this.pending.length) {
        this.getLogger('dispatcher').info(`last process finished, will do another dispatch`);
        this.dispatch();
      }
    })();
  }

  public createProcessor(execution: ExecutionModel, options = {}): Processor {
    return new Processor(execution, { ...options, plugin: this });
  }

  private async process(execution: ExecutionModel, job?: JobModel, options: Transactionable = {}): Promise<Processor> {
    const logger = this.getLogger(execution.workflowId);
    if (execution.status === EXECUTION_STATUS.QUEUEING) {
      const transaction = await this.useDataSourceTransaction('main', options.transaction);
      await execution.update({ status: EXECUTION_STATUS.STARTED }, { transaction });
      logger.info(`queueing execution (${execution.id}) from pending list updated to started`);
    }
    const processor = this.createProcessor(execution, options);

    logger.info(`execution (${execution.id}) ${job ? 'resuming' : 'starting'}...`);

    // this.emit('beforeProcess', processor);

    try {
      await (job ? processor.resume(job) : processor.start());
      logger.info(`execution (${execution.id}) finished with status: ${execution.status}`, { execution });
      if (execution.status && execution.workflow.options?.deleteExecutionOnStatus?.includes(execution.status)) {
        await execution.destroy({ transaction: processor.mainTransaction });
      }
    } catch (err) {
      logger.error(`execution (${execution.id}) error: ${err.message}`, err);
    }

    // this.emit('afterProcess', processor);

    return processor;
  }

  async execute(workflow: WorkflowModel, values, options: EventOptions = {}) {
    const trigger = this.triggers.get(workflow.type);
    if (!trigger) {
      throw new Error(`trigger type "${workflow.type}" of workflow ${workflow.id} is not registered`);
    }
    if (!trigger.execute) {
      throw new Error(`"execute" method of trigger ${workflow.type} is not implemented`);
    }
    return trigger.execute(workflow, values, options);
  }

  /**
   * @experimental
   * @param {string} dataSourceName
   * @param {Transaction} transaction
   * @param {boolean} create
   * @returns {Trasaction}
   */
  useDataSourceTransaction(dataSourceName = 'main', transaction, create = false) {
    const { db } = this.app.dataSourceManager.dataSources.get(dataSourceName)
      .collectionManager as SequelizeCollectionManager;
    if (!db) {
      return;
    }
    if (db.sequelize === transaction?.sequelize) {
      return transaction;
    }
    if (create) {
      return db.sequelize.transaction();
    }
  }

  /**
   * @experimental
   */
  public async updateTasksStats(
    userId: number,
    type: string,
    stats: { pending: number; all: number } = { pending: 0, all: 0 },
    { transaction }: Transactionable,
  ) {
    const { db } = this.app;
    const repository = db.getRepository('userWorkflowTasks');
    let record = await repository.findOne({
      filter: {
        userId,
        type,
      },
      transaction,
    });
    if (record) {
      await record.update(
        {
          stats,
        },
        { transaction },
      );
    } else {
      record = await repository.create({
        values: {
          userId,
          type,
          stats,
        },
        transaction,
      });
    }

    // NOTE:
    // 1. `ws` not works in backend test cases for now.
    // 2. `userId` here for compatibility of no user approvals (deprecated).
    if (userId) {
      this.app.emit('ws:sendToTag', {
        tagKey: 'userId',
        tagValue: `${userId}`,
        message: { type: 'workflow:tasks:updated', payload: record.get() },
      });
    }
  }
}
