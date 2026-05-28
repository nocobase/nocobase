/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'node:crypto';

import { Transaction, Transactionable } from 'sequelize';

import type { QueueEventOptions } from '@nocobase/server';

import Processor, { ProcessorRerunOptions } from './Processor';
import { EXECUTION_STATUS } from './constants';
import type { ExecutionModel, JobModel, WorkflowModel } from './types';
import type PluginWorkflowServer from './Plugin';
import { WORKER_JOB_WORKFLOW_PROCESS } from './Plugin';

type ExecutionPlan = [ExecutionModel, JobModel?, ProcessorRerunOptions?];
type Pending = {
  execution: ExecutionModel;
  job?: JobModel;
  loaded?: boolean;
  rerun?: ProcessorRerunOptions;
};

type RunOptions = { dispatch?: boolean };

type CachedEvent = [WorkflowModel, any, EventOptions];

export type EventOptions = {
  eventKey?: string;
  context?: any;
  deferred?: boolean;
  manually?: boolean;
  force?: boolean;
  stack?: Array<number | string>;
  parentExecutionId?: number | string;
  onTriggerFail?: Function;
  [key: string]: any;
} & Transactionable;

export default class Dispatcher {
  private ready = false;
  private executing: Promise<any> | null = null;
  private saving: Promise<any> | null = null;
  private pending: Pending[] = [];
  private events: CachedEvent[] = [];
  private eventsCount = 0;

  get idle() {
    return this.ready && !this.executing && !this.saving && !this.pending.length && !this.events.length;
  }

  constructor(private readonly plugin: PluginWorkflowServer) {}

