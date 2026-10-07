import { bindWorkflowLogger } from './logger.js';
import type { DatabaseManager } from '@nocobase/db';
import type { IdGeneratorService } from '@nocobase/snowflake';

import {
  workflowStore,
  workflowStoreOf,
  type WorkflowStore,
} from '../collections/store.js';
import {
  EXECUTION_REASON,
  EXECUTION_STATUS,
  NODE_RUN_STATUS,
} from './constants.js';
import type { WorkflowHandlerContext } from '../../shared/handler-context.js';
import type {
  ProcessorRerunOptions,
  WorkflowDefinition,
  WorkflowId,
  WorkflowInstructionClass,
  WorkflowInstructionResult,
  WorkflowLogger,
  WorkflowNode,
  WorkflowQueueTask,
  WorkflowResumeRequest,
  WorkflowRun,
  WorkflowNodeRun,
} from './types.js';
import {
  asIdFilter,
  hydrateNodeRun,
  noopWorkflowLogger,
  nowInstant,
  serializeJson,
} from './utils.js';
import { resolveWorkflowValue } from './value-resolver.js';
import {
  publishWorkflowTerminal,
  writeWorkflowRunTerminal,
} from './finalize-run.js';
import {
  CheckpointCommitError,
  CheckpointConflictError,
} from './checkpoint.js';
import { resolveIdGenerator } from './ids.js';
import {
  RESUME_REQUEST_STATE,
  hashResumePayload,
  type ResumeRequestRejection,
} from './resume-requests.js';

export type ProcessorRunOptions = {
  rerun?: true;
  signal?: AbortSignal;
};

export type BackgroundAbortHandle = {
  signal: AbortSignal;
  dispose: () => void;
  throwIfAborted: () => void;
};

export interface ProcessorOptions {
  database: DatabaseManager;
  connectionName?: string;
  workflow: WorkflowDefinition;
  execution: WorkflowRun;
  instructions: Map<string, WorkflowInstructionClass>;
  workflowResourceRoot: string | null;
  services?: import('./run-services.js').WorkflowRunServices;
  logger?: WorkflowLogger;
  environment?: Record<string, unknown> | (() => Record<string, unknown>);
  functions?: Record<string, (...args: unknown[]) => unknown>;
  /** Allocates node run ids; see `resolveIdGenerator()` for the default. */
  idGenerator?: IdGeneratorService;
  /**
   * The lease the Dispatcher holds on this run. A checkpoint only commits while
   * the run still carries this token, so a worker whose lease expired cannot
   * write over the one that took the run over.
   */
  lease?: { token: string; ttlMs: number };
  /** The request this segment applies; consumed together with its checkpoint. */
  resumeRequest?: WorkflowResumeRequest;
  terminalObserver?: import('./types.js').WorkflowTerminalObserver;
}

/** Node runs per INSERT; a statement is bounded by the driver's bind-parameter limit. */
const NODE_RUN_INSERT_BATCH_SIZE = 100;

type PendingSave = { nodeRun: WorkflowNodeRun; isNew: boolean };
/** Background work a suspended node asked for, to be written with the checkpoint. */
type ScheduledBackground = {
  requestId: WorkflowId;
  nodeRun: WorkflowNodeRun;
  instructionType: string;
};

/** What an `executing` request carries until its work reports a result. */
export interface WorkflowBackgroundPayload {
  /** The execution of the node run the work belongs to. */
  startedAt: string;
}

/** The result a node's background work reports, applied by its `resume()`. */
export interface WorkflowBackgroundResult extends WorkflowBackgroundPayload {
  status: number;
  result: unknown;
  error: string | null;
}

/** The idempotency key of an execution of a node run, shared by its request. */
export function backgroundIdempotencyKey(nodeRun: {
  id: WorkflowId;
  startedAt: string;
}): string {
  return `${String(nodeRun.id)}@${nodeRun.startedAt}`;
}
type ExitIntent = { status: number; output: unknown };

type RerunContext = {
  overwrite: boolean;
  targetNodeRun?: WorkflowNodeRun;
};

function idEquals(left: WorkflowId, right: WorkflowId): boolean {
  return String(left) === String(right);
}

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function isTerminalNodeStatus(status: number): boolean {
  return (
    status === NODE_RUN_STATUS.RESOLVED ||
    status === NODE_RUN_STATUS.FAILED ||
    status === NODE_RUN_STATUS.ERROR ||
    status === NODE_RUN_STATUS.ABORTED
  );
}

export default class Processor {
  static readonly StatusMap: Record<number, number> = {
    [NODE_RUN_STATUS.PENDING]: EXECUTION_STATUS.STARTED,
    [NODE_RUN_STATUS.RESOLVED]: EXECUTION_STATUS.RESOLVED,
    [NODE_RUN_STATUS.FAILED]: EXECUTION_STATUS.FAILED,
    [NODE_RUN_STATUS.ERROR]: EXECUTION_STATUS.ERROR,
    [NODE_RUN_STATUS.ABORTED]: EXECUTION_STATUS.ABORTED,
  };

