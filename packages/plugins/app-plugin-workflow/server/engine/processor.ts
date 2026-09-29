import { bindWorkflowLogger } from './logger.js';
import type { DatabaseManager } from '@nocobase/db';

import { workflowStore, type WorkflowStore } from '../collections/store.js';
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
import { finalizeWorkflowRun } from './finalize-run.js';

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
  resumeNode?: (nodeRunId: WorkflowId) => Promise<void>;
  terminalObserver?: import('./types.js').WorkflowTerminalObserver;
}

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
  readonly resumeNode: ProcessorOptions['resumeNode'];
  readonly abortController: AbortController = new AbortController();

  lastSavedNodeRun: WorkflowNodeRun | null = null;
  private readonly deferredTasks: Array<() => Promise<void>> = [];

  defer(task: () => Promise<void>): void {
    this.deferredTasks.push(task);
  }

  takeDeferredTasks(): Array<() => Promise<void>> {
    return this.deferredTasks.splice(0);
  }

  private readonly connectionName?: string;
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
    this.resumeNode = options.resumeNode;
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
      sort: (sort) => sort.field('id').asc(),
    });
    this.execution.nodeRuns = nodeRuns.map((row) => hydrateNodeRun(row));
    for (const nodeRun of this.execution.nodeRuns) {
      this.nodeRunsMapByNodeKey[nodeRun.nodeKey] = nodeRun;
      this.nodeResultsByNodeKey[nodeRun.nodeKey] = nodeRun.result;
    }
  }

  async start(): Promise<WorkflowRun> {
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
  }

  async resume(nodeRun: WorkflowNodeRun): Promise<WorkflowRun> {
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
  }

  async rerun(options: ProcessorRerunOptions = {}): Promise<WorkflowRun> {
    if (this.execution.status !== EXECUTION_STATUS.STARTED) {
      throw new Error(`Execution "${this.execution.id}" is not started`);
    }
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
  }

  async run(
    node: WorkflowNode,
    input?: WorkflowNodeRun | { result: unknown },
    options: ProcessorRunOptions = {},
  ): Promise<WorkflowNodeRun | null | undefined> {
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
    const nodeRun = await this.createNodeRun(node);
    const instruction = new Instruction({
      node,
      nodeRun,
      processor: this,
      input,
      signal: this.abortSignal,
    });
    return this.exec(instruction, 'run', node, nodeRun, options);
  }

  async end(
    node: WorkflowNode,
    nodeRun: WorkflowNodeRun,
  ): Promise<WorkflowNodeRun | null | undefined> {
    const parent = this.findBranchParentNode(node);
    if (parent) {
      return this.recall(parent, nodeRun);
    }
    await this.exit(nodeRun.status, nodeRun.result);
    return null;
  }

  async exit(
    status?: number | true,
    output: unknown = this.lastSavedNodeRun?.result ?? null,
  ): Promise<null> {
    this.leaveRunningState();
    if (status === true) {
      return null;
    }
    if (typeof status !== 'number') {
      return null;
    }

    const executionStatus = Processor.StatusMap[status] ?? Math.sign(status);
    const reason =
      executionStatus === EXECUTION_STATUS.ABORTED ? this.abortReason : null;
    const terminal = await finalizeWorkflowRun({
      store: this.store,
      runId: this.execution.id,
      expectedStatus: EXECUTION_STATUS.STARTED,
      status: executionStatus,
      reason,
      output,
      observer: this.terminalObserver,
      logger: this.logger,
    });
    if (terminal) {
      this.execution.status = executionStatus;
      this.execution.output = output;
      this.execution.reason = reason;
      this.execution.finishedAt = terminal.finishedAt;
    }
    return null;
  }

  async saveNodeRun(
    payload: WorkflowInstructionResult & {
      nodeId: WorkflowId;
      nodeKey: string;
    },
    existing?: WorkflowNodeRun,
    timing?: { startedAt: string; finishedAt: string },
  ): Promise<WorkflowNodeRun> {
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

    let nodeRun: WorkflowNodeRun;
    if (overwrite) {
      await this.store.nodeRuns.updateMany({
        filter: { id: asIdFilter(overwrite.id) },
        values: {
          status: payload.status,
          result: serializeJson(result),
          error,
          meta: serializeJson(payload.meta ?? null),
          log: payload.log ?? null,
          startedAt,
          finishedAt,
        },
      });
      nodeRun = {
        ...overwrite,
        status: payload.status,
        result,
        error,
        meta: payload.meta ?? null,
        log: payload.log ?? null,
        startedAt,
        finishedAt,
        expiresAt: overwrite.expiresAt,
      };
    } else {
      // `createOne` hands back the row it wrote, on every dialect, which is why
      // there is no read-back here. There used to be one — "newest row of this
      // node in this run" — and it was only sound while a single processor
      // owned an execution, because two processes racing on the same execution
      // could read each other's row.
      const created = await this.store.nodeRuns.createOne({
        values: {
          workflowRunId: asIdFilter(this.execution.id),
          nodeId: asIdFilter(payload.nodeId),
          nodeKey: payload.nodeKey,
          status: payload.status,
          meta: serializeJson(payload.meta ?? null),
          result: serializeJson(result),
          error,
          startedAt,
          finishedAt,
          log: payload.log ?? null,
        },
      });
      nodeRun = hydrateNodeRun(created.record);
    }

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
    if (!(await this.shouldContinueExecution())) {
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

    const savedNodeRun = await this.saveNodeRun(
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

  private async createNodeRun(node: WorkflowNode): Promise<WorkflowNodeRun> {
    return this.saveNodeRun({
      nodeId: node.id,
      nodeKey: node.key,
      status: NODE_RUN_STATUS.PENDING,
    });
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
