/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { Transaction, Transactionable } from 'sequelize';

import type { QueueEventOptions } from '@nocobase/server';

import Processor from './Processor';
import { EXECUTION_STATUS } from './constants';
import type { ExecutionModel, JobModel, WorkflowModel } from './types';
import type PluginWorkflowServer from './Plugin';
import { WORKER_JOB_WORKFLOW_PROCESS } from './Plugin';

const EXECUTION_ACQUIRE_MAX_ATTEMPTS = 5;

type AcquireRetryLogger = Pick<ReturnType<PluginWorkflowServer['getLogger']>, 'warn'>;

type Pending = { execution: ExecutionModel; job?: JobModel; loaded?: boolean };

type CachedEvent = [WorkflowModel, any, EventOptions];

export type EventOptions = {
  eventKey?: string;
  context?: any;
  deferred?: boolean;
  manually?: boolean;
  force?: boolean;
  stack?: Array<number | string>;
  onTriggerFail?: (
    workflow: WorkflowModel,
    context: object,
    options: EventOptions,
    error?: unknown,
  ) => void | Promise<void>;
  [key: string]: any;
} & Transactionable;

export default class Dispatcher {
  private ready = false;
  private executing: Promise<any> | null = null;
  private pending: Pending[] = [];
  private events: CachedEvent[] = [];
  private eventsCount = 0;

  get idle() {
    return this.ready && !this.executing && !this.pending.length && !this.events.length;
  }

  constructor(private readonly plugin: PluginWorkflowServer) {
    this.prepare = this.prepare.bind(this);
  }

  public readonly onQueueExecution: QueueEventOptions['process'] = async (event) => {
    const ExecutionRepo = this.plugin.db.getRepository('executions');
    const execution: ExecutionModel = await ExecutionRepo.findOne({
      filterByTk: event.executionId,
    });
    if (!execution || execution.dispatched) {
      this.plugin
        .getLogger('dispatcher')
        .info(`execution (${event.executionId}) from queue not found or not in queueing status, skip`);
      return;
    }
    this.plugin
      .getLogger(execution.workflowId)
      .info(`execution (${execution.id}) received from queue, adding to pending list`);
    this.run({ execution });
  };

  public setReady(ready: boolean) {
    this.ready = ready;
  }

  public getEventsCount() {
    return this.eventsCount;
  }

