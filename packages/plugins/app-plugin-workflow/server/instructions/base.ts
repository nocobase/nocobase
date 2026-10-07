import type Processor from '../engine/processor.js';
import type {
  JsonObject,
  WorkflowNode,
  WorkflowNodeRun,
} from '../engine/types.js';
import type {
  ConfigIssue,
  NodeExpression,
  NodeResultSchema,
  WorkflowNodeSourceInput,
} from './types.js';

export interface WorkflowInstructionResult {
  status: number;
  result?: unknown;
  error?: string;
  meta?: unknown;
  log?: string;
  /** Indicates that this result finishes the workflow after the node run is persisted. */
  terminated?: true;
}

export interface WorkflowInstructionContext<
  TConfig extends JsonObject = JsonObject,
> {
  readonly node: WorkflowNode<TConfig>;
  readonly nodeRun: WorkflowNodeRun;
  readonly processor: Processor;
  readonly input: WorkflowNodeRun | { result: unknown } | undefined;
  readonly signal: AbortSignal;
}

export abstract class WorkflowInstruction<
  TConfig extends JsonObject = JsonObject,
> {
  readonly node: WorkflowNode<TConfig>;
  readonly nodeRun: WorkflowNodeRun;
  readonly processor: Processor;
  readonly input: WorkflowNodeRun | { result: unknown } | undefined;
  readonly signal: AbortSignal;

  constructor(context: WorkflowInstructionContext<TConfig>) {
    this.node = context.node;
    this.nodeRun = context.nodeRun;
    this.processor = context.processor;
    this.input = context.input;
    this.signal = context.signal;
  }

  get config(): TConfig {
    return this.node.config;
  }

  abstract run(): Promise<WorkflowInstructionResult | null | void>;
  resume?(): Promise<WorkflowInstructionResult | null | void>;
  /**
   * The node's own work done outside the run, for an instruction whose `run()`
   * suspended with `processor.scheduleBackground()`. It is called on an
   * instruction rebuilt from the stored run — never on the one that scheduled
   * it — after the suspending checkpoint has committed, by whichever worker
   * claims it, and again if that worker stops before reporting: it runs at
   * least once. What it returns is applied by `resume()`.
   */
  background?(
    context: WorkflowBackgroundContext,
  ): Promise<WorkflowInstructionResult>;
}

/** What one execution of an instruction's `background()` is given. */
export interface WorkflowBackgroundContext {
  /** Aborted when the run is cancelled or times out. */
  readonly signal: AbortSignal;
  /**
   * Identifies this execution of the node, and stays the same when the work is
   * repeated after a worker stopped. Key external side effects on it.
   */
  readonly idempotencyKey: string;
}

/** What the engine passes an instruction's `createApi`. */
export interface WorkflowInstructionApiContext {
  database: import('@nocobase/db').DatabaseManager;
  connectionName?: string;
  enqueue: (
    task: import('../engine/types.js').WorkflowQueueTask,
  ) => Promise<void>;
  resumeRequests: import('../engine/resume-requests.js').ResumeRequestService;
}

/**
 * The runtime API of each instruction type that has one, which is what
 * `getInstructionApi(type)` returns. A plugin registering an instruction with an
 * API adds its entry by declaration merging.
 */
export interface WorkflowInstructionApis {
  wait: import('./wait/api.js').WaitInstructionApi;
}

export interface WorkflowInstructionClass<
  TConfig extends JsonObject = JsonObject,
  TBranch extends string = string,
> {
  readonly type: string;
  readonly branches:
    readonly TBranch[] | null | ((config: JsonObject) => readonly string[]);
  readonly result?: NodeResultSchema | null;
  create(source: WorkflowNodeSourceInput<TConfig>): NodeExpression<TBranch>;
  validateConfig(config: unknown): ConfigIssue[];
  /** Builds the API `getInstructionApi(type)` hands to application code. */
  createApi?: (context: WorkflowInstructionApiContext) => object;
  new (
    context: WorkflowInstructionContext<TConfig>,
  ): WorkflowInstruction<TConfig>;
}
