import { bindWorkflowLogger } from './logger.js';
import { randomUUID } from 'node:crypto';

import type { DatabaseManager } from '@nocobase/db';

import { anyOfIds } from '../collections/filters.js';
import {
  workflowStore,
  workflowStoreOf,
  type WorkflowStore,
} from '../collections/store.js';
import { EXECUTION_STATUS } from './constants.js';
import Processor from './processor.js';
import type {
  ProcessorRerunOptions,
  WorkflowDefinition,
  WorkflowEventOptions,
  WorkflowId,
  WorkflowInstructionClass,
  WorkflowLogger,
  WorkflowQueue,
  WorkflowQueueTask,
  WorkflowExecutionQueueTask,
  WorkflowRun,
  WorkflowNodeRun,
} from './types.js';
import {
  asIdFilter,
  hydrateRun,
  loadNodeRun,
  loadRun,
  loadWorkflow,
  noopWorkflowLogger,
  nowInstant,
  serializeJson,
} from './utils.js';
import {
  normalizeWorkflowParameterValues,
  resolveWorkflowParameters,
} from '../../shared/parameters.js';

export interface DispatcherOptions {
  database: DatabaseManager;
  connectionName?: string;
  instructions: Map<string, WorkflowInstructionClass>;
  resolveWorkflowResourceRoot?: (
    workflow: WorkflowDefinition,
    execution: WorkflowRun,
  ) => Promise<string | null>;
  services?: import('./run-services.js').WorkflowRunServices;
  queue?: WorkflowQueue;
  logger?:
    | WorkflowLogger
    | ((workflowId: WorkflowId | 'dispatcher') => WorkflowLogger);
  environment?: Record<string, unknown> | (() => Record<string, unknown>);
  functions?: Record<string, (...args: unknown[]) => unknown>;
  terminalObserver?: import('./types.js').WorkflowTerminalObserver;
}

type ExecutionPlan = {
  execution: WorkflowRun;
  workflow: WorkflowDefinition;
  nodeRun?: WorkflowNodeRun;
  rerun?: ProcessorRerunOptions;
};

const RECOVERY_BATCH_SIZE = 100;

function statusIsQueueing(status: number | null): boolean {
  return status === EXECUTION_STATUS.QUEUEING;
}

export default class Dispatcher {
  private readonly inFlight = new Set<Promise<unknown>>();
  private readonly pendingEventKeys = new Set<string>();
  private readonly executionLocks = new Map<string, Promise<void>>();

  constructor(private readonly options: DispatcherOptions) {}

  private get store(): WorkflowStore {
    return workflowStore(this.options.database, this.options.connectionName);
  }

  get idle(): boolean {
    return this.inFlight.size === 0 && this.pendingEventKeys.size === 0;
  }

  trigger(
    workflow: WorkflowDefinition,
    input: unknown,
    options: WorkflowEventOptions = {},
  ): Promise<Processor | WorkflowRun | null | void> {
    const operation = this.triggerEvent(workflow, input, options);
    this.inFlight.add(operation);
    return operation.finally(() => {
      this.inFlight.delete(operation);
    });
  }

  private async triggerEvent(
    workflow: WorkflowDefinition,
    input: unknown,
    options: WorkflowEventOptions,
  ): Promise<Processor | WorkflowRun | null | void> {
    const logger = bindWorkflowLogger(this.getLogger(workflow.id), {
      workflowId: workflow.id,
    });
    if (!options.force && !options.manually && !workflow.enabled) {
      logger.warn(`Workflow "${workflow.key}" is disabled; event ignored`);
      return;
    }
    if (input == null) {
      const error = new Error('Workflow input must not be null');
      await this.handleTriggerFail(workflow, input, options, error);
      throw error;
    }

    const eventKey = options.eventKey ?? randomUUID();
    if (this.pendingEventKeys.has(eventKey)) {
      logger.warn(`Duplicate workflow event "${eventKey}" ignored`);
      return;
    }
    if (await this.store.runs.exists({ filter: { eventKey } })) {
      logger.warn(
        `Persisted workflow event "${eventKey}" already exists; event ignored`,
      );
      return;
    }

    this.pendingEventKeys.add(eventKey);
    try {
      const execution = await this.createExecution(workflow, input, {
        ...options,
        eventKey,
      });
      if (options.manually && options.waitForCompletion === false) {
        // Keep execution owned by the runtime (including shutdown draining),
        // without making the HTTP request wait for node completion.
        const operation = this.dispatch({ executionId: execution.id }).catch(
          (error: unknown) => {
            logger.error(
              `Execution "${execution.id}" could not be dispatched`,
              {
                error,
              },
            );
          },
        );
        this.inFlight.add(operation);
        void operation.finally(() => this.inFlight.delete(operation));
        return null;
      }
      if (options.deferred || options.manually) {
        const entered = await this.acquireExecution(execution, workflow);
        return entered ? this.process({ execution: entered, workflow }) : null;
      }
      await this.enqueue({ executionId: execution.id });
      return execution;
    } finally {
      this.pendingEventKeys.delete(eventKey);
    }
  }

