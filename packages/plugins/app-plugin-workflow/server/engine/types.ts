import type { DatabaseManager } from '@nocobase/db';
import type { JobExecutor } from '@nocobase/jobs';
import type { WorkflowRunServices } from './run-services.js';

import type {
  WorkflowParameterSchema,
  WorkflowParameterValues,
} from '../../shared/parameters.js';
import type { WorkflowInputSchema } from './invocation.js';
import type { WorkflowArtifactStore } from '../loader/artifact-store.js';
import type {
  WorkflowNodeOptions,
  WorkflowClientSource,
} from '../instructions/types.js';
export {
  WorkflowInstruction,
  type WorkflowInstructionClass,
  type WorkflowInstructionContext,
  type WorkflowInstructionResult,
} from '../instructions/base.js';

export type WorkflowId = number | string;
export type JsonPrimitive = null | boolean | number | string;
export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;
export interface JsonObject {
  [key: string]: JsonValue;
}

export interface WorkflowNode<TConfig extends JsonObject = JsonObject> {
  id: WorkflowId;
  key: string;
  title: string | null;
  description: string | null;
  workflowId: WorkflowId;
  upstreamKey: string | null;
  branchKey: string | null;
  downstreamKey: string | null;
  type: string;
  config: TConfig;
  options: WorkflowNodeOptions;
  upstream?: WorkflowNode;
  downstream?: WorkflowNode;
}

export interface WorkflowDefinition {
  id: WorkflowId;
  key: string;
  hash: string | null;
  version: string | null;
  title: string | null;
  enabled: boolean;
  description: string | null;
  inputSchema: WorkflowInputSchema;
  parametersSchema: WorkflowParameterSchema;
  parameterValues: WorkflowParameterValues;
  client?: WorkflowClientSource;
  current: boolean | null;
  options: JsonObject;
  nodes: WorkflowNode[];
}

export interface WorkflowRun {
  id: WorkflowId;
  workflowId: WorkflowId;
  workflowKey: string;
  hash: string | null;
  eventKey: string;
  input: JsonObject;
  parameters: WorkflowParameterValues;
  status: number | null;
  dispatched: boolean;
  parentRunId: WorkflowId | null;
  stack: WorkflowId[];
  output: unknown;
  startedAt: string | null;
  finishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  manually: boolean;
  reason: string | null;
  sourceType: string | null;
  sourceId: string | null;
  workflow?: WorkflowDefinition;
  nodeRuns?: WorkflowNodeRun[];
}

export interface WorkflowNodeRun {
  id: WorkflowId;
  workflowRunId: WorkflowId;
  nodeId: WorkflowId;
  nodeKey: string;
  status: number;
  meta: unknown;
  result: unknown;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
  expiresAt: string | null;
  log: string | null;
  execution?: WorkflowRun;
}

export interface WorkflowLogger {
  debug(message: string, details?: unknown): void;
  info(message: string, details?: unknown): void;
  warn(message: string, details?: unknown): void;
  error(message: string, details?: unknown): void;
}

export interface WorkflowEventOptions {
  eventKey?: string;
  deferred?: boolean;
  /** Return after persisting a manual run while the runtime tracks its execution. */
  waitForCompletion?: boolean;
  /** Execute any workflow manually, bypassing its enabled state and trigger-specific event validation. */
  manually?: boolean;
  force?: boolean;
  stack?: WorkflowId[];
  parentRunId?: WorkflowId;
  parameterValues?: WorkflowParameterValues;
  sourceType?: string;
  sourceId?: string;
  onTriggerFail?: (
    workflow: WorkflowDefinition,
    input: unknown,
    options: WorkflowEventOptions,
    error?: unknown,
  ) => void | Promise<void>;
}

export interface WorkflowExecutionQueueTask {
  executionId: WorkflowId;
  nodeRunId?: WorkflowId;
  rerun?: ProcessorRerunOptions;
}

export type WorkflowQueueTask = WorkflowExecutionQueueTask;

export interface WorkflowQueue {
  publish(task: WorkflowQueueTask): Promise<void>;
}

export interface ProcessorRerunOptions {
  nodeKey?: string;
  nodeId?: WorkflowId;
  overwrite?: boolean;
}

export interface WorkflowEngineOptions {
  database: DatabaseManager;
  connectionName?: string;
  logger?: WorkflowLogger;
  environment?: Record<string, unknown> | (() => Record<string, unknown>);
  functions?: Record<string, (...args: unknown[]) => unknown>;
  /** Read-only application services exposed to `run` modules. */
  services?: WorkflowRunServices;
  /** Immutable production artifacts. When present, run nodes never read source directories. */
  artifactStore?: WorkflowArtifactStore;
  /** Development-only root containing one source package per workflow key. */
  developmentResourceRoot?: string;

  // --- T5: fields the assembly layer needs. All optional, so the meaning of
  // every field declared before this point is unchanged. ---

  /**
   * Executor tasks are published to and consumed from. The engine owns its
   * lifecycle: `initialize()` sets it up as a consumer and `dispose()` shuts it
   * down. Without it the runtime dispatches in-process (`Dispatcher.enqueue()`
   * falls through to `dispatch()`), which is useful for a single-process test.
   */
  executor?: JobExecutor;
  /** `false` keeps the reaper from being created at all; default is enabled. */
  timeoutReaper?: boolean;
  /** Forwarded to `createTimeoutReaper()`. */
  timeoutReaperIntervalMs?: number;
  /** Forwarded to `createTimeoutReaper()`. */
  timeoutReaperBatchSize?: number;
  /** Forwarded to `Dispatcher.recover()` during initialization. */
  recoverGracePeriod?: number;
  terminalObserver?: WorkflowTerminalObserver;
}

export interface WorkflowTerminalEvent {
  readonly runId: WorkflowId;
  readonly status: number;
  readonly reason: string | null;
  readonly output: unknown;
  readonly finishedAt: string;
  readonly sourceType: string | null;
  readonly sourceId: string | null;
}

export type WorkflowTerminalObserver = (
  event: WorkflowTerminalEvent,
) => void | Promise<void>;
