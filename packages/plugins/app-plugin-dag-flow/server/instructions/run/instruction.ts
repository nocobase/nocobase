import { bindWorkflowLogger } from '../../engine/logger.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { EXECUTION_REASON, NODE_RUN_STATUS } from '../../engine/constants.js';
import { createNodeExpression } from '../../../dsl/definition.js';
import { moduleSpecifierIssues } from '../module-specifier.js';
import type {
  ConfigIssue,
  NodeExpression,
  WorkflowNodeSourceInput,
} from '../types.js';
import type {
  JsonObject,
  WorkflowLogger,
  WorkflowNode,
} from '../../engine/types.js';
import {
  WorkflowInstruction,
  type WorkflowBackgroundContext,
  type WorkflowInstructionContext,
  type WorkflowInstructionResult,
} from '../base.js';
import type { WorkflowBackgroundResult } from '../../engine/processor.js';
import { logRunExecution } from '../../engine/inspector.js';
import type { WorkflowRunServices } from '../../engine/run-services.js';

export type WorkflowRunJsonValue =
  | null
  | boolean
  | number
  | string
  | WorkflowRunJsonValue[]
  | { [key: string]: WorkflowRunJsonValue };

export type WorkflowRunArgs = Record<string, unknown>;

/**
 * What a run node's script reports back to the node that started it. Its
 * `startedAt` names the execution that produced it: a rerun that overwrites
 * the node run keeps its id, so this is what tells an execution's own result
 * from one a previous execution of the same node run reports late.
 */
export type RunCompletionPayload = WorkflowBackgroundResult;

/** Execution-scoped capabilities passed to a Workflow run module. */
export interface WorkflowRunOptions {
  /** Stable run identity for application-owned work created by a Run node. */
  readonly runId: string;
  /**
   * Identifies this execution of a Run node. Its script runs at least once —
   * it is run again when the worker running it stops before reporting — and
   * keeps this key when it is, so external side effects keyed on it are not
   * repeated. A condition module has none: it runs inside its segment, and a
   * repeated segment evaluates it again under new node run ids.
   */
  readonly idempotencyKey?: string;
  readonly services: WorkflowRunServices;
  readonly signal: AbortSignal;
  readonly logger: WorkflowLogger;
}

export type WorkflowRunFunction = (
  args: unknown,
  options: WorkflowRunOptions,
) => unknown;

export interface WorkflowRunModule {
  run: WorkflowRunFunction;
}

export type RunConfig = JsonObject & {
  module: string;
  args?: JsonObject;
};

const moduleCache = new Map<string, Promise<WorkflowRunModule>>();

/** Whether two stored instants are the same, whatever their text looks like. */
function sameInstant(left: unknown, right: unknown): boolean {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const time = Date.parse(left);
  return !Number.isNaN(time) && time === Date.parse(right);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Hand-written config validation (D3: the first version has no schema library). */
function runConfigIssues(config: unknown): ConfigIssue[] {
  if (config === null || typeof config !== 'object' || Array.isArray(config)) {
    return [{ path: 'config', message: 'run config must be an object' }];
  }
  const record = config as JsonObject;
  const errors: ConfigIssue[] = [];
  for (const key of Object.keys(record)) {
    if (key !== 'module' && key !== 'args') {
      errors.push({
        path: `config.${key}`,
        message: `run config does not accept field "${key}"`,
      });
    }
  }
  errors.push(
    ...moduleSpecifierIssues(record.module, {
      path: 'config.module',
      label: 'run config module',
    }),
  );
  if (record.args !== undefined && !isRecord(record.args)) {
    errors.push({
      path: 'config.args',
      message: 'run config args must be an object',
    });
  }
  return errors;
}

export function validateRunConfig(
  config: JsonObject,
): Record<string, string> | null {
  const issues = runConfigIssues(config);
  const errors = Object.fromEntries(
    issues.map(({ path, message }) => [path.replace(/^config\./, ''), message]),
  );
  return issues.length ? errors : null;
}

function readRunConfig(config: JsonObject): RunConfig {
  const issues = runConfigIssues(config);
  if (issues.length) {
    throw new Error(
      `Invalid run config: ${issues.map(({ message }) => message).join('; ')}`,
    );
  }
  return {
    module: String(config.module),
    ...(config.args === undefined ? {} : { args: config.args as JsonObject }),
  };
}

function describe(value: unknown): string {
  if (typeof value === 'bigint') {
    return 'a BigInt';
  }
  if (typeof value === 'function') {
    return 'a function';
  }
  if (typeof value === 'symbol') {
    return 'a symbol';
  }
  if (typeof value === 'number') {
    return 'a non-finite number';
  }
  return 'a non-plain object';
}

/**
 * Reject anything the nodeRun store could not round-trip through JSON: circular
 * references, BigInt, functions, symbols, non-finite numbers and class
 * instances such as an ORM model.
 */
export function assertWorkflowRunResult(
  value: unknown,
  location: string = 'result',
  ancestors: Set<object> = new Set<object>(),
): void {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'string'
  ) {
    return;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(
        `Run script ${location} is ${describe(value)} and cannot be stored`,
      );
    }
    return;
  }
  if (typeof value !== 'object') {
    throw new Error(
      `Run script ${location} is ${describe(value)} and cannot be stored`,
    );
  }
  if (ancestors.has(value)) {
    throw new Error(
      `Run script ${location} contains a circular reference and cannot be stored`,
    );
  }

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      value.forEach((item, index) =>
        assertWorkflowRunResult(item, `${location}[${index}]`, ancestors),
      );
      return;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error(
        `Run script ${location} is ${describe(value)} and cannot be stored`,
      );
    }
    for (const [key, item] of Object.entries(value)) {
      assertWorkflowRunResult(item, `${location}.${key}`, ancestors);
    }
  } finally {
    ancestors.delete(value);
  }
}