  readonly database: DatabaseManager;
  readonly workflow: WorkflowDefinition;
  readonly execution: WorkflowRun;
  readonly workflowResourceRoot: string | null;
  readonly services:
    import('./run-services.js').WorkflowRunServices | undefined;
  readonly nodes: WorkflowNode[] = [];
  readonly nodesMap: Map<string, WorkflowNode> = new Map();
  readonly resumeRequest: WorkflowResumeRequest | undefined;
  readonly abortController: AbortController = new AbortController();

  lastSavedNodeRun: WorkflowNodeRun | null = null;
  /** Background work queued for the next checkpoint. */
  private readonly scheduled: ScheduledBackground[] = [];
  /** Background work the last checkpoint stored, for the Dispatcher to start. */
  private readonly committedBackground: WorkflowQueueTask[] = [];

  /**
   * Asks for the node's `background()` to run once this segment's checkpoint
   * has stored the node as pending. The intent is part of that checkpoint — an
   * `executing` resume request written in the same transaction — so a worker
   * that stops before starting the work, or while doing it, leaves something
   * recovery finds instead of a node that waits forever.
   */
  scheduleBackground(nodeRun: WorkflowNodeRun): void {
    const node = this.nodesMap.get(nodeRun.nodeKey);
    if (!node)
      throw new Error(
        `Node "${nodeRun.nodeKey}" was not found in workflow "${this.workflow.key}"`,
      );
    this.scheduled.push({
      requestId: this.idGenerator.generate(),
      nodeRun,
      instructionType: node.type,
    });
  }

  /** Background work stored by the last checkpoint, handed over once. */
  takeBackgroundTasks(): WorkflowQueueTask[] {
    return this.committedBackground.splice(0);
  }

  private readonly connectionName?: string;
  private readonly idGenerator: IdGeneratorService;
  private readonly lease: ProcessorOptions['lease'];
  /**
   * Node runs this segment has produced and not yet written. Nothing reaches
   * the database before the segment exits, in one transaction, so what is
   * stored is always a checkpoint and never a step in between.
   */
  private readonly pendingSaves = new Map<string, PendingSave>();
  /** Ids of rows known to exist, which decides between INSERT and UPDATE. */
  private readonly persistedIds = new Set<string>();
  private exitIntent: ExitIntent | null = null;
  /** Set when the request this segment applies is to be refused, not consumed. */
  private requestRejection: ResumeRequestRejection | null = null;
  /** The request was consumed or rejected by a checkpoint already. */
  private requestSettled = false;
  /**
   * Node runs an overwriting rerun started again under their old id. Requests
   * still live for them were made for the execution being replaced.
   */
  private readonly restartedNodeRunIds = new Set<string>();
  private depth = 0;
  private readonly instructions: Map<string, WorkflowInstructionClass>;
  /** Public so instructions can log on the current workflow / execution channel. */
  readonly logger: WorkflowLogger;
  private readonly environment?: ProcessorOptions['environment'];
  private readonly functions: Record<string, (...args: unknown[]) => unknown>;
  private readonly nodesById = new Map<string, WorkflowNode>();
  private readonly nodeRunsMapByNodeKey: Record<string, WorkflowNodeRun> = {};
  private readonly nodeResultsByNodeKey: Record<string, unknown> = {};
  private rerunContext: RerunContext | null = null;
  private timeoutGuard: ReturnType<typeof setTimeout> | null = null;
  private abortReason: string | null = null;
  private readonly terminalObserver?: import('./types.js').WorkflowTerminalObserver;

  constructor(options: ProcessorOptions) {
    this.resumeRequest = options.resumeRequest;
    this.idGenerator = resolveIdGenerator(options.idGenerator);
    this.lease = options.lease;
    this.database = options.database;
    this.connectionName = options.connectionName;
    this.workflow = options.workflow;
    this.execution = options.execution;
    this.workflowResourceRoot = options.workflowResourceRoot;
    this.services = options.services;
    this.instructions = options.instructions;
    this.logger = bindWorkflowLogger(options.logger ?? noopWorkflowLogger, {
      workflowId: options.workflow.id,
      executionId: options.execution.id,
    });
    this.environment = options.environment;
    this.functions = options.functions ?? {};
    this.terminalObserver = options.terminalObserver;
  }

  get abortSignal(): AbortSignal {
    return this.abortController.signal;
  }

  get store(): WorkflowStore {
    return workflowStore(this.database, this.connectionName);
  }

  abortExecution(reason?: string): void {
    this.abortReason = reason ?? null;
    if (!this.abortSignal.aborted) {
      this.abortController.abort(
        new Error(
          reason === EXECUTION_REASON.TIMEOUT
            ? 'Workflow execution timed out'
            : 'Workflow execution was aborted',
        ),
      );
    }
  }