  async dispatch(task: WorkflowQueueTask): Promise<Processor | null> {
    const operation = this.resolveAndProcessTask(task);
    this.inFlight.add(operation);
    try {
      return await operation;
    } finally {
      this.inFlight.delete(operation);
    }
  }

  async recover(options: { gracePeriod?: number } = {}): Promise<number> {
    const store = this.store;
    const gracePeriod = options.gracePeriod ?? 0;
    const createdBefore =
      gracePeriod > 0 ? new Date(Date.now() - gracePeriod).toISOString() : null;
    const rows = await store.runs.findMany({
      filter: (filter) =>
        filter.and([
          filter.boolean('dispatched').isFalse(),
          filter.number('status').empty(),
          ...(createdBefore
            ? [filter.date('createdAt').before(createdBefore)]
            : []),
        ]),
      sort: (sort) => sort.field('id').asc(),
      limit: RECOVERY_BATCH_SIZE,
    });
    let recovered = 0;
    for (const row of rows) {
      const execution = hydrateRun(row);
      const workflow = await loadWorkflow(store, execution.workflowId);
      if (!workflow || (!workflow.enabled && !execution.manually)) {
        continue;
      }
      await this.enqueue({ executionId: execution.id });
      recovered += 1;
    }
    return recovered;
  }

  async drain(): Promise<void> {
    while (this.inFlight.size) {
      await Promise.allSettled([...this.inFlight]);
    }
  }

  async enqueue(task: WorkflowQueueTask): Promise<void> {
    if (this.options.queue) {
      await this.options.queue.publish(task);
      return;
    }
    await this.dispatch(task);
  }

  private async resolveAndProcessTask(
    task: WorkflowExecutionQueueTask,
  ): Promise<Processor | null> {
    const store = this.store;
    const execution = await loadRun(store, task.executionId);
    if (!execution) {
      this.getLogger('dispatcher').warn(
        `Execution "${task.executionId}" was not found; queue task ignored`,
      );
      return null;
    }
    if (
      !task.nodeRunId &&
      !task.rerun &&
      execution.status === EXECUTION_STATUS.STARTED &&
      execution.startedAt
    ) {
      this.getLogger(execution.workflowId).warn(
        `Execution "${execution.id}" has already started; task ignored`,
      );
      return null;
    }

    const workflow = await loadWorkflow(store, execution.workflowId);
    if (!workflow) {
      this.getLogger(execution.workflowId).warn(
        `Workflow "${execution.workflowId}" was not found`,
      );
      return null;
    }

    let nodeRun: WorkflowNodeRun | undefined;
    if (task.nodeRunId != null) {
      nodeRun = (await loadNodeRun(store, task.nodeRunId)) ?? undefined;
      if (!nodeRun || String(nodeRun.workflowRunId) !== String(execution.id)) {
        this.getLogger(execution.workflowId).warn(
          `Node run "${task.nodeRunId}" does not belong to execution "${execution.id}"`,
        );
        return null;
      }
    }

    const entered = await this.acquireExecution(execution, workflow);
    if (!entered) {
      return null;
    }
    return this.process({
      execution: entered,
      workflow,
      nodeRun,
      rerun: task.rerun,
    });
  }