/**
 * `run` — executes a server script that ships with the workflow package.
 *
 * The instruction owns module lookup within the Processor-bound workflow
 * resources, config and result validation, argument resolution, and exception
 * mapping. It does not compile TypeScript or let a module drive the state
 * machine: returning `{ status: 'failed' }` is ordinary business data, never a
 * nodeRun status. Scripts execute after the processor yields and resume the
 * persisted node attempt when they complete.
 */
export class RunInstruction extends WorkflowInstruction<RunConfig> {
  static readonly type: 'run' = 'run';
  static readonly branches: null = null;
  static readonly result: null = null;
  constructor(context: WorkflowInstructionContext) {
    super({ ...context, node: context.node as WorkflowNode<RunConfig> });
  }

  static create(source: WorkflowNodeSourceInput<RunConfig>): NodeExpression {
    return createNodeExpression(RunInstruction, source);
  }

  static validateConfig(config: unknown): ConfigIssue[] {
    return runConfigIssues(config);
  }

  /**
   * Suspends the node and asks for the script to run once the node is stored
   * as pending; see `background()`.
   */
  async run(): Promise<null> {
    this.processor.scheduleBackground(this.nodeRun);
    return null;
  }

  /**
   * Runs the script. It is called on an instruction rebuilt from the stored
   * run, by whichever worker claims the node's `executing` request, so it reads
   * nothing the segment that scheduled it held in memory. A script that throws,
   * or is aborted, is the node's failure and is reported like any result.
   */
  async background(
    context: WorkflowBackgroundContext,
  ): Promise<WorkflowInstructionResult> {
    try {
      context.signal.throwIfAborted();
      const result = await this.execute(context);
      context.signal.throwIfAborted();
      return result;
    } catch (error) {
      this.processor.logger.error(
        `Instruction "run" failed for node "${this.node.key}"`,
        { error, nodeId: this.node.id, nodeKey: this.node.key },
      );
      return {
        status: context.signal.aborted
          ? NODE_RUN_STATUS.ABORTED
          : NODE_RUN_STATUS.ERROR,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async resume(): Promise<WorkflowInstructionResult | null> {
    const request = this.processor.resumeRequest;
    if (
      this.nodeRun.status !== NODE_RUN_STATUS.PENDING ||
      !request ||
      request.instructionType !== RunInstruction.type ||
      String(request.nodeRunId) !== String(this.nodeRun.id)
    )
      return null;
    const completion = request.payload as RunCompletionPayload;
    // The node run is pending, but for a later execution than the one that
    // reported: applying the result would hand the new execution what the old
    // one returned, and consume the request its own result needs. The report
    // is refused and the node keeps waiting.
    if (!sameInstant(completion.startedAt, this.nodeRun.startedAt)) {
      this.processor.rejectResumeRequest('stale');
      return null;
    }
    if (completion.status === NODE_RUN_STATUS.ABORTED) {
      const expired =
        this.processor.execution.expiresAt != null &&
        new Date(this.processor.execution.expiresAt).getTime() <= Date.now();
      this.processor.abortExecution(
        expired ? EXECUTION_REASON.TIMEOUT : undefined,
      );
    }
    return {
      status: completion.status,
      result: completion.result,
      ...(completion.error == null ? {} : { error: completion.error }),
    };
  }

  private async execute({
    signal,
    idempotencyKey,
  }: WorkflowBackgroundContext): Promise<WorkflowInstructionResult> {
    const config = readRunConfig(this.config);
    const args =
      config.args === undefined
        ? this.processor.getHandlerContext()
        : this.processor.getParsedValue(config.args, this.node.id);

    const module = await loadRunModule(
      this.processor.workflowResourceRoot,
      config.module,
      this.node.key,
    );
    const startedAt = performance.now();
    let result: unknown;
    try {
      signal.throwIfAborted();
      if (!this.processor.services) {
        throw new Error(
          `Run node "${this.node.key}" has no application services bound to it`,
        );
      }
      const options: WorkflowRunOptions = Object.freeze({
        runId: String(this.processor.execution.id),
        idempotencyKey,
        services: this.processor.services,
        signal,
        logger: bindWorkflowLogger(this.processor.logger, {
          nodeId: this.node.id,
          nodeKey: this.node.key,
        }),
      });
      result = await module.run(args, options);
      logRunExecution(this.processor.logger, {
        workflowId: this.processor.workflow.id,
        executionId: this.processor.execution.id,
        nodeId: this.node.id,
        nodeKey: this.node.key,
        artifactDigest: this.processor.execution.hash,
        module: config.module,
        durationMs: performance.now() - startedAt,
        status: 'success',
      });
    } catch (error) {
      logRunExecution(this.processor.logger, {
        workflowId: this.processor.workflow.id,
        executionId: this.processor.execution.id,
        nodeId: this.node.id,
        nodeKey: this.node.key,
        artifactDigest: this.processor.execution.hash,
        module: config.module,
        durationMs: performance.now() - startedAt,
        status: signal.aborted ? 'aborted' : 'error',
      });
      throw error;
    }

    // `undefined` would otherwise collide with the instruction protocol's
    // "no return value means exit silently", so normalize it to `null`.
    const normalized = result === undefined ? null : result;
    assertWorkflowRunResult(normalized);
    return { status: NODE_RUN_STATUS.RESOLVED, result: normalized };
  }
}

export async function loadRunModule(
  workflowResourceRoot: string | null,
  specifier: string,
  nodeKey: string,
): Promise<WorkflowRunModule> {
  if (!workflowResourceRoot) {
    throw new Error(
      `Run node "${nodeKey}" has no workflow resource root bound to it`,
    );
  }
  const target = await resolveWorkflowModule(workflowResourceRoot, specifier);
  const cached = moduleCache.get(target);
  if (cached) return cached;
  const pending = importRunModule(target, specifier);
  moduleCache.set(target, pending);
  return pending;
}

function resolveInsideRoot(
  root: string,
  relativePath: string,
  specifier: string,
): string {
  const target = path.resolve(root, relativePath);
  const relative = path.relative(root, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Run module "${specifier}" resolves outside its artifact`);
  }
  return target;
}

async function resolveWorkflowModule(
  root: string,
  specifier: string,
): Promise<string> {
  const base = resolveInsideRoot(root, specifier, specifier);
  for (const extension of ['.js', '.mjs', '.ts']) {
    const target = `${base}${extension}`;
    try {
      const realRoot = await fs.realpath(root);
      const realTarget = await fs.realpath(target);
      const relative = path.relative(realRoot, realTarget);
      if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(
          `Run module "${specifier}" resolves outside its workflow resources`,
        );
      }
      return realTarget;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  throw new Error(`Run module "${specifier}" was not found`);
}

async function importRunModule(
  target: string,
  specifier: string,
): Promise<WorkflowRunModule> {
  const loaded = (await import(pathToFileURL(target).href)) as Record<
    string,
    unknown
  >;
  if (typeof loaded.run !== 'function') {
    throw new Error(
      `Run module "${specifier}" must export a function named run`,
    );
  }
  return { run: loaded.run as WorkflowRunFunction };
}