  createBackgroundAbortHandle(): BackgroundAbortHandle {
    const controller = new AbortController();
    let timeoutGuard: ReturnType<typeof setTimeout> | null = null;
    let sourceListener: (() => void) | null = null;
    const abort = (reason?: unknown) => {
      if (!controller.signal.aborted) {
        controller.abort(reason ?? new Error('Workflow execution was aborted'));
      }
    };

    if (this.abortSignal.aborted) {
      abort(this.abortSignal.reason);
    } else {
      sourceListener = () => abort(this.abortSignal.reason);
      this.abortSignal.addEventListener('abort', sourceListener, {
        once: true,
      });
    }

    const remaining = this.execution.expiresAt
      ? new Date(this.execution.expiresAt).getTime() - Date.now()
      : null;
    if (remaining != null) {
      if (remaining <= 0) {
        abort(new Error('Workflow execution timed out'));
      } else {
        timeoutGuard = setTimeout(
          () => abort(new Error('Workflow execution timed out')),
          remaining,
        );
      }
    }

    return {
      signal: controller.signal,
      dispose: () => {
        if (timeoutGuard) {
          clearTimeout(timeoutGuard);
          timeoutGuard = null;
        }
        if (sourceListener) {
          this.abortSignal.removeEventListener('abort', sourceListener);
          sourceListener = null;
        }
      },
      throwIfAborted: () => {
        if (controller.signal.aborted) {
          throw (
            controller.signal.reason ??
            new Error('Workflow execution was aborted')
          );
        }
      },
    };
  }

  async findPendingNodeRun(
    nodeRunId: WorkflowId,
  ): Promise<WorkflowNodeRun | null> {
    const row = await this.store.nodeRuns.findOne({
      filter: {
        id: asIdFilter(nodeRunId),
        status: NODE_RUN_STATUS.PENDING,
      },
    });
    return row ? hydrateNodeRun(row) : null;
  }

  async prepare(): Promise<void> {
    this.makeNodes(this.workflow.nodes);
    const nodeRuns = await this.store.nodeRuns.findMany({
      filter: { workflowRunId: asIdFilter(this.execution.id) },
      // Ids are allocated in increasing order within a worker, which is what
      // makes the last row of a node key its latest execution.
      sort: (sort) => sort.field('id').asc(),
    });
    this.execution.nodeRuns = nodeRuns.map((row) => hydrateNodeRun(row));
    for (const nodeRun of this.execution.nodeRuns) {
      this.persistedIds.add(String(nodeRun.id));
      this.nodeRunsMapByNodeKey[nodeRun.nodeKey] = nodeRun;
      this.nodeResultsByNodeKey[nodeRun.nodeKey] = nodeRun.result;
    }
  }

  async start(): Promise<WorkflowRun> {
    return this.boundary(async () => {
      if (!(await this.shouldContinueExecution())) {
        return this.execution;
      }
      this.enterRunningState();
      try {
        await this.prepare();
        if (!this.nodes.length) {
          await this.exit(NODE_RUN_STATUS.RESOLVED);
          return this.execution;
        }
        const heads = this.nodes.filter((node) => node.upstreamKey == null);
        if (heads.length !== 1) {
          this.logger.warn(`Expected one head node, found ${heads.length}`, {
            workflowId: this.workflow.id,
          });
          await this.exit(NODE_RUN_STATUS.ERROR, {
            message: `Expected one head node, found ${heads.length} in workflow "${this.workflow.key}"`,
          });
          return this.execution;
        }
        await this.run(heads[0]);
        return this.execution;
      } finally {
        this.leaveRunningState();
      }
    });
  }

  async resume(nodeRun: WorkflowNodeRun): Promise<WorkflowRun> {
    return this.boundary(async () => {
      if (!(await this.shouldContinueExecution())) {
        return this.execution;
      }
      this.enterRunningState();
      try {
        await this.prepare();
        const node = this.nodesMap.get(nodeRun.nodeKey);
        if (!node) {
          throw new Error(
            `Node "${nodeRun.nodeKey}" was not found in workflow "${this.workflow.key}"`,
          );
        }
        await this.recall(node, nodeRun);
        return this.execution;
      } finally {
        this.leaveRunningState();
      }
    });
  }

  async rerun(options: ProcessorRerunOptions = {}): Promise<WorkflowRun> {
    if (this.execution.status !== EXECUTION_STATUS.STARTED) {
      throw new Error(`Execution "${this.execution.id}" is not started`);
    }
    return this.boundary(async () => {
      this.enterRunningState();
      try {
        await this.prepare();
        const node = this.getRerunNode(options);
        const targetNodeRun = this.nodeRunsMapByNodeKey[node.key];
        if (
          (options.nodeKey != null || options.nodeId != null) &&
          !targetNodeRun
        ) {
          throw new Error(
            `Node run of node "${node.key}" was not found in execution "${this.execution.id}"`,
          );
        }
        this.rerunContext = {
          overwrite: options.overwrite === true,
          targetNodeRun,
        };
        const input = node.upstreamKey
          ? this.nodeRunsMapByNodeKey[node.upstreamKey]
          : { result: this.execution.input };
        if (node.upstreamKey && !input) {
          throw new Error(
            `Upstream node run of node "${node.key}" was not found`,
          );
        }
        await this.run(node, input, { rerun: true });
        return this.execution;
      } finally {
        this.rerunContext = null;
        this.leaveRunningState();
      }
    });
  }

  async run(
    node: WorkflowNode,
    input?: WorkflowNodeRun | { result: unknown },
    options: ProcessorRunOptions = {},
  ): Promise<WorkflowNodeRun | null | undefined> {
    return this.boundary(async () => {
      const Instruction = this.instructions.get(node.type);
      if (!Instruction) {
        throw new Error(
          `Instruction "${node.type}" was not found for node "${node.key}"`,
        );
      }
      this.logger.info(
        `Running instruction "${node.type}" for node "${node.key}"`,
        {
          executionId: this.execution.id,
          nodeId: node.id,
          nodeKey: node.key,
        },
      );
      const nodeRun = this.createNodeRun(node);
      const instruction = new Instruction({
        node,
        nodeRun,
        processor: this,
        input,
        signal: this.abortSignal,
      });
      return this.exec(instruction, 'run', node, nodeRun, options);
    });
  }

