import type { DatabaseManager } from '@nocobase/db';
import path from 'node:path';

import Dispatcher from './dispatcher.js';
import { coreInstructions } from '../instructions/index.js';
import type Processor from './processor.js';
import {
  createWorkflowQueueAdapter,
  type WorkflowQueueAdapter,
} from '../queue.js';
import { createTimeoutReaper, type TimeoutReaper } from './timeout-reaper.js';
import { workflowStore, type WorkflowStore } from '../collections/store.js';
import type {
  JsonObject,
  WorkflowDefinition,
  WorkflowEventOptions,
  WorkflowInstructionClass,
  WorkflowLogger,
  WorkflowQueueTask,
  WorkflowEngineOptions,
} from './types.js';
import { noopWorkflowLogger } from './utils.js';
import { asIdFilter, loadNodeRun, serializeJson } from './utils.js';

/**
 * The assembly layer.
 *
 * Everything below it is independently usable — a test can build a `Dispatcher`
 * by hand — but an application should not have to know that a queue adapter has
 * to be created before the dispatcher, that the reaper is a separate timer, or
 * that the dispatcher must drain before the worker is torn down. That ordering is
 * the only thing this class owns; it adds no execution semantics of its own.
 */
export default class WorkflowEngine {
  readonly database: DatabaseManager;
  readonly instructions: Map<string, WorkflowInstructionClass>;
  readonly dispatcher: Dispatcher;
  readonly logger: WorkflowLogger;

  private readonly options: WorkflowEngineOptions;
  private readonly queueAdapter: WorkflowQueueAdapter | null;
  private readonly reaper: TimeoutReaper | null;
  constructor(options: WorkflowEngineOptions) {
    this.options = options;
    this.database = options.database;
    this.logger = options.logger ?? noopWorkflowLogger;
    this.instructions = new Map<string, WorkflowInstructionClass>(
      coreInstructions,
    );
    // The adapter has to exist before the dispatcher, because the dispatcher
    // takes it as its `queue`. Creating it registers the task handler on the
    // executor, which `dispose()` shuts down.
    this.queueAdapter = options.executor
      ? createWorkflowQueueAdapter({
          executor: options.executor,
          dispatch: (task: WorkflowQueueTask) => this.dispatch(task),
        })
      : null;

    this.dispatcher = new Dispatcher({
      database: options.database,
      ...(options.connectionName === undefined
        ? {}
        : { connectionName: options.connectionName }),
      instructions: this.instructions,
      resolveWorkflowResourceRoot: (workflow, execution) =>
        this.resolveWorkflowResourceRoot(workflow, execution),
      services: options.services,
      ...(this.queueAdapter === null ? {} : { queue: this.queueAdapter }),
      logger: this.logger,
      ...(options.environment === undefined
        ? {}
        : { environment: options.environment }),
      ...(options.functions === undefined
        ? {}
        : { functions: options.functions }),
      ...(options.terminalObserver === undefined
        ? {}
        : { terminalObserver: options.terminalObserver }),
    });

    this.reaper =
      options.timeoutReaper === false
        ? null
        : createTimeoutReaper({
            database: options.database,
            ...(options.connectionName === undefined
              ? {}
              : { connectionName: options.connectionName }),
            logger: this.logger,
            ...(options.timeoutReaperIntervalMs === undefined
              ? {}
              : { intervalMs: options.timeoutReaperIntervalMs }),
            ...(options.timeoutReaperBatchSize === undefined
              ? {}
              : { batchSize: options.timeoutReaperBatchSize }),
            ...(options.terminalObserver === undefined
              ? {}
              : { terminalObserver: options.terminalObserver }),
          });
  }

  private get store(): WorkflowStore {
    return workflowStore(this.database, this.options.connectionName);
  }

  /** `true` once every task the dispatcher accepted has settled. */
  get idle(): boolean {
    return this.dispatcher.idle;
  }

  registerInstruction(instruction: WorkflowInstructionClass): void {
    if (this.instructions.has(instruction.type)) {
      throw new Error(
        `Workflow instruction "${instruction.type}" is already registered.`,
      );
    }
    this.instructions.set(instruction.type, instruction);
  }

  /**
   * Order matters: the worker and the reaper have to be able to run before
   * `recover()` re-publishes what a previous process left behind.
   */
  async initialize(): Promise<void> {
    await this.queueAdapter?.startWorker();
    this.reaper?.start();
    const recovered = await this.dispatcher.recover(
      this.options.recoverGracePeriod === undefined
        ? {}
        : { gracePeriod: this.options.recoverGracePeriod },
    );
    if (recovered) {
      this.logger.info(
        `Workflow runtime re-published ${recovered} undispatched run(s)`,
      );
    }
  }

  private async resolveWorkflowResourceRoot(
    workflow: WorkflowDefinition,
    execution: import('./types.js').WorkflowRun,
  ): Promise<string | null> {
    if (this.options.developmentResourceRoot) {
      return path.join(this.options.developmentResourceRoot, workflow.key);
    }
    if (!execution.hash) return null;
    if (this.options.artifactStore) {
      return this.options.artifactStore.materialize(
        execution.workflowKey,
        execution.hash,
      );
    }
    return null;
  }

  /**
   * Let in-flight work finish before shutting the executor down.
   */
  async dispose(): Promise<void> {
    this.reaper?.stop();
    await this.dispatcher.drain();
    await this.queueAdapter?.stop();
  }

  /** Resume or re-run a persisted execution. This is what the executor calls. */
  dispatch(task: WorkflowQueueTask): Promise<Processor | null> {
    return this.dispatcher.dispatch(task);
  }

  /** Publish a task instead of running it inline; in-process when no executor is configured. */
  enqueue(task: WorkflowQueueTask): Promise<void> {
    return this.dispatcher.enqueue(task);
  }

  /**
   * Run one timeout sweep now instead of waiting for the interval. Returns how
   * many runs were reclaimed, or `0` when the reaper is disabled.
   */
  async sweepTimeouts(): Promise<number> {
    return this.reaper ? this.reaper.sweep() : 0;
  }

  async trigger(
    workflow: WorkflowDefinition,
    input: JsonObject,
    options: WorkflowEventOptions = {},
  ): Promise<Processor | import('./types.js').WorkflowRun | null | void> {
    return this.dispatcher.trigger(workflow, input, options);
  }

  async resume(
    runId: import('./types.js').WorkflowId,
    nodeRunId: import('./types.js').WorkflowId,
    result: unknown,
  ): Promise<void> {
    const store = this.store;
    const nodeRun = await loadNodeRun(store, nodeRunId);
    if (!nodeRun || String(nodeRun.workflowRunId) !== String(runId))
      throw new Error(
        `Node run "${String(nodeRunId)}" does not belong to run "${String(runId)}"`,
      );
    await store.nodeRuns.updateMany({
      filter: { id: asIdFilter(nodeRunId) },
      values: { result: serializeJson(result) },
    });
    await this.dispatcher.dispatch({ executionId: runId, nodeRunId });
  }
}
