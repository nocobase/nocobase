import { bindWorkflowLogger } from '../../engine/logger.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { EXECUTION_REASON, NODE_RUN_STATUS } from '../../engine/constants.js';
import { asIdFilter, serializeJson } from '../../engine/utils.js';
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
  type WorkflowInstructionContext,
  type WorkflowInstructionResult,
} from '../base.js';
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

/** Execution-scoped capabilities passed to a Workflow run module. */
export interface WorkflowRunOptions {
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

  async run(): Promise<null> {
    if (!this.processor.resumeNode) {
      throw new Error('Run nodes require a dispatcher resume callback');
    }
    this.processor.defer(async () => {
      const abort = this.processor.createBackgroundAbortHandle();
      let result: WorkflowInstructionResult;
      try {
        abort.throwIfAborted();
        result = await this.execute(abort.signal);
        abort.throwIfAborted();
      } catch (error) {
        this.processor.logger.error(
          `Instruction "run" failed for node "${this.node.key}"`,
          { error, nodeId: this.node.id, nodeKey: this.node.key },
        );
        result = {
          status: abort.signal.aborted
            ? NODE_RUN_STATUS.ABORTED
            : NODE_RUN_STATUS.ERROR,
          error: error instanceof Error ? error.message : String(error),
        };
      } finally {
        abort.dispose();
      }
      const saved = await this.processor.store.nodeRuns.updateMany({
        filter: {
          id: asIdFilter(this.nodeRun.id),
          status: NODE_RUN_STATUS.PENDING,
        },
        values: {
          status: result.status,
          result: serializeJson(result.result ?? null),
          error: result.error ?? null,
          meta: serializeJson({ runCompletion: true }),
          finishedAt: new Date().toISOString(),
        },
      });
      if (saved.updatedCount === 0) return;
      await this.processor.resumeNode?.(this.nodeRun.id);
    });
    return null;
  }

  async resume(): Promise<WorkflowInstructionResult | null> {
    if (
      this.nodeRun.status === NODE_RUN_STATUS.PENDING ||
      !isRecord(this.nodeRun.meta) ||
      this.nodeRun.meta.runCompletion !== true ||
      !this.input ||
      !('id' in this.input) ||
      String(this.input.id) !== String(this.nodeRun.id)
    )
      return null;
    if (this.nodeRun.status === NODE_RUN_STATUS.ABORTED) {
      const expired =
        this.processor.execution.expiresAt != null &&
        new Date(this.processor.execution.expiresAt).getTime() <= Date.now();
      this.processor.abortExecution(
        expired ? EXECUTION_REASON.TIMEOUT : undefined,
      );
    }
    return {
      status: this.nodeRun.status,
      result: this.nodeRun.result,
      ...(this.nodeRun.error == null ? {} : { error: this.nodeRun.error }),
    };
  }

  private async execute(
    signal: AbortSignal,
  ): Promise<WorkflowInstructionResult> {
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