  async end(
    node: WorkflowNode,
    nodeRun: WorkflowNodeRun,
  ): Promise<WorkflowNodeRun | null | undefined> {
    return this.boundary(async () => {
      const parent = this.findBranchParentNode(node);
      if (parent) {
        return this.recall(parent, nodeRun);
      }
      await this.exit(nodeRun.status, nodeRun.result);
      return null;
    });
  }

  /**
   * Records how this segment ends and, when it is the outermost call, commits.
   *
   * `true` means an inner call already handled the exit and is a no-op. A
   * status of `PENDING` leaves the run started — the segment only handed
   * control back — and any other status is the run's terminal state.
   */
  async exit(
    status?: number | true,
    output: unknown = this.lastSavedNodeRun?.result ?? null,
  ): Promise<null> {
    return this.boundary(async () => {
      this.leaveRunningState();
      if (typeof status === 'number' && !this.exitIntent) {
        this.exitIntent = { status, output };
      }
      return null;
    });
  }

  /**
   * Ends the run as errored, replacing whatever the segment had decided.
   *
   * With `discardUncommitted`, the node runs the segment produced are dropped
   * first. They are what a checkpoint just failed to write, and a failure such
   * as a unique conflict or an oversized value would fail the same way again,
   * leaving the run started with no error recorded.
   */
  async fail(
    output: unknown,
    options: { discardUncommitted?: boolean } = {},
  ): Promise<null> {
    if (options.discardUncommitted) this.pendingSaves.clear();
    // A run that ends has no use for work it was about to start.
    this.scheduled.splice(0);
    this.exitIntent = null;
    return this.exit(NODE_RUN_STATUS.ERROR, output);
  }

  /**
   * Makes the checkpoint refuse the resume request this segment applies, with
   * `reason`, instead of consuming it. For an instruction that finds the
   * request was meant for something other than what is pending now, and for
   * the Dispatcher giving up on a request that keeps failing to commit.
   */
  rejectResumeRequest(reason: ResumeRequestRejection): void {
    if (this.resumeRequest) this.requestRejection = reason;
  }

  /**
   * Updates the node run in memory and queues it for the next checkpoint.
   *
   * Nothing is written here. Looking the record up again before the segment
   * exits therefore reads what this call produced, and looking it up in the
   * database reads the previous checkpoint.
   */
  saveNodeRun(
    payload: WorkflowInstructionResult & {
      nodeId: WorkflowId;
      nodeKey: string;
    },
    existing?: WorkflowNodeRun,
    timing?: { startedAt: string; finishedAt: string },
  ): WorkflowNodeRun {
    const startedAt = timing?.startedAt ?? nowInstant();
    const finishedAt = isTerminalNodeStatus(payload.status)
      ? (timing?.finishedAt ?? startedAt)
      : null;
    const failed =
      payload.status === NODE_RUN_STATUS.FAILED ||
      payload.status === NODE_RUN_STATUS.ERROR ||
      payload.status === NODE_RUN_STATUS.ABORTED;
    const result = failed ? null : (payload.result ?? null);
    const error = failed
      ? (payload.error ??
        (payload.result == null ? null : errorText(payload.result)))
      : null;
    const overwrite =
      existing ??
      (this.rerunContext?.overwrite &&
      this.rerunContext.targetNodeRun &&
      idEquals(this.rerunContext.targetNodeRun.nodeId, payload.nodeId)
        ? this.rerunContext.targetNodeRun
        : undefined);

    const nodeRun: WorkflowNodeRun = overwrite
      ? {
          ...overwrite,
          status: payload.status,
          result,
          error,
          meta: payload.meta ?? null,
          log: payload.log ?? null,
          startedAt,
          finishedAt,
          expiresAt: overwrite.expiresAt,
        }
      : {
          id: this.idGenerator.generate(),
          workflowRunId: this.execution.id,
          nodeId: payload.nodeId,
          nodeKey: payload.nodeKey,
          status: payload.status,
          meta: payload.meta ?? null,
          result,
          error,
          startedAt,
          finishedAt,
          expiresAt: null,
          log: payload.log ?? null,
        };

    const key = String(nodeRun.id);
    this.pendingSaves.set(key, {
      nodeRun,
      isNew: this.pendingSaves.get(key)?.isNew ?? !this.persistedIds.has(key),
    });
    this.lastSavedNodeRun = nodeRun;
    this.nodeRunsMapByNodeKey[nodeRun.nodeKey] = nodeRun;
    this.nodeResultsByNodeKey[nodeRun.nodeKey] = nodeRun.result;
    this.logger.debug(
      `Saved node run "${nodeRun.id}" for node "${nodeRun.nodeKey}"`,
      {
        status: nodeRun.status,
        nodeId: nodeRun.nodeId,
        nodeKey: nodeRun.nodeKey,
      },
    );
    return nodeRun;
  }

