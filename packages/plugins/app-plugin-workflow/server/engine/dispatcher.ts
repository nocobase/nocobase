import { bindWorkflowLogger } from './logger.js';
import { randomUUID } from 'node:crypto';

import type { DatabaseManager } from '@nocobase/db';
import type { IdGeneratorService } from '@nocobase/snowflake';

import { anyOfIds } from '../collections/filters.js';
import {
  workflowStore,
  workflowStoreOf,
  type WorkflowStore,
} from '../collections/store.js';
import { EXECUTION_STATUS, NODE_RUN_STATUS } from './constants.js';
import Processor, {
  type ProcessorOptions,
  type WorkflowBackgroundPayload,
  type WorkflowBackgroundResult,
} from './processor.js';
import {
  CheckpointCommitError,
  CheckpointConflictError,
  WorkflowBusyError,
} from './checkpoint.js';
import { resolveIdGenerator } from './ids.js';
import {
  MAX_RESUME_ATTEMPTS,
  RESUME_REQUEST_STATE,
  ResumeRequestService,
  hashResumePayload,
  hydrateResumeRequest,
  type ResumeRequestRejection,
} from './resume-requests.js';
import type {
  ProcessorRerunOptions,
  WorkflowDefinition,
  WorkflowEventOptions,
  WorkflowId,
  WorkflowInstructionClass,
  WorkflowInstructionResult,
  WorkflowLogger,
  WorkflowQueue,
  WorkflowQueueTask,
  WorkflowExecutionQueueTask,
  WorkflowResumeRequest,
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
  idGenerator?: IdGeneratorService;
  leaseTtlMs?: number;
  leaseHeartbeatMs?: number;
  resumeRecoveryGraceMs?: number;
}

type ExecutionPlan = {
  execution: WorkflowRun;
  workflow: WorkflowDefinition;
  nodeRun?: WorkflowNodeRun;
  rerun?: ProcessorRerunOptions;
  resumeRequest?: WorkflowResumeRequest;
};

/**
 * What one task left behind for the Dispatcher to do once the run is released:
 * the Processor it used, whether queued requests of the run need another
 * delivery, and the background work its checkpoint stored.
 */
type TaskOutcome = {
  processor: Processor | null;
  republishRunId: WorkflowId | null;
  background: WorkflowQueueTask[];
};

const NO_OUTCOME: TaskOutcome = {
  processor: null,
  republishRunId: null,
  background: [],
};

/** The exclusive right to execute one run, which expires unless it is renewed. */
interface RunLease {
  readonly token: string;
  readonly ttlMs: number;
  /** Keeps the claim of this request alive for as long as the lease is. */
  trackRequest(requestId: WorkflowId): void;
  release(): Promise<void>;
}

const RECOVERY_BATCH_SIZE = 100;
const DEFAULT_LEASE_TTL_MS = 60_000;
const DEFAULT_RESUME_GRACE_MS = 15_000;

function statusIsQueueing(status: number | null): boolean {
  return status === EXECUTION_STATUS.QUEUEING;
}

export default class Dispatcher {
  private readonly inFlight = new Set<Promise<unknown>>();
  private readonly pendingEventKeys = new Set<string>();
  private readonly executionLocks = new Map<string, Promise<void>>();
  private readonly leaseTtlMs: number;
  private readonly leaseHeartbeatMs: number;
  private readonly resumeRecoveryGraceMs: number;
  /** Where every node's resumption goes through; see `ResumeRequestService`. */
  readonly resumeRequests: ResumeRequestService;