  public readonly onQueueExecution: QueueEventOptions['process'] = async (event) => {
    const ExecutionRepo = this.plugin.db.getRepository('executions');
    const execution: ExecutionModel = await ExecutionRepo.findOne({
      filterByTk: event.executionId,
    });
    if (!execution || execution.dispatched) {
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
  ): void | Promise<Processor | null> {
    const logger = this.plugin.getLogger(workflow.id);
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
    if (context == null) {
      logger.warn(`workflow ${workflow.id} event data context is null, event will be ignored`);
      return;
    }

    if (options.manually || this.plugin.isWorkflowSync(workflow)) {
      return this.triggerSync(workflow, context, options);
    }

    const { transaction, ...rest } = options;
    this.events.push([workflow, context, rest]);
    this.eventsCount = this.events.length;

    logger.info(`new event triggered, now events: ${this.events.length}`);
    logger.debug(`event data:`, { context });

    this.saveEvent();
  }

  private saveEvent() {
    if (this.saving) {
      return;
    }

    this.saving = (async () => {
      try {
        while (this.events.length) {
          if (this.executing && this.plugin.db.options.dialect === 'sqlite') {
            await this.executing;
          }

          const event = this.events.shift();
          this.eventsCount = this.events.length;
          if (!event) continue;

          const logger = this.plugin.getLogger(event[0].id);
          logger.info(`preparing execution for event`);

          try {
            const execution = await this.createExecution(...event);
            // NOTE: cache first execution for most cases
            if (!execution.dispatched) {
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
        }
      } finally {
        this.saving = null;
        if (this.events.length) {
          this.saveEvent();
        } else {
          this.dispatch();
        }
      }
    })();
  }

  public async resume(job: JobModel) {
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
    this.plugin.getLogger('dispatcher').info('app is stopping, draining local queues...');

    while (this.saving || this.executing || this.events.length || this.pending.length) {
      if (this.saving) {
        await this.saving;
      }
      if (this.executing) {
        await this.executing;
      }
      if (this.events.length && !this.saving) {
        this.saveEvent();
      }
      if (this.pending.length && !this.executing) {
        this.dispatch();
      }
      await new Promise((resolve) => setImmediate(resolve));
    }

    this.plugin.getLogger('dispatcher').info('local queues drained');
  }

  public dispatch() {
    if (!this.ready && !this.pending.length && !this.events.length) {
      return;
    }

    if (this.executing) {
      this.plugin.getLogger('dispatcher').warn(`workflow executing is not finished, new dispatching will be ignored`);
      return;
    }

    if (this.events.length) {
      this.saveEvent();
      return;
    }

    this.executing = (async () => {
      let next: ExecutionPlan | null = null;
      let execution: ExecutionModel | null = null;
      let pending: Pending | null = null;
      pending = this.pending.shift() ?? null;
      if (pending || (this.ready && this.plugin.serving())) {
        execution = await this.prepare(pending?.execution ?? null);
        if (execution) {
          next = [execution, pending?.job, pending?.rerun];
        }
        if (pending && next) {
          this.plugin.getLogger(next[0].workflowId).info(`pending execution (${next[0].id}) ready to process`);
        }
      } else {
        this.plugin
          .getLogger('dispatcher')
          .warn(
            `${WORKER_JOB_WORKFLOW_PROCESS} is not serving on this instance or app not ready, new dispatching will be ignored`,
          );
      }
      if (next) {
        try {
          await this.process(next[0], next[1], { rerun: next[2] });
        } catch (error) {
          this.plugin.getLogger(next[0].workflowId).error(`execution (${next[0].id}) process failed`, { error });
          if (pending && this.isLockAcquireError(error)) {
            this.pending.unshift({ ...pending, execution: next[0], loaded: true });
          }
        }
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

  public async run(pending: Pending, options: RunOptions = {}): Promise<void> {
    this.pending.push(pending);

    if (options.dispatch !== false) {
      this.dispatch();
    }
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
      const entered = await this.prepare(execution, {
        transaction: this.plugin.useDataSourceTransaction('main', options.transaction as Transaction),
      });
      if (!entered) {
        return null;
      }
      return this.process(entered, undefined, options);
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

    const { stack = [] } = options;
    let valid = true;
    if (stack?.length) {
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
            `workflow ${workflow.id} has already been triggered in stacks executions (${stack}), and max call count is ${limitCount}, newly triggering will be skipped.`,
          );

        valid = false;
      }
    }
    return valid;
  }

  private async createExecution(
    workflow: WorkflowModel,
    context: object,
    options: EventOptions,
  ): Promise<ExecutionModel> {
    const { deferred } = options;
    const transaction = await this.plugin.useDataSourceTransaction('main', options.transaction, true);
    const sameTransaction = options.transaction === transaction;
    let stack = options.stack;
    if (options.parentExecutionId && !stack) {
      const parentExecution = await this.plugin.db.getRepository('executions').findOne({
        filterByTk: options.parentExecutionId,
        transaction,
      });
      stack = parentExecution ? [...(parentExecution.stack ?? []), parentExecution.id] : [];
    }
    const valid = await this.validateEvent(workflow, context, { ...options, stack, transaction });
    if (!valid) {
      if (!sameTransaction) {
        await transaction.commit();
      }
      options.onTriggerFail?.(workflow, context, options);
      throw new Error('event is not valid');
    }

    let execution: ExecutionModel;
    try {
      execution = await workflow.createExecution(
        {
          context,
          key: workflow.key,
          eventKey: options.eventKey ?? randomUUID(),
          stack,
          parentExecutionId: options.parentExecutionId ?? null,
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

  private async prepare(
    input: ExecutionModel | null,
    options: { transaction?: Transaction } = {},
  ): Promise<ExecutionModel | null> {
    const transaction = options.transaction;
    const ownTransaction = !transaction;
    const tx =
      transaction ||
      (await this.plugin.db.sequelize.transaction({
        isolationLevel:
          this.plugin.db.options.dialect === 'sqlite' ? undefined : Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
      }));
    const logger = input ? this.plugin.getLogger(input.workflowId) : this.plugin.getLogger('dispatcher');

    try {
      let execution: ExecutionModel | null = input;
      if (execution) {
        await execution.reload({ transaction: tx });
      } else {
        execution = (await this.plugin.db.getRepository('executions').findOne({
          filter: {
            dispatched: false,
            'workflow.enabled': true,
          },
          sort: 'id',
          transaction: tx,
          lock: tx.LOCK.UPDATE,
          skipLocked: true,
        })) as ExecutionModel;
        if (execution) {
          this.plugin.getLogger(execution.workflowId).info(`execution (${execution.id}) fetched from db`);
        } else {
          this.plugin.getLogger('dispatcher').debug(`no execution in db queued to process`);
        }
      }

      if (!execution) {
        if (ownTransaction) {
          await tx.commit();
        }
        return null;
      }

      const entered = await this.enter(execution, tx);
      if (ownTransaction) {
        await tx.commit();
      }
      return entered;
    } catch (error) {
      if (ownTransaction) {
        await tx.rollback();
      }
      logger.error(`entering execution failed: ${error.message}`, { error });
      return null;
    }
  }

  private async enter(execution: ExecutionModel, transaction: Transaction): Promise<ExecutionModel | null> {
    const workflow =
      execution.workflow ||
      this.plugin.enabledCache.get(execution.workflowId) ||
      (await execution.getWorkflow({ transaction }));
    if (!workflow) {
      this.plugin.getLogger(execution.workflowId).warn(`workflow (${execution.workflowId}) not found for execution`, {
        workflowId: execution.workflowId,
        executionId: execution.id,
      });
    }

    if (execution.status && execution.status !== EXECUTION_STATUS.STARTED) {
      return null;
    }

    if (execution.dispatched && execution.status === EXECUTION_STATUS.STARTED && execution.startedAt) {
      execution.workflow = workflow;
      return execution;
    }

    const values: Record<string, any> = {
      dispatched: true,
      status: EXECUTION_STATUS.STARTED,
    };
    const where: Record<string, any> = {
      id: execution.id,
      status: execution.status ?? null,
    };

    if (!execution.dispatched) {
      where.dispatched = false;
    }

    if (!execution.startedAt) {
      const startedAt = new Date();
      values.startedAt = startedAt;
      execution.workflow = workflow;
      values.expiresAt = this.plugin.timeoutManager.getExpiresAt(execution, startedAt);
      where.startedAt = null;
    }

    const ExecutionModelClass = this.plugin.db.getModel('executions');
    const [affected] = await ExecutionModelClass.update(values, {
      where,
      transaction,
    });

    if (!affected) {
      return null;
    }

    await execution.reload({ transaction });
    execution.workflow = workflow;
    return execution;
  }

  private getExecutionLockKey(executionId: number | string) {
    return `workflow:execution:${executionId}`;
  }

  private isLockAcquireError(error: unknown) {
    return error instanceof Error && error.constructor.name === 'LockAcquireError';
  }

  private async process(
    execution: ExecutionModel,
    job: JobModel | null = null,
    options: Transactionable & { rerun?: ProcessorRerunOptions } = {},
  ): Promise<Processor> {
    const { rerun, ...processorOptions } = options;
    const logger = this.plugin.getLogger(execution.workflowId);
    const run = async () => {
      if (!execution.dispatched) {
        const transaction = await this.plugin.useDataSourceTransaction('main', processorOptions.transaction);
        await execution.update({ dispatched: true, status: EXECUTION_STATUS.STARTED }, { transaction });
        logger.info(`execution (${execution.id}) from pending list updated to started`);
      }
      this.plugin.timeoutManager.scheduleExecutionTimeout(execution);
      const processor = this.plugin.createProcessor(execution, processorOptions);

      logger.info(`execution (${execution.id}) ${rerun ? 'rerunning' : job ? 'resuming' : 'starting'}...`);

      try {
        await (rerun ? processor.rerun(rerun) : job ? processor.resume(job) : processor.start());
        logger.info(`execution (${execution.id}) finished with status: ${execution.status}`);
        logger.debug(`execution (${execution.id}) details:`, { execution });
        if (execution.status && execution.workflow?.options?.deleteExecutionOnStatus?.includes(execution.status)) {
          await execution.destroy({ transaction: processor.mainTransaction });
        }
      } catch (err) {
        logger.error(`execution (${execution.id}) error: ${err.message}`, err);
      }

      return processor;
    };

    const lock = await this.plugin.app.lockManager.tryAcquire(this.getExecutionLockKey(execution.id), 60_000);
    try {
      return await lock.runExclusive(run, 60_000);
    } catch (error) {
      logger.error(`execution (${execution.id}) could not acquire process lock`, { error });
      throw error;
    }
  }
}