  private async createExecution(
    workflow: WorkflowDefinition,
    input: unknown,
    options: WorkflowEventOptions,
  ): Promise<WorkflowRun> {
    const stack = await this.resolveStack(options);
    try {
      if (!(await this.validateEvent(workflow, input, { ...options, stack }))) {
        throw new Error('Workflow event is not valid');
      }

      return await this.options.database.transaction(async (connection) => {
        const store = workflowStoreOf(connection);
        const eventKey = options.eventKey ?? randomUUID();
        const createdAt = nowInstant();
        const parameters = resolveWorkflowParameters(
          workflow.parametersSchema,
          options.parameterValues
            ? normalizeWorkflowParameterValues(
                workflow.parametersSchema,
                options.parameterValues,
              )
            : workflow.parameterValues,
        );
        const created = await store.runs.createOne({
          values: {
            workflowId: asIdFilter(workflow.id),
            workflowKey: workflow.key,
            hash: workflow.hash,
            eventKey,
            input: serializeJson(input),
            parameters: serializeJson(parameters),
            status: options.deferred
              ? EXECUTION_STATUS.STARTED
              : EXECUTION_STATUS.QUEUEING,
            dispatched: options.deferred ?? false,
            parentRunId:
              options.parentRunId == null
                ? null
                : asIdFilter(options.parentRunId),
            stack: serializeJson(stack),
            output: serializeJson(null),
            startedAt: options.deferred ? createdAt : null,
            finishedAt: null,
            expiresAt: options.deferred
              ? this.getExpiresAt(workflow, createdAt)
              : null,
            createdAt,
            manually: options.manually ?? false,
            reason: null,
            sourceType: options.sourceType ?? null,
            sourceId: options.sourceId ?? null,
          },
        });
        await this.incrementStats(store, workflow);
        const execution = hydrateRun(created.record);
        execution.workflow = workflow;
        return execution;
      }, this.options.connectionName);
    } catch (error) {
      await this.handleTriggerFail(workflow, input, options, error);
      throw error;
    }
  }

  private async acquireExecution(
    execution: WorkflowRun,
    workflow: WorkflowDefinition,
  ): Promise<WorkflowRun | null> {
    if (
      execution.dispatched &&
      execution.status === EXECUTION_STATUS.STARTED &&
      execution.startedAt
    ) {
      execution.workflow = workflow;
      return execution;
    }
    if (!statusIsQueueing(execution.status)) {
      return null;
    }

    const startedAt = nowInstant();
    const store = this.store;
    // The filter is the claim: whoever flips `dispatched` first owns this run,
    // and a second dispatcher updates nothing and backs out.
    const result = await store.runs.updateMany({
      filter: (filter) =>
        filter.and([
          filter.number('id').eq(asIdFilter(execution.id)),
          filter.boolean('dispatched').isFalse(),
          filter.number('status').empty(),
        ]),
      values: {
        dispatched: true,
        status: EXECUTION_STATUS.STARTED,
        startedAt,
        finishedAt: null,
        expiresAt: this.getExpiresAt(workflow, startedAt),
      },
    });
    if (result.updatedCount === 0) {
      return null;
    }
    const entered = await loadRun(store, execution.id);
    if (entered) {
      entered.workflow = workflow;
    }
    return entered;
  }

  private async process(plan: ExecutionPlan): Promise<Processor> {
    const logger = bindWorkflowLogger(this.getLogger(plan.workflow.id), {
      workflowId: plan.workflow.id,
      executionId: plan.execution.id,
    });
    const processor = await this.withExecutionLock(
      plan.execution.id,
      async () => {
        const workflowResourceRoot =
          (await this.options.resolveWorkflowResourceRoot?.(
            plan.workflow,
            plan.execution,
          )) ?? null;
        const processor = new Processor({
          database: this.options.database,
          connectionName: this.options.connectionName,
          workflow: plan.workflow,
          execution: plan.execution,
          instructions: this.options.instructions,
          workflowResourceRoot,
          services: this.options.services,
          logger,
          environment: this.options.environment,
          functions: this.options.functions,
          terminalObserver: this.options.terminalObserver,
          resumeNode: async (nodeRunId) => {
            await this.enqueue({ executionId: plan.execution.id, nodeRunId });
          },
        });
        try {
          if (plan.rerun) {
            await processor.rerun(plan.rerun);
          } else if (plan.nodeRun) {
            await processor.resume(plan.nodeRun);
          } else {
            await processor.start();
          }
        } catch (error) {
          logger.error(`Execution "${plan.execution.id}" failed`, { error });
          await processor.exit(-2, {
            message: error instanceof Error ? error.message : String(error),
          });
        }
        return processor;
      },
    );
    for (const task of processor.takeDeferredTasks()) {
      const operation = new Promise<void>((resolve) => setImmediate(resolve))
        .then(task)
        .catch((error: unknown) => {
          logger.error('Background workflow node failed', { error });
        });
      this.inFlight.add(operation);
      void operation.finally(() => this.inFlight.delete(operation));
    }
    return processor;
  }