  /**
   * Branch heads of a branching node, in a deterministic order.
   *
   * D4: a `branchKey` is a semantic string, never a number, so this sort only
   * guarantees that the same topology always yields the same order — it does
   * NOT define branch execution order. A node that cares about the order in
   * which its branches run (parallel, multi-condition) must derive that order
   * from its own `config` and address branches by key.
   */
  getBranches(node: WorkflowNode): WorkflowNode[] {
    return this.nodes
      .filter(
        (candidate) =>
          candidate.upstreamKey === node.key && candidate.branchKey != null,
      )
      .sort((left, right) => {
        const leftKey = String(left.branchKey);
        const rightKey = String(right.branchKey);
        return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
      });
  }

  findBranchStartNode(
    node: WorkflowNode,
    parent?: WorkflowNode,
  ): WorkflowNode | null {
    for (
      let current: WorkflowNode | undefined = node;
      current;
      current = current.upstream
    ) {
      if (parent ? current.upstream === parent : current.branchKey != null) {
        return current;
      }
    }
    return null;
  }

  findBranchParentNode(node?: WorkflowNode): WorkflowNode | null {
    for (let current = node; current; current = current.upstream) {
      if (current.branchKey != null) {
        return current.upstream ?? null;
      }
    }
    return null;
  }

  findBranchEndNode(node: WorkflowNode): WorkflowNode {
    let current = node;
    while (current.downstream) {
      current = current.downstream;
    }
    return current;
  }

  findBranchParentNodeRun(
    _nodeRun: WorkflowNodeRun,
    node: WorkflowNode,
  ): WorkflowNodeRun | null {
    return this.nodeRunsMapByNodeKey[node.key] ?? null;
  }

  findBranchLastNodeRun(node: WorkflowNode): WorkflowNodeRun | null {
    const nodeRuns: WorkflowNodeRun[] = [];
    for (
      let current: WorkflowNode | undefined = this.findBranchEndNode(node);
      current && current !== node.upstream;
      current = current.upstream
    ) {
      const nodeRun = this.nodeRunsMapByNodeKey[current.key];
      if (nodeRun) {
        nodeRuns.push(nodeRun);
      }
    }
    nodeRuns.sort((left, right) =>
      String(left.id).localeCompare(String(right.id), 'en', { numeric: true }),
    );
    return nodeRuns.at(-1) ?? null;
  }

  getScope(
    sourceNode?: WorkflowNode | WorkflowId,
    includeSelfScope: boolean = false,
  ): Record<string, unknown> {
    const node =
      typeof sourceNode === 'object'
        ? sourceNode
        : sourceNode == null
          ? undefined
          : (this.nodesById.get(String(sourceNode)) ??
            this.nodesMap.get(String(sourceNode)));
    const scopes: Record<string, unknown> = {};
    for (
      let current =
        includeSelfScope && node ? node : this.findBranchParentNode(node);
      current;
      current = this.findBranchParentNode(current)
    ) {}
    const environment =
      typeof this.environment === 'function'
        ? this.environment()
        : (this.environment ?? {});
    const base = {
      $input: this.execution.input,
      $parameters: this.execution.parameters,
      $nodeResults: this.nodeResultsByNodeKey,
      $system: this.functions,
      $scopes: scopes,
      $env: environment,
      $node: node,
    };
    return { ...base, ctx: base };
  }

  getParsedValue(
    value: unknown,
    sourceNode?: WorkflowNode | WorkflowId,
    options: {
      additionalScope?: Record<string, unknown>;
      includeSelfScope?: boolean;
    } = {},
  ): unknown {
    return resolveWorkflowValue(value, {
      ...this.getScope(sourceNode, options.includeSelfScope),
      ...(options.additionalScope ?? {}),
    });
  }

  /** Data-only snapshots shared by run and condition handlers. */
  getHandlerContext(): WorkflowHandlerContext {
    return Object.freeze({
      input: Object.freeze({ ...this.execution.input }),
      parameters: Object.freeze({ ...this.execution.parameters }),
      nodeResults: Object.freeze({ ...this.nodeResultsByNodeKey }),
    });
  }

  getConditionDataBindings(): WorkflowHandlerContext {
    return this.getHandlerContext();
  }

  private makeNodes(nodes: WorkflowNode[]): void {
    this.nodes.splice(0, this.nodes.length, ...nodes);
    this.nodesMap.clear();
    this.nodesById.clear();
    for (const node of nodes) {
      this.nodesMap.set(node.key, node);
      this.nodesById.set(String(node.id), node);
      delete node.upstream;
      delete node.downstream;
    }
    for (const node of nodes) {
      if (node.upstreamKey != null) {
        node.upstream = this.nodesMap.get(node.upstreamKey);
        if (!node.upstream) {
          throw new Error(
            `Upstream node "${node.upstreamKey}" was not found for node "${node.key}"`,
          );
        }
      }
      if (node.downstreamKey != null) {
        node.downstream = this.nodesMap.get(node.downstreamKey);
        if (!node.downstream) {
          throw new Error(
            `Downstream node "${node.downstreamKey}" was not found for node "${node.key}"`,
          );
        }
      }
    }
  }