  constructor(private readonly options: DispatcherOptions) {
    this.leaseTtlMs = Math.max(1, options.leaseTtlMs ?? DEFAULT_LEASE_TTL_MS);
    this.leaseHeartbeatMs = Math.max(
      1,
      options.leaseHeartbeatMs ?? Math.floor(this.leaseTtlMs / 3),
    );
    this.resumeRecoveryGraceMs =
      options.resumeRecoveryGraceMs ?? DEFAULT_RESUME_GRACE_MS;
    this.resumeRequests = new ResumeRequestService({
      database: options.database,
      ...(options.connectionName === undefined
        ? {}
        : { connectionName: options.connectionName }),
      idGenerator: resolveIdGenerator(options.idGenerator),
      enqueue: (task) => this.enqueue(task),
      logger: this.getLogger('dispatcher'),
    });
  }

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
        return this.runLocked(execution.id, async () => {
          const entered = await this.acquireExecution(execution, workflow);
          return entered
            ? this.process({ execution: entered, workflow })
            : NO_OUTCOME;
        });
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
    recovered += await this.recoverResumeRequests({ gracePeriod });
    return recovered;
  }

  /**
   * Publish resume requests again when the delivery that was meant to apply
   * them was lost: a request still queued after the grace period (its message
   * never reached a worker, or the run was busy), or one a worker claimed and
   * then stopped renewing.
   *
   * Background work is recovered the same way: an `executing` request nobody
   * claimed within the grace period (its task was lost, or its worker stopped
   * before starting it), or one whose worker stopped renewing its claim while
   * the work ran, is published again for another worker to run.
   *
   * Requests that were consumed or rejected are not part of the scan, so a
   * request that can never be applied does not keep occupying the batch.
   */
  async recoverResumeRequests(
    options: { gracePeriod?: number } = {},
  ): Promise<number> {
    const gracePeriod = options.gracePeriod ?? this.resumeRecoveryGraceMs;
    const queuedBefore = new Date(Date.now() - gracePeriod).toISOString();
    const staleBefore = new Date(Date.now() - this.leaseTtlMs).toISOString();
    const requests = await this.store.resumeRequests.findMany({
      filter: (filter) =>
        filter.or([
          filter.and([
            filter.string('state').eq(RESUME_REQUEST_STATE.queued),
            filter.date('createdAt').before(queuedBefore),
          ]),
          filter.and([
            filter.string('state').eq(RESUME_REQUEST_STATE.processing),
            filter.date('claimedAt').before(staleBefore),
          ]),
          filter.and([
            filter.string('state').eq(RESUME_REQUEST_STATE.executing),
            filter.string('claimToken').empty(),
            filter.date('createdAt').before(queuedBefore),
          ]),
          filter.and([
            filter.string('state').eq(RESUME_REQUEST_STATE.executing),
            filter.date('claimedAt').before(staleBefore),
          ]),
        ]),
      sort: (sort) => sort.field('createdAt').asc(),
      limit: RECOVERY_BATCH_SIZE,
    });
    let recovered = 0;
    for (const row of requests) {
      const request = hydrateResumeRequest(row);
      if (request.claimToken != null || request.claimedAt != null) {
        // Only the claim the scan saw may be reset — the same holder, still not
        // renewed — or a worker that renewed it, or claimed it anew, in the
        // meantime would lose a request it is applying.
        const reset = await this.store.resumeRequests.updateMany({
          filter: (filter) =>
            filter.and([
              filter.number('id').eq(asIdFilter(request.id)),
              filter.string('state').eq(request.state),
              request.claimToken == null
                ? filter.string('claimToken').empty()
                : filter.string('claimToken').eq(request.claimToken),
              filter.date('claimedAt').before(staleBefore),
            ]),
          values: {
            // Background work that was cut off is run again; a segment that was
            // cut off is applied again.
            state:
              request.state === RESUME_REQUEST_STATE.executing
                ? RESUME_REQUEST_STATE.executing
                : RESUME_REQUEST_STATE.queued,
            claimToken: null,
            claimedAt: null,
          },
        });
        if (!reset.updatedCount) continue;
      }
      await this.resumeRequests.publish({
        executionId: request.workflowRunId,
        nodeRunId: request.nodeRunId,
        resumeRequestId: request.id,
      });
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
        if (task.resumeRequestId != null) {
          await this.rejectUnclaimedRequest(
            task.resumeRequestId,
            'target-missing',
          );
        }
        return null;
      }
    }

    if (task.resumeRequestId != null) {
      const row = await store.resumeRequests.findOne({
        filter: { id: asIdFilter(task.resumeRequestId) },
      });
      // Background work takes neither the run's lease nor its lock in this
      // process: it may run for long, and without a queue the result it
      // reports is applied inline, under the lock this task would be holding.
      if (row?.state === RESUME_REQUEST_STATE.executing) {
        await this.executeBackground(
          hydrateResumeRequest(row),
          execution,
          workflow,
          nodeRun,
        );
        return null;
      }
    }

    return this.runLocked(execution.id, async () => {
      if (task.resumeRequestId != null) {
        return this.processResumeTask(
          task.resumeRequestId,
          execution,
          workflow,
          nodeRun,
        );
      }
      const entered = await this.acquireExecution(execution, workflow);
      return entered
        ? this.process({
            execution: entered,
            workflow,
            nodeRun,
            rerun: task.rerun,
          })
        : NO_OUTCOME;
    });
  }

  /**
   * Claims a resume request and applies it under the run's lease.
   *
   * A task that cannot get the lease does not wait for it and is not lost: the
   * request stays queued, and the worker that holds the run delivers it again
   * after its own checkpoint.
   */
  private async processResumeTask(
    requestId: WorkflowId,
    execution: WorkflowRun,
    workflow: WorkflowDefinition,
    nodeRun: WorkflowNodeRun | undefined,
  ): Promise<TaskOutcome> {
    const store = this.store;
    const row = await store.resumeRequests.findOne({
      filter: { id: asIdFilter(requestId) },
    });
    if (!row) return NO_OUTCOME;
    const request = hydrateResumeRequest(row);
    if (
      String(request.workflowRunId) !== String(execution.id) ||
      String(request.nodeRunId) !== String(nodeRun?.id) ||
      request.state !== RESUME_REQUEST_STATE.queued
    )
      return NO_OUTCOME;
    // A run that is past its deadline but still started is not rejected here:
    // applying the request is what lets the Processor see the deadline and
    // finalize the run as timed out, in the same checkpoint that consumes it.
    if (execution.status !== EXECUTION_STATUS.STARTED) {
      await this.rejectUnclaimedRequest(request.id, 'run-ended');
      return NO_OUTCOME;
    }
    const lease = await this.acquireLease(execution.id);
    if (!lease) return NO_OUTCOME;
    let handedOver = false;
    try {
      // The claim is made in the name of the lease: its token is what every
      // later write to the request is conditioned on.
      const claimedAt = nowInstant();
      const claim = await store.resumeRequests.updateMany({
        filter: {
          id: asIdFilter(request.id),
          state: RESUME_REQUEST_STATE.queued,
        },
        values: {
          state: RESUME_REQUEST_STATE.processing,
          claimToken: lease.token,
          claimedAt,
        },
      });
      if (!claim.updatedCount) return { ...NO_OUTCOME, republishRunId: null };
      const claimed: WorkflowResumeRequest = {
        ...request,
        state: RESUME_REQUEST_STATE.processing,
        claimToken: lease.token,
        claimedAt,
      };
      lease.trackRequest(request.id);
      // The target is read again under the lease: it was read before it, and
      // another worker may have finished the node since.
      const current = await loadNodeRun(store, request.nodeRunId);
      if (!current || current.status !== NODE_RUN_STATUS.PENDING) {
        await this.rejectClaimedRequest(
          claimed,
          current ? 'stale' : 'target-missing',
        );
        return { ...NO_OUTCOME, republishRunId: execution.id };
      }
      const entered = await this.acquireExecution(execution, workflow);
      if (!entered) {
        await this.rejectClaimedRequest(claimed, 'run-ended');
        return { ...NO_OUTCOME, republishRunId: execution.id };
      }
      handedOver = true;
      return await this.process(
        {
          execution: entered,
          workflow,
          nodeRun: current,
          resumeRequest: claimed,
        },
        lease,
      );
    } finally {
      // `process` owns the lease from the moment it is handed over.
      if (!handedOver) await lease.release();
    }
  }

  /**
   * Refuses a request nobody has claimed — queued, or background work nobody
   * runs. A claimed one is left alone: it is its holder's to settle, and the
   * holder may be another worker.
   */
  private async rejectUnclaimedRequest(
    requestId: WorkflowId,
    reason: ResumeRequestRejection,
  ): Promise<void> {
    await this.store.resumeRequests.updateMany({
      filter: (filter) =>
        filter.and([
          filter.number('id').eq(asIdFilter(requestId)),
          filter.or([
            filter.string('state').eq(RESUME_REQUEST_STATE.queued),
            filter.string('state').eq(RESUME_REQUEST_STATE.executing),
          ]),
          filter.string('claimToken').empty(),
        ]),
      values: {
        state: RESUME_REQUEST_STATE.rejected,
        reason,
        slot: null,
        claimedAt: null,
      },
    });
  }

  /**
   * Refuses a request this worker claimed, provided it still holds the claim.
   * A write that matches nothing means the claim was reset and taken by
   * another worker, which now decides what becomes of the request.
   */
  private async rejectClaimedRequest(
    request: WorkflowResumeRequest,
    reason: ResumeRequestRejection,
  ): Promise<void> {
    const rejected = await this.store.resumeRequests.updateMany({
      filter: this.claimFilter(request),
      values: {
        state: RESUME_REQUEST_STATE.rejected,
        reason,
        slot: null,
        claimToken: null,
        claimedAt: null,
      },
    });
    if (!rejected.updatedCount) this.logClaimLost(request, 'rejected');
  }

  /**
   * Hands a request this worker claimed back unclaimed, to the phase it was
   * claimed in: background work that did not run stays `executing` and is run
   * again, while a result whose segment did not commit goes back to `queued`
   * and is applied again. The phase decides what the payload is — an
   * `executing` request carries no result yet — so it is never changed here.
   * `attempts` is recorded when the failure counts against the request's
   * limit. Like every write after the claim, it applies only while the claim
   * is still this worker's.
   */
  private async releaseClaimedRequest(
    request: WorkflowResumeRequest,
    attempts?: number,
  ): Promise<void> {
    const released = await this.store.resumeRequests.updateMany({
      filter: this.claimFilter(request),
      values: {
        state:
          request.state === RESUME_REQUEST_STATE.executing
            ? RESUME_REQUEST_STATE.executing
            : RESUME_REQUEST_STATE.queued,
        claimToken: null,
        claimedAt: null,
        ...(attempts === undefined ? {} : { attempts }),
      },
    });
    if (!released.updatedCount) this.logClaimLost(request, 'released');
  }

  /** A claimed request, in the state it was claimed in and by this claim. */
  private claimFilter(request: WorkflowResumeRequest): {
    id: number;
    state: string;
    claimToken: string;
  } {
    if (!request.claimToken)
      throw new Error(
        `Resume request "${String(request.id)}" is not claimed by this worker`,
      );
    return {
      id: asIdFilter(request.id),
      state: request.state,
      claimToken: request.claimToken,
    };
  }

  private logClaimLost(request: WorkflowResumeRequest, action: string): void {
    this.getLogger('dispatcher').warn(
      `Resume request "${String(request.id)}" was not ${action}: another worker has claimed it`,
      { executionId: request.workflowRunId, resumeRequestId: request.id },
    );
  }

  /**
   * After a checkpoint conflict the run has moved on without this worker, so
   * the request is refused when the run is over and otherwise waits for the
   * next delivery — unless another worker has claimed it meanwhile, in which
   * case it is that worker's to settle.
   */
  private async settleRequestAfterConflict(
    request: WorkflowResumeRequest,
    runId: WorkflowId,
  ): Promise<void> {
    const run = await loadRun(this.store, runId);
    if (run?.status !== EXECUTION_STATUS.STARTED) {
      await this.rejectClaimedRequest(request, 'run-ended');
    } else {
      await this.releaseClaimedRequest(request);
    }
  }

  /**
   * Takes the exclusive right to execute a run, for every kind of task alike.
   * It is a row condition rather than a process-local lock so that two
   * instances cannot both hold it, and it expires so a worker that stops
   * cannot hold it forever.
   */
  private async acquireLease(runId: WorkflowId): Promise<RunLease | null> {
    const store = this.store;
    const token = randomUUID();
    const now = Date.now();
    const acquired = await store.runs.updateMany({
      filter: (filter) =>
        filter.and([
          filter.number('id').eq(asIdFilter(runId)),
          filter.number('status').eq(EXECUTION_STATUS.STARTED),
          filter.or([
            filter.string('leaseToken').empty(),
            filter.date('leaseExpiresAt').before(new Date(now).toISOString()),
          ]),
        ]),
      values: {
        leaseToken: token,
        leaseExpiresAt: new Date(now + this.leaseTtlMs).toISOString(),
      },
    });
    if (!acquired.updatedCount) return null;

    const logger = this.getLogger('dispatcher');
    let requestId: WorkflowId | null = null;
    const heartbeat = setInterval(() => {
      const instant = new Date().toISOString();
      void Promise.all([
        store.runs.updateMany({
          filter: { id: asIdFilter(runId), leaseToken: token },
          values: {
            leaseExpiresAt: new Date(
              Date.now() + this.leaseTtlMs,
            ).toISOString(),
          },
        }),
        requestId == null
          ? undefined
          : store.resumeRequests.updateMany({
              // Renews only this lease's claim: once the claim was reset and
              // taken by another worker, keeping it alive is not this one's to do.
              filter: {
                id: asIdFilter(requestId),
                state: RESUME_REQUEST_STATE.processing,
                claimToken: token,
              },
              values: { claimedAt: instant },
            }),
      ]).catch((error: unknown) =>
        logger.error('Workflow run lease heartbeat failed', {
          runId,
          error,
        }),
      );
    }, this.leaseHeartbeatMs);
    heartbeat.unref();

    return {
      token,
      ttlMs: this.leaseTtlMs,
      trackRequest: (id) => {
        requestId = id;
      },
      release: async () => {
        clearInterval(heartbeat);
        await store.runs.updateMany({
          filter: { id: asIdFilter(runId), leaseToken: token },
          values: { leaseToken: null, leaseExpiresAt: null },
        });
      },
    };
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
            id: resolveIdGenerator(this.options.idGenerator).generate(),
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

  /**
   * Runs one segment of a run under its lease.
   *
   * Whatever the segment decided becomes visible only through its checkpoint,
   * so what follows it depends on whether that was committed: the lease is
   * released first, then requests that arrived while the run was busy are
   * delivered again, and only then does background work the segment asked for
   * start — never before the state it relies on is stored.
   */
  private async process(
    plan: ExecutionPlan,
    heldLease?: RunLease,
  ): Promise<TaskOutcome> {
    const logger = bindWorkflowLogger(this.getLogger(plan.workflow.id), {
      workflowId: plan.workflow.id,
      executionId: plan.execution.id,
    });
    const lease = heldLease ?? (await this.acquireLease(plan.execution.id));
    if (!lease) {
      // A task that is not a durable request has nowhere to wait, so its
      // caller is told instead of the task being dropped.
      if (plan.nodeRun || plan.rerun)
        throw new WorkflowBusyError(plan.execution.id);
      return NO_OUTCOME;
    }

    let processor: Processor | undefined;
    let committed = false;
    try {
      processor = await this.createProcessor(plan, logger, {
        lease: { token: lease.token, ttlMs: lease.ttlMs },
        resumeRequest: plan.resumeRequest,
      });
      try {
        await this.runSegment(processor, plan);
        committed = true;
      } catch (error) {
        await this.handleSegmentFailure(processor, plan, error, logger);
      }
    } finally {
      await lease.release();
    }
    return {
      processor: processor ?? null,
      republishRunId: plan.execution.id,
      background: committed && processor ? processor.takeBackgroundTasks() : [],
    };
  }

  private async createProcessor(
    plan: Pick<ExecutionPlan, 'execution' | 'workflow'>,
    logger: WorkflowLogger,
    segment: Pick<ProcessorOptions, 'lease' | 'resumeRequest'> = {},
  ): Promise<Processor> {
    const workflowResourceRoot =
      (await this.options.resolveWorkflowResourceRoot?.(
        plan.workflow,
        plan.execution,
      )) ?? null;
    return new Processor({
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
      idGenerator: this.options.idGenerator,
      ...segment,
    });
  }

  /**
   * Runs a node's background work for its `executing` request and turns what
   * it reports into a request to apply.
   *
   * The work is claimed on the request rather than under the run's lease: it
   * may run for long, and the run has nothing to write until it reports. The
   * claim is renewed while the work runs, so recovery hands work whose worker
   * stopped to another one — the work runs at least once, which is why it gets
   * a stable idempotency key. Each claim counts as an attempt, and once there
   * have been more than `MAX_RESUME_ATTEMPTS` the work is not started again:
   * the node is reported as failed instead of being retried for ever.
   *
   * The result is written onto the same row, from `executing` to `queued`,
   * only while the claim is still this worker's. A worker that lost it — its
   * claim was reset, or a rerun replaced the execution — drops what it got.
   */
  private async executeBackground(
    request: WorkflowResumeRequest,
    execution: WorkflowRun,
    workflow: WorkflowDefinition,
    nodeRun: WorkflowNodeRun | undefined,
  ): Promise<void> {
    const store = this.store;
    const token = randomUUID();
    const attempts = request.attempts + 1;
    const claim = await store.resumeRequests.updateMany({
      filter: (filter) =>
        filter.and([
          filter.number('id').eq(asIdFilter(request.id)),
          filter.string('state').eq(RESUME_REQUEST_STATE.executing),
          filter.string('claimToken').empty(),
        ]),
      values: { claimToken: token, claimedAt: nowInstant(), attempts },
    });
    if (!claim.updatedCount) return;
    const claimed: WorkflowResumeRequest = {
      ...request,
      claimToken: token,
      attempts,
    };
    const logger = bindWorkflowLogger(this.getLogger(workflow.id), {
      workflowId: workflow.id,
      executionId: execution.id,
    });
    const heartbeat = setInterval(() => {
      void store.resumeRequests
        .updateMany({
          filter: this.claimFilter(claimed),
          values: { claimedAt: new Date().toISOString() },
        })
        .catch((error: unknown) =>
          logger.error('Workflow background work heartbeat failed', {
            resumeRequestId: request.id,
            error,
          }),
        );
    }, this.leaseHeartbeatMs);
    heartbeat.unref();
    try {
      const startedAt = (request.payload as WorkflowBackgroundPayload | null)
        ?.startedAt;
      if (execution.status !== EXECUTION_STATUS.STARTED) {
        await this.rejectClaimedRequest(claimed, 'run-ended');
        return;
      }
      if (!nodeRun) {
        await this.rejectClaimedRequest(claimed, 'target-missing');
        return;
      }
      // The work belongs to one execution of the node run; a rerun that
      // restarted it under the same id would already have refused the request,
      // and this keeps a stale task from running the script anyway.
      if (
        nodeRun.status !== NODE_RUN_STATUS.PENDING ||
        typeof startedAt !== 'string' ||
        Date.parse(startedAt) !== Date.parse(nodeRun.startedAt)
      ) {
        await this.rejectClaimedRequest(claimed, 'stale');
        return;
      }

      let outcome: WorkflowInstructionResult;
      if (attempts > MAX_RESUME_ATTEMPTS) {
        outcome = {
          status: NODE_RUN_STATUS.ERROR,
          error: `Background work of node "${nodeRun.nodeKey}" was interrupted ${attempts - 1} times and is not started again`,
        };
      } else {
        let processor: Processor;
        try {
          execution.workflow = workflow;
          processor = await this.createProcessor(
            { execution, workflow },
            logger,
          );
          await processor.prepare();
        } catch (error) {
          // Not the node's failure but the worker's: the work is left for
          // recovery to hand out again.
          logger.error('Workflow background work could not be prepared', {
            resumeRequestId: request.id,
            error,
          });
          await this.releaseClaimedRequest(claimed);
          return;
        }
        outcome = await this.runBackground(processor, nodeRun, request);
      }

      const result: WorkflowBackgroundResult = {
        status: outcome.status,
        result: serializeJson(outcome.result ?? null),
        error: outcome.error ?? null,
        startedAt,
      };
      // The counter starts again for applying the result, which has its own
      // limit of failed commits.
      const completed = await store.resumeRequests.updateMany({
        filter: this.claimFilter(claimed),
        values: {
          state: RESUME_REQUEST_STATE.queued,
          payload: serializeJson(result),
          payloadHash: hashResumePayload(result),
          attempts: 0,
          claimToken: null,
          claimedAt: null,
        },
      });
      if (!completed.updatedCount) {
        logger.warn(
          `Background work of node "${nodeRun.nodeKey}" finished, but its request is no longer this worker's; the result is dropped`,
          { resumeRequestId: request.id },
        );
        return;
      }
      await this.resumeRequests.publish({
        executionId: execution.id,
        nodeRunId: nodeRun.id,
        resumeRequestId: request.id,
      });
    } finally {
      clearInterval(heartbeat);
    }
  }

  /** Calls the node's `background()` on an instruction built from the stored run. */
  private async runBackground(
    processor: Processor,
    nodeRun: WorkflowNodeRun,
    request: WorkflowResumeRequest,
  ): Promise<WorkflowInstructionResult> {
    const node = processor.nodesMap.get(nodeRun.nodeKey);
    const Instruction = node
      ? this.options.instructions.get(node.type)
      : undefined;
    const missing: WorkflowInstructionResult = {
      status: NODE_RUN_STATUS.ERROR,
      error: `Node "${nodeRun.nodeKey}" has no background work to run`,
    };
    if (!node || !Instruction) return missing;
    const abort = processor.createBackgroundAbortHandle();
    try {
      const instruction = new Instruction({
        node,
        nodeRun,
        processor,
        input: undefined,
        signal: abort.signal,
      });
      if (!instruction.background) return missing;
      return await instruction.background({
        signal: abort.signal,
        idempotencyKey: request.idempotencyKey,
      });
    } catch (error) {
      return {
        status: abort.signal.aborted
          ? NODE_RUN_STATUS.ABORTED
          : NODE_RUN_STATUS.ERROR,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      abort.dispose();
    }
  }

  private async runSegment(
    processor: Processor,
    plan: ExecutionPlan,
  ): Promise<void> {
    if (plan.rerun) {
      await processor.rerun(plan.rerun);
    } else if (plan.nodeRun) {
      await processor.resume(plan.nodeRun);
    } else {
      await processor.start();
    }
  }

  /**
   * What a segment that threw leaves behind. Background work it scheduled is
   * dropped with it — it was never stored — since the run is over or will be
   * retried.
   *
   * A checkpoint that could not be written is not by itself a failure of the
   * run: the database is still at the previous checkpoint, so a request goes
   * back to the queue to be applied again. Each such attempt is counted, and a
   * request that has failed `MAX_RESUME_ATTEMPTS` times is taken to fail for a
   * reason a retry cannot cure: it is rejected as `commit-failed` and the run
   * ends in error. A segment with no request to retry — a first execution, a
   * manual rerun — ends the run in error at once. Either way the error is
   * written without the node runs that just failed to commit, which would only
   * fail again. A segment that failed in its own logic is the run's failure,
   * and recording it is another checkpoint.
   */
  private async handleSegmentFailure(
    processor: Processor,
    plan: ExecutionPlan,
    error: unknown,
    logger: WorkflowLogger,
  ): Promise<void> {
    const request = plan.resumeRequest;
    if (error instanceof CheckpointConflictError) {
      logger.warn(error.message, { executionId: plan.execution.id });
      if (request)
        await this.settleRequestAfterConflict(request, plan.execution.id);
      return;
    }
    const commitFailed = error instanceof CheckpointCommitError;
    const attempts = request ? request.attempts + 1 : 0;
    if (commitFailed) {
      logger.error(error.message, { error: error.cause ?? error });
      if (request) {
        if (attempts < MAX_RESUME_ATTEMPTS) {
          await this.releaseClaimedRequest(request, attempts);
          throw error;
        }
        logger.error(
          `Resume request "${String(request.id)}" failed to commit ${attempts} times and is rejected`,
          { executionId: plan.execution.id, resumeRequestId: request.id },
        );
        processor.rejectResumeRequest('commit-failed');
      }
    } else {
      logger.error(`Execution "${plan.execution.id}" failed`, { error });
    }
    try {
      await processor.fail(
        { message: error instanceof Error ? error.message : String(error) },
        { discardUncommitted: commitFailed },
      );
    } catch (failure) {
      if (failure instanceof CheckpointConflictError) {
        logger.warn(failure.message, { executionId: plan.execution.id });
        if (request)
          await this.settleRequestAfterConflict(request, plan.execution.id);
        return;
      }
      // Not even the error could be recorded. The request is still claimed by
      // the rolled-back transaction, so it is handed back with the attempt
      // counted, and the next delivery tries to end the run again.
      if (request) await this.releaseClaimedRequest(request, attempts);
      throw failure;
    }
  }

  /**
   * Serializes the tasks of one run inside this process, then does whatever the
   * task owes once the run is free. The follow-up has to happen outside the
   * lock: without a queue, delivering a request runs it inline, and that would
   * wait for the lock its own caller still holds.
   */
  private async runLocked(
    executionId: WorkflowId,
    operation: () => Promise<TaskOutcome>,
  ): Promise<Processor | null> {
    const outcome = await this.withExecutionLock(executionId, operation);
    await this.republishQueuedRequests(outcome.republishRunId);
    // Background work is already stored, so a delivery lost here only delays
    // it until recovery. It is not awaited: the task that scheduled it is done.
    for (const task of outcome.background) {
      const operation = new Promise<void>((resolve) => setImmediate(resolve))
        .then(() => this.enqueue(task))
        .catch((error: unknown) => {
          this.getLogger('dispatcher').error(
            'Background workflow node failed',
            { error },
          );
        });
      this.inFlight.add(operation);
      void operation.finally(() => this.inFlight.delete(operation));
    }
    return outcome.processor;
  }

  /** Delivers again what arrived while this worker held the run. */
  private async republishQueuedRequests(
    runId: WorkflowId | null,
  ): Promise<void> {
    if (runId == null) return;
    const queued = await this.store.resumeRequests.findMany({
      filter: {
        workflowRunId: asIdFilter(runId),
        state: RESUME_REQUEST_STATE.queued,
      },
      sort: (sort) => sort.field('createdAt').asc(),
      limit: RECOVERY_BATCH_SIZE,
    });
    for (const row of queued) {
      const request = hydrateResumeRequest(row);
      await this.resumeRequests.publish({
        executionId: request.workflowRunId,
        nodeRunId: request.nodeRunId,
        resumeRequestId: request.id,
      });
    }
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
