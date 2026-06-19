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
import { getExecutionLockKey, isLockAcquireError } from './utils';

const EXECUTION_ACQUIRE_MAX_ATTEMPTS = 5;
const PENDING_DISPATCH_MAX_ATTEMPTS = 3;

type AcquireRetryLogger = Pick<ReturnType<PluginWorkflowServer['getLogger']>, 'warn'>;

type ExecutionPlan = [ExecutionModel, JobModel?, ProcessorRerunOptions?];

type ID = number | string;

type Pending = {
  executionId: ID;
  jobId?: ID;
  immediate?: boolean;
  rerun?: ProcessorRerunOptions;
  dispatchAttempts?: number;
};

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
    this.enqueue({ executionId: execution.id });
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
                this.pending.push({ executionId: execution.id });
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

  public start(executionId: ID, jobId?: ID) {
    this.enqueue({ executionId, jobId });
  }

  public rerun(executionId: ID, rerun: ProcessorRerunOptions = {}) {
    this.enqueue({ executionId, rerun });
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
      let pending: Pending | null = null;
      try {
        pending = this.pending.shift() ?? null;
        if (pending) {
          next = await this.resolvePending(pending);
          if (next) {
            this.plugin.getLogger(next[0].workflowId).info(`pending execution (${next[0].id}) ready to process`);
          }
        } else if (this.ready && this.plugin.serving()) {
          const execution: ExecutionModel | null = await this.prepare(null);
          if (execution) {
            next = [execution];
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
            if (pending && isLockAcquireError(error)) {
              this.pending.unshift({ ...pending, immediate: true });
            }
          }
        }
      } catch (error) {
        this.plugin.getLogger('dispatcher').error(`workflow dispatch failed`, { error });
        if (pending) {
          const dispatchAttempts = (pending.dispatchAttempts ?? 0) + 1;
          if (dispatchAttempts < PENDING_DISPATCH_MAX_ATTEMPTS) {
            this.pending.push({ ...pending, dispatchAttempts });
          } else {
            this.plugin
              .getLogger(pending.executionId)
              .error(`pending execution (${pending.executionId}) dispatch failed, local retry limit reached`, {
                error,
                dispatchAttempts,
              });
          }
        }
      } finally {
        setImmediate(() => {
          this.executing = null;

          if (next || this.pending.length) {
            this.plugin.getLogger('dispatcher').debug(`last process finished, will do another dispatch`);
            this.dispatch();
          }
        });
      }
    })();
  }

  private enqueue(pending: Pending): void {
    this.pending.push({
      ...pending,
      immediate: !this.executing && !this.pending.length && !this.saving && !this.events.length,
    });

    this.dispatch();
  }

  private async loadJob(jobId: ID | undefined): Promise<JobModel | null> {
    if (jobId == null) {
      return null;
    }
    return this.plugin.db.getRepository('jobs').findOne({
      filterByTk: jobId,
    }) as Promise<JobModel | null>;
  }

  private async resolvePending(pending: Pending): Promise<ExecutionPlan | null> {
    const executionInput = (await this.plugin.db.getRepository('executions').findOne({
      filterByTk: pending.executionId,
    })) as ExecutionModel;
    if (!executionInput) {
      this.plugin.getLogger('dispatcher').warn(`execution (${pending.executionId}) not found, pending task ignored`);
      return null;
    }

    const execution = await this.prepare(executionInput, {
      immediate: pending.immediate,
    });
    if (!execution) {
      return null;
    }

    if (pending.jobId != null) {
      const job = await this.loadJob(pending.jobId);
      if (!job) {
        this.plugin.getLogger(execution.workflowId).warn(`job (${pending.jobId}) not found, resume ignored`);
        return null;
      }
      if (String(job.executionId) !== String(execution.id)) {
        this.plugin
          .getLogger(execution.workflowId)
          .warn(`job (${job.id}) does not belong to execution (${execution.id}), resume ignored`);
        return null;
      }
      job.execution = execution;
      return [execution, job];
    }

    return [execution, undefined, pending.rerun];
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
      if (err instanceof Error) {
        this.plugin.getLogger(workflow.id).error(`creating execution failed: ${err.message}`, err);
      }
      return null;
    }

    try {
      const entered = await this.prepare(execution);
      if (!entered) {
        return null;
      }
      return this.process(entered, undefined, options);
    } catch (err) {
      if (err instanceof Error) {
        this.plugin.getLogger(execution.workflowId).error(`execution (${execution.id}) error: ${err.message}`, err);
      }
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
    let stack = options.stack;
    if (options.parentExecutionId && !stack) {
      const parentExecution = await this.plugin.db.getRepository('executions').findOne({
        filterByTk: options.parentExecutionId,
      });
      stack = parentExecution ? [...(parentExecution.stack ?? []), parentExecution.id] : [];
    }
    const valid = await this.validateEvent(workflow, context, { ...options, stack });
    if (!valid) {
      options.onTriggerFail?.(workflow, context, options);
      throw new Error('event is not valid');
    }

    const execution: ExecutionModel = await workflow.createExecution({
      context,
      key: workflow.key,
      eventKey: options.eventKey ?? randomUUID(),
      stack,
      parentExecutionId: options.parentExecutionId ?? null,
      dispatched: deferred ?? false,
      status: deferred ? EXECUTION_STATUS.STARTED : EXECUTION_STATUS.QUEUEING,
      manually: options.manually,
    });

    this.plugin.getLogger(workflow.id).info(`execution of workflow ${workflow.id} created as ${execution.id}`);

    if (!workflow.stats) {
      workflow.stats = await workflow.getStats();
    }
    await workflow.stats.increment('executed');
    // NOTE: https://sequelize.org/api/v6/class/src/model.js~model#instance-method-increment
    if (this.plugin.db.options.dialect !== 'postgres') {
      await workflow.stats.reload();
    }
    if (!workflow.versionStats) {
      workflow.versionStats = await workflow.getVersionStats();
    }
    await workflow.versionStats.increment('executed');
    if (this.plugin.db.options.dialect !== 'postgres') {
      await workflow.versionStats.reload();
    }

    execution.workflow = workflow;

    return execution;
  }

  private async prepare(
    input: ExecutionModel | null,
    options: { transaction?: Transaction | null; immediate?: boolean } = {},
  ): Promise<ExecutionModel | null> {
    const logger = input ? this.plugin.getLogger(input.workflowId) : this.plugin.getLogger('dispatcher');

    // NOTE: when a transaction is provided by the caller (e.g. sync trigger),
    // the transaction boundary is managed externally, so run once without retry.
    if (options.transaction) {
      try {
        const { execution } = await this.acquireExecution(input, options, options.transaction);
        return execution;
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`entering execution failed: ${error.message}`, { error });
        }
        return null;
      }
    }

    // NOTE: own the transaction here and retry on concurrent serialization/deadlock
    // conflicts (merged from main) so distributed workers neither duplicate nor lose
    // executions under high concurrency.
    let result: ExecutionModel | null = null;
    // NOTE: acquireWithRetry rethrows non-concurrent errors (e.g. failing to open the
    // transaction itself). Catch them here and return null so a failed acquire neither
    // throws to the dispatch loop (which would leave `executing` stuck) nor mutates the
    // execution state.
    try {
      await this.acquireWithRetry(
        async () => {
          const tx = await this.plugin.db.sequelize.transaction({
            isolationLevel:
              this.plugin.db.options.dialect === 'sqlite' ? undefined : Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
          });
          try {
            const { execution, shouldRetry } = await this.acquireExecution(input, options, tx);
            await tx.commit();
            result = execution;
            return shouldRetry;
          } catch (error) {
            await tx.rollback();
            if (this.isConcurrentAcquireError(error)) {
              throw error;
            }
            if (error instanceof Error) {
              logger.error(`entering execution failed: ${error.message}`, { error });
            }
            result = null;
            return false;
          }
        },
        {
          logger,
          conflictMessage: input
            ? `acquiring pending execution (${input.id}) conflicted with another worker, retrying`
            : `acquiring execution conflicted with another worker, retrying`,
          maxAttemptsMessage: input
            ? `acquiring pending execution (${input.id}) reached max retry attempts`
            : `acquiring execution reached max retry attempts, will retry on next dispatch`,
        },
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`acquiring execution failed: ${error.message}`, { error });
      }
      return null;
    }
    return result;
  }

  private async acquireExecution(
    input: ExecutionModel | null,
    options: { immediate?: boolean },
    transaction: Transaction,
  ): Promise<{ execution: ExecutionModel | null; shouldRetry: boolean }> {
    let execution: ExecutionModel | null = input;
    if (execution) {
      if (!options.immediate || execution.status !== EXECUTION_STATUS.QUEUEING) {
        await execution.reload({ transaction });
      }
    } else {
      execution = (await this.plugin.db.getRepository('executions').findOne({
        filter: {
          dispatched: false,
          'workflow.enabled': true,
        },
        sort: 'id',
        transaction,
        lock: transaction.LOCK.UPDATE,
        skipLocked: true,
      })) as ExecutionModel;
      if (execution) {
        this.plugin.getLogger(execution.workflowId).info(`execution (${execution.id}) fetched from db`);
      } else {
        this.plugin.getLogger('dispatcher').debug(`no execution in db queued to process`);
      }
    }

    if (!execution) {
      return { execution: null, shouldRetry: false };
    }

    const entered = await this.enter(execution, transaction);
    // NOTE: a queued execution was fetched but acquired by another worker first
    // (conditional update affected 0 rows), retry to pick the next one.
    const shouldRetry = !input && !entered;
    return { execution: entered, shouldRetry };
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

  private async enter(execution: ExecutionModel, transaction?: Transaction): Promise<ExecutionModel | null> {
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

  private async process(
    execution: ExecutionModel,
    job: JobModel | null = null,
    options: Transactionable & { rerun?: ProcessorRerunOptions } = {},
  ): Promise<Processor> {
    const { rerun, ...processorOptions } = options;
    const logger = this.plugin.getLogger(execution.workflowId);
    const run = async () => {
      if (!execution.dispatched) {
        await execution.update({ dispatched: true, status: EXECUTION_STATUS.STARTED });
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
          await execution.destroy();
        }
      } catch (err) {
        if (err instanceof Error) {
          logger.error(`execution (${execution.id}) error: ${err.message}`, err);
        }
      }

      return processor;
    };

    const lock = await this.plugin.app.lockManager.tryAcquire(getExecutionLockKey(execution.id), 60_000);
    try {
      return await lock.runExclusive(run, 60_000);
    } catch (error) {
      logger.error(`execution (${execution.id}) could not acquire process lock`, { error });
      throw error;
    }
  }
}