  private async validateEvent(
    workflow: WorkflowDefinition,
    _context: unknown,
    options: WorkflowEventOptions,
  ): Promise<boolean> {
    const stack = options.stack ?? [];
    if (stack.length) {
      const repeats = await this.store.runs.count({
        filter: (filter) =>
          filter.and([
            filter.number('workflowId').eq(asIdFilter(workflow.id)),
            anyOfIds(filter, 'id', stack),
          ]),
      });
      const limit = Number(workflow.options.stackLimit ?? 1);
      if (repeats >= limit) {
        return false;
      }
    }
    return true;
  }

  private async resolveStack(
    options: WorkflowEventOptions,
  ): Promise<WorkflowId[]> {
    if (options.stack) {
      return [...options.stack];
    }
    const parentRunId = options.parentRunId;
    if (parentRunId == null) {
      return [];
    }
    const parent = await loadRun(this.store, parentRunId);
    return parent ? [...parent.stack, parent.id] : [];
  }

  /**
   * Both counters are upserts with a database-side increment rather than the
   * read-then-write they used to be: the Repository locks the row by its unique
   * selector, so two concurrent triggers of the same workflow can no longer
   * read the same count and each write it back plus one.
   */
  private async incrementStats(
    store: WorkflowStore,
    workflow: WorkflowDefinition,
  ): Promise<void> {
    await store.stats.upsertOne({
      filter: { key: workflow.key },
      create: { key: workflow.key, executed: 1 },
      update: { executed: (value) => value.increment(1) },
    });
    const workflowId = asIdFilter(workflow.id);
    await store.versionStats.upsertOne({
      filter: { id: workflowId },
      create: { id: workflowId, executed: 1 },
      update: { executed: (value) => value.increment(1) },
    });
  }

  private getExpiresAt(
    workflow: WorkflowDefinition,
    startedAt: string,
  ): string | null {
    const timeout = Number(workflow.options.timeout ?? 0);
    return Number.isFinite(timeout) && timeout > 0
      ? new Date(new Date(startedAt).getTime() + timeout * 1000).toISOString()
      : null;
  }

  private async handleTriggerFail(
    workflow: WorkflowDefinition,
    input: unknown,
    options: WorkflowEventOptions,
    error?: unknown,
  ): Promise<void> {
    try {
      await options.onTriggerFail?.(workflow, input, options, error);
    } catch (callbackError) {
      this.getLogger(workflow.id).error(
        'Workflow trigger failure callback failed',
        { error: callbackError },
      );
    }
  }

  private getLogger(workflowId: WorkflowId | 'dispatcher'): WorkflowLogger {
    if (typeof this.options.logger === 'function') {
      return this.options.logger(workflowId);
    }
    return this.options.logger ?? noopWorkflowLogger;
  }

  private async withExecutionLock<T>(
    executionId: WorkflowId,
    operation: () => Promise<T>,
  ): Promise<T> {
    const key = String(executionId);
    const previous = this.executionLocks.get(key) ?? Promise.resolve();
    let release: () => void = () => undefined;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const chain = previous.then(() => current);
    this.executionLocks.set(key, chain);
    await previous;
    try {
      return await operation();
    } finally {
      release();
      if (this.executionLocks.get(key) === chain) {
        this.executionLocks.delete(key);
      }
    }
  }
}
