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
const QUEUE_TASK_MAX_ATTEMPTS = 3;
const RECOVERY_BATCH_SIZE = 100;
const RECOVERY_LOCK_TTL = 300_000;

type AcquireRetryLogger = Pick<ReturnType<PluginWorkflowServer['getLogger']>, 'warn'>;

type ExecutionPlan = [ExecutionModel, JobModel?, ProcessorRerunOptions?];

type ID = number | string;

type WorkflowQueueTask =
  | {
      executionId: ID;
      jobId?: never;
      rerun?: never;
    }
  | {
      executionId: ID;
      jobId: ID;
      rerun?: never;
    }
  | {
      executionId: ID;
      jobId?: never;
      rerun: ProcessorRerunOptions;
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
  private executing: Promise<void> | null = null;
  private recovering: Promise<void> | null = null;
  private saving: Promise<any> | null = null;
  private events: CachedEvent[] = [];
  private eventsCount = 0;

  get idle() {
    return this.ready && !this.executing && !this.saving && !this.events.length;
  }

  constructor(private readonly plugin: PluginWorkflowServer) {}

  public readonly onQueueTask: QueueEventOptions['process'] = async (event) => {
    const task = event as WorkflowQueueTask;
    let next: ExecutionPlan | null = null;
    const previous = this.executing;

    const executing = (async () => {
      await previous?.catch(() => undefined);

      this.plugin
        .getLogger('dispatcher')
        .info(`workflow queue task for execution (${task.executionId}) received from queue`);

      next = await this.resolveTask(task);
      if (!next) {
        return;
      }

      this.plugin.getLogger(next[0].workflowId).info(`queued execution (${next[0].id}) ready to process`);
      await this.process(next[0], next[1], { rerun: next[2] });
    })();
    this.executing = executing;

    try {
      await executing;
    } catch (error) {
      const workflowId = next?.[0]?.workflowId ?? task.executionId;
      this.plugin.getLogger(workflowId).error(`workflow queue task failed`, { error });
      throw error;
    } finally {
      if (this.executing === executing) {
        this.executing = null;
      }

      if (this.events.length) {
        this.saveEvent();
      }
    }
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
              try {
                await this.enqueue({
                  executionId: execution.id,
                });
              } catch (qErr) {
                logger.error(`publishing execution (${execution.id}) to queue failed:`, { error: qErr });
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
        }
      }
    })();
  }

  public async beforeStop() {
    this.ready = false;
    this.plugin.getLogger('dispatcher').info('app is stopping, draining local queues...');

    if (this.recovering) {
      await this.recovering;
    }

    while (this.saving || this.executing || this.events.length) {
      if (this.saving) {
        await this.saving;
      }
      if (this.executing) {
        await this.executing;
      }
      if (this.events.length && !this.saving) {
        this.saveEvent();
      }
      await new Promise((resolve) => setImmediate(resolve));
    }

    this.plugin.getLogger('dispatcher').info('local queues drained');
  }

  public async recover(options: { gracePeriod?: number } = {}) {
    if (!this.ready) {
      return;
    }

    if (this.recovering) {
      await this.recovering;
      return;
    }

    const recovering = this.recoverQueueTasks(options.gracePeriod ?? 0);
    this.recovering = recovering;
    try {
      await recovering;
    } finally {
      if (this.recovering === recovering) {
        this.recovering = null;
      }
    }
  }

  private async recoverQueueTasks(gracePeriod: number) {
    const logger = this.plugin.getLogger('dispatcher');

    try {
      if (!this.plugin.serving()) {
        logger.warn(
          `${WORKER_JOB_WORKFLOW_PROCESS} is not serving on this instance, workflow queue recovery will be ignored`,
        );
        return;
      }

      let lock;
      try {
        lock = await this.plugin.app.lockManager.tryAcquire(`workflow:recover:${this.plugin.app.name}`);
      } catch (error) {
        if (isLockAcquireError(error)) {
          logger.debug(`workflow queue recovery is already running on another instance`);
          return;
        }
        throw error;
      }

      await lock.runExclusive(async () => {
        let executionCursor: ID | null = null;
        while (this.ready) {
          const executions = await this.findQueueingExecutions(executionCursor, gracePeriod);
          if (!executions.length) {
            break;
          }
          for (const execution of executions) {
            if (!this.ready) {
              return;
            }
            await this.enqueue({ executionId: execution.id });
          }
          executionCursor = executions[executions.length - 1].id;
        }
      }, RECOVERY_LOCK_TTL);
    } catch (error) {
      logger.error(`workflow queue recovery failed`, { error });
    }
  }

  public async enqueue(task: WorkflowQueueTask): Promise<void> {
    await this.plugin.app.eventQueue.publish(this.plugin.channelPendingExecution, task, {
      maxRetries: QUEUE_TASK_MAX_ATTEMPTS - 1,
    });
  }

  private async loadJob(jobId: ID | undefined): Promise<JobModel | null> {
    if (jobId == null) {
      return null;
    }
    return this.plugin.db.getRepository('jobs').findOne({
      filterByTk: jobId,
    }) as Promise<JobModel | null>;
  }

  private async findQueueingExecutions(afterId: ID | null, gracePeriod: number): Promise<ExecutionModel[]> {
    const executions = (await this.plugin.db.getRepository('executions').find({
      filter: {
        ...(afterId == null ? {} : { id: { $gt: afterId } }),
        ...(gracePeriod > 0 ? { createdAt: { $lt: new Date(Date.now() - gracePeriod) } } : {}),
        dispatched: false,
        status: EXECUTION_STATUS.QUEUEING,
        startedAt: null,
        'workflow.enabled': true,
      },
      sort: 'id',
      limit: RECOVERY_BATCH_SIZE,
    })) as ExecutionModel[];
    for (const execution of executions) {
      this.plugin.getLogger(execution.workflowId).info(`queueing execution (${execution.id}) found, publishing task`);
    }
    return executions;
  }

  private async resolveTask(task: WorkflowQueueTask): Promise<ExecutionPlan | null> {
    const executionInput = (await this.plugin.db.getRepository('executions').findOne({
      filterByTk: task.executionId,
    })) as ExecutionModel;
    if (!executionInput) {
      this.plugin.getLogger('dispatcher').warn(`execution (${task.executionId}) not found, queue task ignored`);
      return null;
    }

    if (
      task.jobId == null &&
      task.rerun == null &&
      executionInput.status === EXECUTION_STATUS.STARTED &&
      executionInput.startedAt
    ) {
      this.plugin
        .getLogger(executionInput.workflowId)
        .warn(`execution (${executionInput.id}) has already started, start task ignored`);
      return null;
    }

    let job: JobModel | null = null;
    if (task.jobId != null) {
      job = await this.loadJob(task.jobId);
      if (!job) {
        this.plugin.getLogger(executionInput.workflowId).warn(`job (${task.jobId}) not found, resume ignored`);
        return null;
      }
      if (String(job.executionId) !== String(executionInput.id)) {
        this.plugin
          .getLogger(executionInput.workflowId)
          .warn(`job (${job.id}) does not belong to execution (${executionInput.id}), resume ignored`);
        return null;
      }
    }

    const execution = await this.prepare(executionInput);
    if (!execution) {
      return null;
    }

    if (job) {
      job.execution = execution;
      return [execution, job];
    }

    return [execution, undefined, task.rerun];
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

  private async handleTriggerFail(workflow: WorkflowModel, context: object, options: EventOptions, error?: unknown) {
    try {
      await options.onTriggerFail?.(workflow, context, options, error);
    } catch (triggerFailError) {
      this.plugin.getLogger(workflow.id).error(`trigger failure callback failed`, { error: triggerFailError });
    }
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
    let valid: boolean;
    try {
      valid = await this.validateEvent(workflow, context, { ...options, stack });
    } catch (error) {
      await this.handleTriggerFail(workflow, context, options, error);
      throw error;
    }
    if (!valid) {
      const error = new Error('event is not valid');
      await this.handleTriggerFail(workflow, context, options, error);
      throw error;
    }

    let execution: ExecutionModel;
    try {
      execution = await workflow.createExecution({
        context,
        key: workflow.key,
        eventKey: options.eventKey ?? randomUUID(),
        stack,
        parentExecutionId: options.parentExecutionId ?? null,
        dispatched: deferred ?? false,
        status: deferred ? EXECUTION_STATUS.STARTED : EXECUTION_STATUS.QUEUEING,
        manually: options.manually,
      });
    } catch (error) {
      await this.handleTriggerFail(workflow, context, options, error);
      throw error;
    }

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
    input: ExecutionModel,
    options: { transaction?: Transaction | null; immediate?: boolean } = {},
  ): Promise<ExecutionModel | null> {
    const logger = this.plugin.getLogger(input.workflowId);

    // NOTE: when a transaction is provided by the caller (e.g. sync trigger),
    // the transaction boundary is managed externally, so run once without retry.
    if (options.transaction) {
      try {
        return await this.acquireExecution(input, options, options.transaction);
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
    // throws to the queue worker (which would leave `executing` stuck) nor mutates the
    // execution state.
    try {
      await this.acquireWithRetry(
        async () => {
          const tx = await this.plugin.db.sequelize.transaction({
            isolationLevel:
              this.plugin.db.options.dialect === 'sqlite' ? undefined : Transaction.ISOLATION_LEVELS.READ_COMMITTED,
          });
          try {
            const execution = await this.acquireExecution(input, options, tx);
            await tx.commit();
            result = execution;
          } catch (error) {
            await tx.rollback();
            if (this.isConcurrentAcquireError(error)) {
              throw error;
            }
            if (error instanceof Error) {
              logger.error(`entering execution failed: ${error.message}`, { error });
            }
            result = null;
          }
        },
        {
          logger,
          conflictMessage: `acquiring queue task execution (${input.id}) conflicted with another worker, retrying`,
          maxAttemptsMessage: `acquiring queue task execution (${input.id}) reached max retry attempts`,
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
    input: ExecutionModel,
    options: { immediate?: boolean },
    transaction: Transaction,
  ): Promise<ExecutionModel | null> {
    if (!options.immediate || input.status !== EXECUTION_STATUS.QUEUEING) {
      await input.reload({ transaction });
    }

    return this.enter(input, transaction);
  }

  private async acquireWithRetry(
    acquire: () => Promise<void>,
    options: {
      logger: AcquireRetryLogger;
      conflictMessage: string;
      maxAttemptsMessage: string;
    },
  ) {
    for (let attempt = 1; attempt <= EXECUTION_ACQUIRE_MAX_ATTEMPTS; attempt++) {
      try {
        await acquire();
        break;
      } catch (error) {
        if (!this.isConcurrentAcquireError(error)) {
          throw error;
        }
        options.logger.warn(options.conflictMessage, { error });
        if (attempt >= EXECUTION_ACQUIRE_MAX_ATTEMPTS) {
          options.logger.warn(options.maxAttemptsMessage);
          break;
        }
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
        logger.info(`execution (${execution.id}) from workflow queue updated to started`);
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