  private getRerunNode(options: ProcessorRerunOptions): WorkflowNode {
    if (options.nodeKey != null) {
      const node = this.nodesMap.get(options.nodeKey);
      if (node) {
        return node;
      }
      throw new Error(
        `Node "${options.nodeKey}" was not found in workflow "${this.workflow.key}"`,
      );
    }
    if (options.nodeId != null) {
      const node = this.nodesById.get(String(options.nodeId));
      if (node) {
        return node;
      }
      throw new Error(
        `Node "${options.nodeId}" was not found in workflow "${this.workflow.key}"`,
      );
    }
    const node = this.nodes.find((candidate) => candidate.upstreamKey == null);
    if (!node) {
      throw new Error(
        `Head node was not found in workflow "${this.workflow.key}"`,
      );
    }
    return node;
  }

  private async exec(
    instruction: import('./types.js').WorkflowInstruction,
    method: 'run' | 'resume',
    node: WorkflowNode,
    nodeRun: WorkflowNodeRun,
    options: ProcessorRunOptions = {},
  ): Promise<WorkflowNodeRun | null | undefined> {
    // A resumed node is let through when the run was aborted meanwhile: its
    // outcome is what the run is waiting to record, and the abort check below
    // still stops the run from going any further.
    const settling = method === 'resume' && this.abortSignal.aborted;
    if (!settling && !(await this.shouldContinueExecution())) {
      await this.exit(
        this.abortSignal.aborted ? NODE_RUN_STATUS.ABORTED : undefined,
      );
      return null;
    }

    let result: WorkflowInstructionResult | null | void;
    try {
      const runner = instruction[method];
      if (!runner)
        throw new Error(
          `Instruction "${node.type}" does not implement ${method}()`,
        );
      result = await runner.call(instruction);
      if (result === null) {
        // The node handed control back: it is suspended, and the checkpoint has
        // to say so for whoever resumes it.
        this.suspend(nodeRun);
        await this.exit();
        return null;
      }
      if (result === undefined) {
        await this.exit(true);
        return undefined;
      }
      if (result.terminated === true && !isTerminalNodeStatus(result.status)) {
        throw new Error(
          `Instruction "${node.type}" requested workflow termination with non-terminal status ${result.status}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Instruction "${node.type}" failed for node "${node.key}"`,
        { error, nodeId: node.id, nodeKey: node.key },
      );
      result = {
        status: this.abortSignal.aborted
          ? NODE_RUN_STATUS.ABORTED
          : NODE_RUN_STATUS.ERROR,
        error: errorText(error),
      };
    }

    const savedNodeRun = this.saveNodeRun(
      {
        ...result,
        nodeId: node.id,
        nodeKey: node.key,
      },
      nodeRun,
      { startedAt: nodeRun.startedAt, finishedAt: nowInstant() },
    );

    if (this.abortSignal.aborted) {
      await this.exit(NODE_RUN_STATUS.ABORTED, savedNodeRun.result);
      return savedNodeRun;
    }

    if (result.terminated === true) {
      await this.exit(savedNodeRun.status, savedNodeRun.result);
      return savedNodeRun;
    }

    if (savedNodeRun.status === NODE_RUN_STATUS.RESOLVED && node.downstream) {
      return this.run(node.downstream, savedNodeRun, options);
    }
    return this.end(node, savedNodeRun);
  }

  private async recall(
    node: WorkflowNode,
    nodeRun: WorkflowNodeRun,
  ): Promise<WorkflowNodeRun | null | undefined> {
    const Instruction = this.instructions.get(node.type);
    if (!Instruction) {
      throw new Error(
        `Instruction "${node.type}" was not found for node "${node.key}"`,
      );
    }
    if (!Instruction.prototype.resume) {
      throw new Error(`Instruction "${node.type}" does not implement resume()`);
    }
    const parentNodeRun = this.findBranchParentNodeRun(nodeRun, node);
    if (!parentNodeRun) {
      throw new Error(
        `Pending branch parent node run of node "${node.key}" was not found`,
      );
    }
    const instruction = new Instruction({
      node,
      nodeRun: parentNodeRun,
      processor: this,
      input: nodeRun,
      signal: this.abortSignal,
    });
    return this.exec(instruction, 'resume', node, parentNodeRun);
  }

  /**
   * The record a node's execution is carried out against, before it has a
   * result. It exists in memory only: an instruction that returns a result
   * queues that result, and one that suspends is queued as pending by
   * `suspend()`, so a node that is merely entered leaves nothing behind.
   */
  private createNodeRun(node: WorkflowNode): WorkflowNodeRun {
    const target =
      this.rerunContext?.overwrite &&
      this.rerunContext.targetNodeRun &&
      idEquals(this.rerunContext.targetNodeRun.nodeId, node.id)
        ? this.rerunContext.targetNodeRun
        : undefined;
    if (target) this.restartedNodeRunIds.add(String(target.id));
    const nodeRun: WorkflowNodeRun = {
      id: target?.id ?? this.idGenerator.generate(),
      workflowRunId: this.execution.id,
      nodeId: node.id,
      nodeKey: node.key,
      status: NODE_RUN_STATUS.PENDING,
      meta: null,
      result: null,
      error: null,
      startedAt: nowInstant(),
      finishedAt: null,
      expiresAt: target?.expiresAt ?? null,
      log: null,
    };
    this.lastSavedNodeRun = nodeRun;
    this.nodeRunsMapByNodeKey[node.key] = nodeRun;
    this.nodeResultsByNodeKey[node.key] = null;
    return nodeRun;
  }

  /**
   * Queues a node run that is entered and stays pending, unless it already is.
   * A node run an overwriting rerun restarted is stored although its id is: the
   * stored row still describes the execution being replaced, and its new
   * `startedAt` is what tells the two executions' reports apart.
   */
  private suspend(nodeRun: WorkflowNodeRun): void {
    const key = String(nodeRun.id);
    if (this.pendingSaves.has(key)) return;
    if (this.persistedIds.has(key) && !this.restartedNodeRunIds.has(key))
      return;
    this.saveNodeRun(
      {
        status: NODE_RUN_STATUS.PENDING,
        nodeId: nodeRun.nodeId,
        nodeKey: nodeRun.nodeKey,
        meta: nodeRun.meta,
        log: nodeRun.log ?? undefined,
      },
      nodeRun,
      { startedAt: nodeRun.startedAt, finishedAt: nowInstant() },
    );
  }

  /**
   * Runs `operation` as part of the segment in progress and commits when it is
   * the outermost call.
   *
   * Instructions call back into the Processor — a condition runs its branch
   * from inside its own `run()` — so a segment is a tree of nested calls and
   * only its root knows the work is over. A failure propagates without
   * committing: the caller decides whether the segment is worth recording.
   */
  private async boundary<T>(operation: () => Promise<T>): Promise<T> {
    this.depth += 1;
    let outcome: { value: T } | undefined;
    try {
      outcome = { value: await operation() };
    } finally {
      this.depth -= 1;
    }
    if (this.depth === 0) await this.commit();
    return outcome.value;
  }

  /**
   * Writes the segment's checkpoint: its node runs, the run's new state and the
   * consumption of the request it applied, in one transaction.
   *
   * The transaction covers only this write and never the instructions that
   * produced it, so it is short. Its first statement checks that the run is
   * still started and still leased to this worker; if it is not, nothing is
   * written and the segment's results are dropped instead of overwriting
   * whatever happened to the run in the meantime.
   */
  private async commit(): Promise<void> {
    const saves = [...this.pendingSaves.values()];
    const intent = this.exitIntent;
    const resumeRequest = this.requestSettled ? undefined : this.resumeRequest;
    const terminalStatus =
      intent && intent.status !== NODE_RUN_STATUS.PENDING
        ? (Processor.StatusMap[intent.status] ?? Math.sign(intent.status))
        : null;
    const restarted = [...this.restartedNodeRunIds];
    // Work for a node is only worth starting while the run goes on.
    const scheduled = terminalStatus === null ? [...this.scheduled] : [];
    if (
      !saves.length &&
      terminalStatus === null &&
      !resumeRequest &&
      !scheduled.length
    )
      return;

    const reason =
      terminalStatus === EXECUTION_STATUS.ABORTED ? this.abortReason : null;
    let terminal: Awaited<ReturnType<typeof writeWorkflowRunTerminal>> = null;
    try {
      terminal = await this.database.transaction(async (connection) => {
        const store = workflowStoreOf(connection);
        const runId = this.execution.id;
        let event: typeof terminal = null;
        if (terminalStatus !== null) {
          event = await writeWorkflowRunTerminal({
            store,
            runId,
            expectedStatus: EXECUTION_STATUS.STARTED,
            ...(this.lease ? { leaseToken: this.lease.token } : {}),
            status: terminalStatus,
            reason,
            output: intent?.output ?? null,
          });
          if (!event)
            throw new CheckpointConflictError(
              runId,
              'the run is no longer started or its lease was lost',
            );
        } else if (this.lease) {
          // Renewing the lease is what verifies it, and it locks the run row
          // for the rest of the transaction.
          const held = await store.runs.updateMany({
            filter: {
              id: asIdFilter(runId),
              status: EXECUTION_STATUS.STARTED,
              leaseToken: this.lease.token,
            },
            values: {
              leaseExpiresAt: new Date(
                Date.now() + this.lease.ttlMs,
              ).toISOString(),
            },
          });
          if (!held.updatedCount)
            throw new CheckpointConflictError(
              runId,
              'the run is no longer started or its lease was lost',
            );
        } else if (
          !(await store.runs.exists({
            filter: { id: asIdFilter(runId), status: EXECUTION_STATUS.STARTED },
          }))
        ) {
          throw new CheckpointConflictError(
            runId,
            'the run is no longer started',
          );
        }

        const rows = saves
          .filter((save) => save.isNew)
          .map(({ nodeRun }) => ({
            id: asIdFilter(nodeRun.id),
            workflowRunId: asIdFilter(nodeRun.workflowRunId),
            nodeId: asIdFilter(nodeRun.nodeId),
            nodeKey: nodeRun.nodeKey,
            status: nodeRun.status,
            meta: serializeJson(nodeRun.meta ?? null),
            result: serializeJson(nodeRun.result ?? null),
            error: nodeRun.error,
            startedAt: nodeRun.startedAt,
            finishedAt: nodeRun.finishedAt,
            log: nodeRun.log ?? null,
          }));
        for (
          let offset = 0;
          offset < rows.length;
          offset += NODE_RUN_INSERT_BATCH_SIZE
        ) {
          const [first, ...others] = rows.slice(
            offset,
            offset + NODE_RUN_INSERT_BATCH_SIZE,
          );
          await store.nodeRuns.createMany({ values: [first, ...others] });
        }
        for (const { nodeRun } of saves.filter((save) => !save.isNew)) {
          await store.nodeRuns.updateMany({
            filter: { id: asIdFilter(nodeRun.id) },
            values: {
              status: nodeRun.status,
              result: serializeJson(nodeRun.result ?? null),
              error: nodeRun.error,
              meta: serializeJson(nodeRun.meta ?? null),
              log: nodeRun.log ?? null,
              startedAt: nodeRun.startedAt,
              finishedAt: nodeRun.finishedAt,
            },
          });
        }

        // A restarted node run waits for its new execution, so what was asked
        // of the old one is refused here, in the transaction that restarts it.
        // Left live, such a request would hold the node run's only slot and turn
        // the new execution's own report away as busy.
        for (const id of restarted) {
          await store.resumeRequests.updateMany({
            filter: { nodeRunId: asIdFilter(id), slot: 'active' },
            values: {
              state: RESUME_REQUEST_STATE.rejected,
              reason: 'stale',
              slot: null,
              claimToken: null,
              claimedAt: null,
            },
          });
        }

        // After the old requests of a restarted node run are refused, so the
        // slot its new execution's work takes is free.
        for (const { requestId, nodeRun, instructionType } of scheduled) {
          const payload: WorkflowBackgroundPayload = {
            startedAt: nodeRun.startedAt,
          };
          await store.resumeRequests.createOne({
            values: {
              id: asIdFilter(requestId),
              workflowRunId: asIdFilter(runId),
              nodeRunId: asIdFilter(nodeRun.id),
              nodeKey: nodeRun.nodeKey,
              instructionType,
              idempotencyKey: backgroundIdempotencyKey(nodeRun),
              payload: serializeJson(payload),
              payloadHash: hashResumePayload(payload),
              state: RESUME_REQUEST_STATE.executing,
              attempts: 0,
              slot: 'active',
              createdAt: nowInstant(),
              claimToken: null,
              claimedAt: null,
            },
          });
        }

        if (resumeRequest) {
          const rejection = this.requestRejection;
          // Settled only under this segment's own claim; the run lease checked
          // above already implies it, and this keeps the request from relying on
          // that.
          const consumed = await store.resumeRequests.updateMany({
            filter: {
              id: asIdFilter(resumeRequest.id),
              state: RESUME_REQUEST_STATE.processing,
              ...(resumeRequest.claimToken == null
                ? {}
                : { claimToken: resumeRequest.claimToken }),
            },
            values: {
              state: rejection
                ? RESUME_REQUEST_STATE.rejected
                : RESUME_REQUEST_STATE.consumed,
              reason: rejection,
              slot: null,
              claimToken: null,
              claimedAt: null,
            },
          });
          if (!consumed.updatedCount)
            throw new CheckpointConflictError(
              runId,
              `resume request "${String(resumeRequest.id)}" is no longer claimed by this worker`,
            );
        }
        return event;
      }, this.connectionName);
    } catch (error) {
      if (error instanceof CheckpointCommitError) throw error;
      throw new CheckpointCommitError(
        `Execution "${String(this.execution.id)}" checkpoint could not be committed`,
        { cause: error },
      );
    }

    for (const { nodeRun } of saves) this.persistedIds.add(String(nodeRun.id));
    this.pendingSaves.clear();
    this.exitIntent = null;
    if (resumeRequest) this.requestSettled = true;
    this.restartedNodeRunIds.clear();
    this.scheduled.splice(0, scheduled.length);
    for (const { requestId, nodeRun } of scheduled) {
      this.committedBackground.push({
        executionId: this.execution.id,
        nodeRunId: nodeRun.id,
        resumeRequestId: requestId,
      });
    }
    if (terminal && terminalStatus !== null) {
      this.execution.status = terminalStatus;
      this.execution.output = intent?.output ?? null;
      this.execution.reason = reason;
      this.execution.finishedAt = terminal.finishedAt;
      await publishWorkflowTerminal(
        terminal,
        this.terminalObserver,
        this.logger,
      );
    }
  }

  private enterRunningState(): void {
    this.abortReason = null;
    const remaining = this.execution.expiresAt
      ? new Date(this.execution.expiresAt).getTime() - Date.now()
      : null;
    if (remaining == null) {
      return;
    }
    if (remaining <= 0) {
      this.abortExecution(EXECUTION_REASON.TIMEOUT);
      return;
    }
    this.timeoutGuard = setTimeout(
      () => this.abortExecution(EXECUTION_REASON.TIMEOUT),
      remaining,
    );
  }

  private leaveRunningState(): void {
    if (this.timeoutGuard) {
      clearTimeout(this.timeoutGuard);
      this.timeoutGuard = null;
    }
  }

  private async shouldContinueExecution(): Promise<boolean> {
    if (this.abortSignal.aborted) {
      return false;
    }
    const row = await this.store.runs.findOne({
      filter: { id: asIdFilter(this.execution.id) },
      select: (select) => select.fields('status'),
    });
    const status = row?.status == null ? null : Number(row.status);
    if (status !== EXECUTION_STATUS.STARTED) {
      this.execution.status = status;
      return false;
    }
    return true;
  }
}
