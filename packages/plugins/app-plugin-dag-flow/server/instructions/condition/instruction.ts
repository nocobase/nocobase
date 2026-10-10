import { createNodeExpression } from '../../../dsl/definition.js';
import type {
  ConfigIssue,
  NodeExpression,
  NodeResultSchema,
  WorkflowNodeSourceInput,
} from '../types.js';
import { NODE_RUN_STATUS } from '../../engine/constants.js';
import { moduleSpecifierIssues } from '../module-specifier.js';
import { loadRunModule } from '../run/instruction.js';
import type { WorkflowRunOptions } from '../run/instruction.js';
import { WorkflowInstruction } from '../base.js';
import type {
  WorkflowInstructionContext,
  WorkflowInstructionResult,
} from '../base.js';
import type {
  JsonObject,
  WorkflowNode,
  WorkflowNodeRun,
} from '../../engine/types.js';

export const CONDITION_BRANCH_KEYS: { readonly yes: 'yes'; readonly no: 'no' } =
  { yes: 'yes', no: 'no' };
export type ConditionBranchKey =
  (typeof CONDITION_BRANCH_KEYS)[keyof typeof CONDITION_BRANCH_KEYS];

export type ConditionConfig = JsonObject & { module: string };

function conditionConfigIssues(config: unknown): ConfigIssue[] {
  if (config === null || typeof config !== 'object' || Array.isArray(config)) {
    return [{ path: 'config', message: 'condition config must be an object' }];
  }
  const record = config as JsonObject;
  const issues: ConfigIssue[] = [];
  for (const key of Object.keys(record)) {
    if (key !== 'module') {
      issues.push({
        path: `config.${key}`,
        message: `condition config does not accept field "${key}"`,
      });
    }
  }
  issues.push(
    ...moduleSpecifierIssues(record.module, {
      path: 'config.module',
      label: 'condition config module',
    }),
  );
  return issues;
}

function readConditionConfig(config: JsonObject): ConditionConfig {
  const issues = conditionConfigIssues(config);
  if (issues.length) {
    throw new Error(
      `Invalid condition config: ${issues
        .map(({ path, message }) => `${path}: ${message}`)
        .join('; ')}`,
    );
  }
  // Validated above, so this is a string; the cast keeps the narrowing local.
  return { module: config.module as string };
}

export function validateConditionConfig(
  config: JsonObject,
): Record<string, string> | null {
  const issues = conditionConfigIssues(config);
  const errors = Object.fromEntries(
    issues.map(({ path, message }) => [path.replace(/^config\./, ''), message]),
  );
  return issues.length ? errors : null;
}

/**
 * `condition` — runs a handler that decides which branch to enter.
 *
 * The decision is code that ships with the workflow package rather than a
 * serialized expression: the handler receives the run's data bindings and
 * returns a boolean, so anything it needs to compute is ordinary TypeScript
 * that the source checker typechecks along with the rest of the package.
 */
export class ConditionInstruction extends WorkflowInstruction<ConditionConfig> {
  static readonly type: 'condition' = 'condition';
  static readonly branches: readonly ['yes', 'no'] = ['yes', 'no'];
  static readonly branching: true = true;
  static readonly result: NodeResultSchema = {
    type: 'boolean',
    description: 'The evaluated condition result.',
  };

  constructor(context: WorkflowInstructionContext) {
    super({
      ...context,
      node: context.node as WorkflowNode<ConditionConfig>,
    });
  }

  static create(
    source: WorkflowNodeSourceInput<ConditionConfig>,
  ): NodeExpression<ConditionBranchKey> {
    return createNodeExpression(ConditionInstruction, source);
  }

  static validateConfig(config: unknown): ConfigIssue[] {
    return conditionConfigIssues(config);
  }

  async run(): Promise<WorkflowInstructionResult | void> {
    const config = readConditionConfig(this.config);
    const module = await loadRunModule(
      this.processor.workflowResourceRoot,
      config.module,
      this.node.key,
    );
    if (!this.processor.services) {
      throw new Error(
        `Condition node "${this.node.key}" has no application services bound to it`,
      );
    }
    const options: WorkflowRunOptions = Object.freeze({
      runId: String(this.processor.execution.id),
      services: this.processor.services,
      signal: this.signal,
      logger: this.processor.logger,
    });
    const evaluated = await module.run(
      this.processor.getHandlerContext(),
      options,
    );
    if (typeof evaluated !== 'boolean') {
      throw new TypeError(
        `Condition module "${config.module}" must return a boolean, received ${evaluated === null ? 'null' : typeof evaluated}`,
      );
    }
    const branchKey = evaluated
      ? CONDITION_BRANCH_KEYS.yes
      : CONDITION_BRANCH_KEYS.no;
    const branch = this.processor
      .getBranches(this.node)
      .find((candidate) => candidate.branchKey === branchKey);
    const result = { status: NODE_RUN_STATUS.RESOLVED, result: evaluated };
    if (!branch) return result;

    const savedNodeRun = this.processor.saveNodeRun(
      { ...result, nodeId: this.node.id, nodeKey: this.node.key },
      this.nodeRun,
      {
        startedAt: this.nodeRun.startedAt,
        finishedAt: new Date().toISOString(),
      },
    );
    await this.processor.run(branch, savedNodeRun);
  }

  async resume(): Promise<null | void> {
    if (!this.input || !('status' in this.input))
      throw new Error(
        `Condition node "${this.node.key}" was resumed without a branch nodeRun`,
      );
    const branchNodeRun: WorkflowNodeRun = this.input;
    let parentNodeRun = this.processor.findBranchParentNodeRun(
      branchNodeRun,
      this.node,
    );
    if (!parentNodeRun)
      throw new Error(`Condition node "${this.node.key}" has no nodeRun`);
    // Executions started before this behavior change may still have a pending condition.
    if (parentNodeRun.status === NODE_RUN_STATUS.PENDING) {
      parentNodeRun = this.processor.saveNodeRun(
        {
          nodeId: this.node.id,
          nodeKey: this.node.key,
          status: NODE_RUN_STATUS.RESOLVED,
          result: parentNodeRun.result,
          meta: parentNodeRun.meta,
          log: parentNodeRun.log ?? undefined,
        },
        parentNodeRun,
        {
          startedAt: parentNodeRun.startedAt,
          finishedAt: new Date().toISOString(),
        },
      );
    }
    if (branchNodeRun.status === NODE_RUN_STATUS.PENDING) return null;
    if (branchNodeRun.status === NODE_RUN_STATUS.RESOLVED) {
      if (this.node.downstream) {
        await this.processor.run(this.node.downstream, parentNodeRun);
      } else {
        await this.processor.end(this.node, parentNodeRun);
      }
      return;
    }
    // Propagate the branch outcome without overwriting the condition result.
    await this.processor.end(this.node, branchNodeRun);
  }
}

export default ConditionInstruction;
