/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';

import { Snowflake } from 'nodejs-snowflake';
import { Transactionable } from 'sequelize';
import LRUCache from 'lru-cache';

import { Op } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import { Registry, uid } from '@nocobase/utils';
import { SequelizeCollectionManager } from '@nocobase/data-source-manager';
import { Logger, LoggerOptions } from '@nocobase/logger';

import Dispatcher, { EventOptions } from './Dispatcher';
import Processor from './Processor';
import initActions from './actions';
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

import type { ExecutionModel, WorkflowModel } from './types';
import WorkflowRepository from './repositories/WorkflowRepository';

type ID = number | string;

export const WORKER_JOB_WORKFLOW_PROCESS = 'workflow:process';

export default class PluginWorkflowServer extends Plugin {
  instructions: Registry<InstructionInterface> = new Registry();
  triggers: Registry<Trigger> = new Registry();
  functions: Registry<CustomFunction> = new Registry();
  enabledCache: Map<number, WorkflowModel> = new Map();
  snowflake: Snowflake;

  private dispatcher = new Dispatcher(this);

  public get channelPendingExecution() {
    return `${this.name}.pendingExecution`;
  }

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
      this.getLogger('dispatcher').debug(`(cycling) check for queueing executions`);
      this.dispatcher.dispatch();
    }, 300_000);

    this.app.on('workflow:dispatch', () => {
      this.app.logger.info('workflow:dispatch');
      this.dispatcher.dispatch();
    });

    this.dispatcher.setReady(true);

    // check for queueing executions
    this.getLogger('dispatcher').info('(starting) check for queueing executions');
    this.dispatcher.dispatch();
  };

  private onBeforeStop = async () => {
    if (this.checker) {
      clearInterval(this.checker);
    }

    await this.dispatcher.beforeStop();

    this.app.logger.info(`stopping workflow plugin before app (${this.app.name}) shutdown...`);
    for (const workflow of this.enabledCache.values()) {
      this.toggle(workflow, false, { silent: true });
    }

    this.app.eventQueue.unsubscribe(this.channelPendingExecution);

    this.loggerCache.clear();
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

  public serving() {
    return this.app.serving(WORKER_JOB_WORKFLOW_PROCESS);
  }

  /**
   * @experimental
   */
  getLogger(workflowId: ID = 'dispatcher'): Logger {
    const now = new Date();
    const date = `${now.getFullYear()}-${`0${now.getMonth() + 1}`.slice(-2)}-${`0${now.getDate()}`.slice(-2)}`;
    const key = `${date}-${workflowId}`;
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
        const cachedLogger = logger as Logger | undefined;
        if (!cachedLogger) {
          return;
        }

        cachedLogger.silent = true;
        if (typeof cachedLogger.close === 'function') {
          cachedLogger.close();
        }
      },
    });

    this.meter = this.app.telemetry.metric.getMeter();
    const counter = this.meter.createObservableGauge('workflow.events.counter');
    counter.addCallback((result) => {
      result.observe(this.dispatcher.getEventsCount());
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

    this.app.eventQueue.subscribe(this.channelPendingExecution, {
      idle: () => this.serving() && this.dispatcher.idle,
      process: this.dispatcher.onQueueExecution,
    });
  }

  private toggle(
    workflow: WorkflowModel,
    enable?: boolean,
    { silent, transaction }: { silent?: boolean } & Transactionable = {},
  ) {
    const type = workflow.get('type');
    const trigger = this.triggers.get(type);
    if (!trigger) {
      this.getLogger(workflow.id).error(`trigger type ${workflow.type} of workflow ${workflow.id} is not implemented`, {
        workflowId: workflow.id,
      });
      return;
    }
    const next = enable ?? workflow.get('enabled');
    if (next) {
      // NOTE: remove previous listener if config updated
      const prev = workflow.previous();
      if (prev.config) {
        trigger.off({ ...workflow.get(), ...prev });
        this.getLogger(workflow.id).info(`toggle OFF workflow ${workflow.id} based on configuration before updated`, {
          workflowId: workflow.id,
        });
      }
      trigger.on(workflow);
      this.getLogger(workflow.id).info(`toggle ON workflow ${workflow.id}`, {
        workflowId: workflow.id,
      });

      this.enabledCache.set(workflow.id, workflow);
    } else {
      trigger.off(workflow);
      this.getLogger(workflow.id).info(`toggle OFF workflow ${workflow.id}`, {
        workflowId: workflow.id,
      });

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
    return this.dispatcher.trigger(workflow, context, options);
  }

  public async run(pending: Parameters<Dispatcher['run']>[0]): Promise<void> {
    return this.dispatcher.run(pending);
  }

  public async resume(job) {
    return this.dispatcher.resume(job);
  }

  /**
   * Start a deferred execution
   * @experimental
   */
  public async start(execution: ExecutionModel) {
    return this.dispatcher.start(execution);
  }

  public createProcessor(execution: ExecutionModel, options = {}): Processor {
    return new Processor(execution, { ...options, plugin: this });
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
      this.app.emit('ws:sendToUser', {
        userId,
        message: { type: 'workflow:tasks:updated', payload: record.get() },
      });
    }
  }
}