  public trigger(
    workflow: WorkflowModel,
    context: object,
    options: EventOptions = {},
  ): void | Promise<Processor | null | void> {
    const logger = this.plugin.getLogger(workflow.id);
    if (!this.ready) {
      logger.warn(`app is not ready, event of workflow ${workflow.id} will be ignored`);
      logger.debug(`ignored event data:`, context);
      return this.handleTriggerFail(workflow, context, options, new Error('app is not ready'));
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
    if (context == null) {
      logger.warn(`workflow ${workflow.id} event data context is null, event will be ignored`);
      return this.handleTriggerFail(workflow, context, options, new Error('event context is null'));
    }

    if (options.manually || this.plugin.isWorkflowSync(workflow)) {
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

    setImmediate(this.prepare);
  }

  public async resume(job) {
    let { execution } = job;
    if (!execution) {
      execution = await job.getExecution();
    }
    this.plugin
      .getLogger(execution.workflowId)
      .info(`execution (${execution.id}) resuming from job (${job.id}) added to pending list`);

    this.run({ execution, job, loaded: true });
  }

  public async start(execution: ExecutionModel) {
    if (execution.status) {
      return;
    }
    this.plugin.getLogger(execution.workflowId).info(`starting deferred execution (${execution.id})`);

    this.run({ execution, loaded: true });
  }

  public async beforeStop() {
    this.ready = false;
    if (this.events.length) {
      await this.prepare();
    }
    if (this.executing) {
      await this.executing;
    }
  }

  public dispatch() {
    if (!this.ready) {
      this.plugin.getLogger('dispatcher').warn(`app is not ready, new dispatching will be ignored`);
      return;
    }

    if (this.executing) {
      this.plugin.getLogger('dispatcher').warn(`workflow executing is not finished, new dispatching will be ignored`);
      return;
    }

    if (this.events.length) {
      return this.prepare();
    }

    this.executing = (async () => {
      let next: [ExecutionModel, JobModel?] | null = null;
      let execution: ExecutionModel | null = null;
      if (this.pending.length) {
        const pending = this.pending.shift() as Pending;
        execution = pending.loaded ? pending.execution : await this.acquirePendingExecution(pending.execution);
        if (execution) {
          next = [execution, pending.job];
          this.plugin.getLogger(next[0].workflowId).info(`pending execution (${next[0].id}) ready to process`);
        }
      } else {
        if (this.plugin.serving()) {
          execution = await this.acquireQueueingExecution();
          if (execution) {
            next = [execution];
          }
        } else {
          this.plugin
            .getLogger('dispatcher')
            .warn(`${WORKER_JOB_WORKFLOW_PROCESS} is not serving on this instance, new dispatching will be ignored`);
        }
      }
      if (next) {
        await this.process(...next);
      }
      setImmediate(() => {
        this.executing = null;

        if (next || this.pending.length) {
          this.plugin.getLogger('dispatcher').debug(`last process finished, will do another dispatch`);
          this.dispatch();
        }
      });
    })();
  }

  public async run(pending: Pending): Promise<void> {
    this.pending.push(pending);

    this.dispatch();
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
      this.plugin.getLogger(workflow.id).error(`creating execution failed: ${err.message}`, err);
      return null;
    }

    try {
      return this.process(execution, null, options);
    } catch (err) {
      this.plugin.getLogger(execution.workflowId).error(`execution (${execution.id}) error: ${err.message}`, err);
    }
    return null;
  }

  private async validateEvent(workflow: WorkflowModel, context: any, options: EventOptions) {
    const trigger = this.plugin.triggers.get(workflow.type);
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
        this.plugin
          .getLogger(workflow.id)
          .warn(
            `workflow ${workflow.id} has already been triggered in stacks executions (${stack}), and max call coont is ${limitCount}, newly triggering will be skipped.`,
          );

        valid = false;
      }
    }
    return valid;
  }

  private async handleTriggerFail(workflow: WorkflowModel, context: object, options: EventOptions, error?: unknown) {
    try {
      await options.onTriggerFail?.(workflow, context, options, error);
    } catch (triggerFailError) {
      this.plugin.getLogger(workflow.id).error(`trigger failure callback failed`, { error: triggerFailError });
    }
  }

  private async createExecution(
    workflow: WorkflowModel,
    context,
    options: EventOptions,
  ): Promise<ExecutionModel | null> {
    const { deferred } = options;
    const transaction = await this.plugin.useDataSourceTransaction('main', options.transaction, true);
    const sameTransaction = options.transaction === transaction;
    let valid: boolean;
    try {
      valid = await this.validateEvent(workflow, context, { ...options, transaction });
    } catch (error) {
      if (!sameTransaction) {
        await transaction.rollback();
      }
      await this.handleTriggerFail(workflow, context, options, error);
      throw error;
    }
    if (!valid) {
      const error = new Error('event is not valid');
      if (!sameTransaction) {
        await transaction.commit();
      }
      await this.handleTriggerFail(workflow, context, options, error);
      throw error;
    }

    let execution: ExecutionModel;
    try {
      execution = await workflow.createExecution(
        {
          context,
          key: workflow.key,
          eventKey: options.eventKey ?? randomUUID(),
          stack: options.stack,
          dispatched: deferred ?? false,
          status: deferred ? EXECUTION_STATUS.STARTED : EXECUTION_STATUS.QUEUEING,
          manually: options.manually,
        },
        { transaction },
      );
    } catch (err) {
      if (!sameTransaction) {
        await transaction.rollback();
      }
      await this.handleTriggerFail(workflow, context, options, err);
      throw err;
    }

    this.plugin.getLogger(workflow.id).info(`execution of workflow ${workflow.id} created as ${execution.id}`);

    if (!workflow.stats) {
      workflow.stats = await workflow.getStats({ transaction });
    }
    await workflow.stats.increment('executed', { transaction });
    // NOTE: https://sequelize.org/api/v6/class/src/model.js~model#instance-method-increment
    if (this.plugin.db.options.dialect !== 'postgres') {
      await workflow.stats.reload({ transaction });
    }
    if (!workflow.versionStats) {
      workflow.versionStats = await workflow.getVersionStats({ transaction });
    }
    await workflow.versionStats.increment('executed', { transaction });
    if (this.plugin.db.options.dialect !== 'postgres') {
      await workflow.versionStats.reload({ transaction });
    }

    if (!sameTransaction) {
      await transaction.commit();
    }

    execution.workflow = workflow;

    return execution;
  }

  private prepare = async () => {
    if (this.executing && this.plugin.db.options.dialect === 'sqlite') {
      await this.executing;
    }

    const event = this.events.shift();
    this.eventsCount = this.events.length;
    if (!event) {
      this.plugin.getLogger('dispatcher').info(`events queue is empty, no need to prepare`);
      return;
    }

    const logger = this.plugin.getLogger(event[0].id);
    logger.info(`preparing execution for event`);

    try {
      const execution = await this.createExecution(...event);
      // NOTE: cache first execution for most cases
      if (!execution?.dispatched) {
        if (this.plugin.serving() && !this.executing && !this.pending.length) {
          logger.info(`local pending list is empty, adding execution (${execution.id}) to pending list`);
          this.pending.push({ execution });
        } else {
          logger.info(
            `instance is not serving as worker or local pending list is not empty, sending execution (${execution.id}) to queue`,
          );
          try {
            await this.plugin.app.eventQueue.publish(this.plugin.channelPendingExecution, {
              executionId: execution.id,
            });
          } catch (qErr) {
            logger.error(`publishing execution (${execution.id}) to queue failed:`, { error: qErr });
          }
        }
      }
    } catch (error) {
      logger.error(`failed to create execution:`, { error });
    }

    if (this.events.length) {
      await this.prepare();
    } else {
      this.plugin.getLogger('dispatcher').info('no more events need to be prepared, dispatching...');
      if (this.executing) {
        await this.executing;
      }
      this.dispatch();
    }
  };

  private async acquirePendingExecution(execution: ExecutionModel): Promise<ExecutionModel | null> {
    const logger = this.plugin.getLogger(execution.workflowId);
    const isolationLevel =
      this.plugin.db.options.dialect === 'sqlite' ? [][0] : Transaction.ISOLATION_LEVELS.REPEATABLE_READ;
    let fetched: ExecutionModel | null = null;
    try {
      await this.acquireWithRetry(
        async () => {
          await this.plugin.db.sequelize.transaction({ isolationLevel }, async (transaction) => {
            const ExecutionModelClass = this.plugin.db.getModel('executions');
            const [affected] = await ExecutionModelClass.update(
              { dispatched: true, status: EXECUTION_STATUS.STARTED },
              {
                where: {
                  id: execution.id,
                  dispatched: false,
                },
                transaction,
              },
            );
            if (!affected) {
              return;
            }
            await execution.reload({ transaction });
            fetched = execution;
          });
          return false;
        },
        {
          logger,
          conflictMessage: `acquiring pending execution (${execution.id}) conflicted with another worker, retrying`,
          maxAttemptsMessage: `acquiring pending execution (${execution.id}) reached max retry attempts`,
        },
      );
    } catch (error) {
      fetched = null;
      logger.error(`acquiring pending execution failed: ${error.message}`, { error });
    }
    return fetched;
  }

  private async acquireQueueingExecution(): Promise<ExecutionModel | null> {
    const isolationLevel =
      this.plugin.db.options.dialect === 'sqlite' ? [][0] : Transaction.ISOLATION_LEVELS.REPEATABLE_READ;
    let fetched: ExecutionModel | null = null;
    try {
      await this.acquireWithRetry(
        async () => {
          let shouldRetry = false;
          await this.plugin.db.sequelize.transaction(
            {
              isolationLevel,
            },
            async (transaction) => {
              const execution = (await this.plugin.db.getRepository('executions').findOne({
                filter: {
                  dispatched: false,
                  'workflow.enabled': true,
                },
                sort: 'id',
                transaction,
              })) as ExecutionModel;
              if (!execution) {
                this.plugin.getLogger('dispatcher').debug(`no execution in db queued to process`);
                return;
              }

              const ExecutionModelClass = this.plugin.db.getModel('executions');
              const [affected] = await ExecutionModelClass.update(
                {
                  dispatched: true,
                  status: EXECUTION_STATUS.STARTED,
                },
                {
                  where: {
                    id: execution.id,
                    dispatched: false,
                  },
                  transaction,
                },
              );
              if (!affected) {
                shouldRetry = true;
                this.plugin
                  .getLogger(execution.workflowId)
                  .warn(`execution (${execution.id}) was already acquired by another worker, retrying`);
                return;
              }

              this.plugin.getLogger(execution.workflowId).info(`execution (${execution.id}) fetched from db`);
              await execution.reload({ transaction });
              execution.workflow = this.plugin.enabledCache.get(execution.workflowId);
              fetched = execution;
            },
          );
          return shouldRetry;
        },
        {
          logger: this.plugin.getLogger('dispatcher'),
          conflictMessage: `acquiring execution conflicted with another worker, retrying`,
          maxAttemptsMessage: `acquiring execution reached max retry attempts, will retry on next dispatch`,
        },
      );
    } catch (error) {
      this.plugin.getLogger('dispatcher').error(`fetching execution from db failed: ${error.message}`, { error });
    }
    return fetched;
  }

  private async acquireWithRetry(
    acquire: () => Promise<boolean>,
    options: {
      logger: AcquireRetryLogger;
      conflictMessage: string;
      maxAttemptsMessage: string;
    },
  ) {
    for (let attempt = 1; attempt <= EXECUTION_ACQUIRE_MAX_ATTEMPTS; attempt++) {
      let shouldRetry = false;
      try {
        shouldRetry = await acquire();
      } catch (error) {
        if (!this.isConcurrentAcquireError(error)) {
          throw error;
        }
        shouldRetry = true;
        options.logger.warn(options.conflictMessage, { error });
      }
      if (!shouldRetry) {
        break;
      }
      if (attempt >= EXECUTION_ACQUIRE_MAX_ATTEMPTS) {
        options.logger.warn(options.maxAttemptsMessage);
        break;
      }
    }
  }

  private isConcurrentAcquireError(error: unknown) {
    if (!(error instanceof Error)) {
      return false;
    }
    const databaseError = error as Error & {
      parent?: { code?: string; errno?: number };
      original?: { code?: string; errno?: number };
    };
    const code = databaseError.parent?.code || databaseError.original?.code;
    const errno = databaseError.parent?.errno || databaseError.original?.errno;

    return code === '40001' || code === '40P01' || code === 'ER_LOCK_DEADLOCK' || errno === 1205 || errno === 1213;
  }

  private async process(execution: ExecutionModel, job?: JobModel, options: Transactionable = {}): Promise<Processor> {
    const logger = this.plugin.getLogger(execution.workflowId);
    if (!execution.dispatched) {
      const transaction = await this.plugin.useDataSourceTransaction('main', options.transaction);
      await execution.update({ dispatched: true, status: EXECUTION_STATUS.STARTED }, { transaction });
      logger.info(`execution (${execution.id}) from pending list updated to started`);
    }
    const processor = this.plugin.createProcessor(execution, options);

    logger.info(`execution (${execution.id}) ${job ? 'resuming' : 'starting'}...`);

    try {
      await (job ? processor.resume(job) : processor.start());
      logger.info(`execution (${execution.id}) finished with status: ${execution.status}`, { execution });
      if (execution.status && execution.workflow.options?.deleteExecutionOnStatus?.includes(execution.status)) {
        await execution.destroy({ transaction: processor.mainTransaction });
      }
    } catch (err) {
      logger.error(`execution (${execution.id}) error: ${err.message}`, err);
    }

    return processor;
  }
}
