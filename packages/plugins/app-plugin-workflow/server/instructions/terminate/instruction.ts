import { NODE_RUN_STATUS } from '../../engine/constants.js';
import type { JsonObject } from '../../engine/types.js';
import {
  WorkflowInstruction,
  type WorkflowInstructionContext,
  type WorkflowInstructionResult,
} from '../base.js';
import { createNodeExpression } from '../../../dsl/definition.js';
import type {
  ConfigIssue,
  NodeExpression,
  WorkflowNodeSourceInput,
} from '../types.js';

export const TERMINATE_OUTCOMES: {
  readonly success: 'success';
  readonly failure: 'failure';
} = {
  success: 'success',
  failure: 'failure',
};

export type TerminateOutcome =
  (typeof TERMINATE_OUTCOMES)[keyof typeof TERMINATE_OUTCOMES];
export type TerminateConfig = JsonObject & { outcome?: TerminateOutcome };

function terminateConfigIssues(config: unknown): ConfigIssue[] {
  if (config === null || typeof config !== 'object' || Array.isArray(config)) {
    return [{ path: 'config', message: 'terminate config must be an object' }];
  }
  const record = config as Record<string, unknown>;
  const issues: ConfigIssue[] = [];
  for (const key of Object.keys(record)) {
    if (key !== 'outcome') {
      issues.push({
        path: `config.${key}`,
        message: `terminate config does not accept field "${key}"`,
      });
    }
  }
  if (
    record.outcome !== undefined &&
    record.outcome !== TERMINATE_OUTCOMES.success &&
    record.outcome !== TERMINATE_OUTCOMES.failure
  ) {
    issues.push({
      path: 'config.outcome',
      message: 'terminate config outcome must be "success" or "failure"',
    });
  }
  return issues;
}

export function validateTerminateConfig(config: unknown): ConfigIssue[] {
  return terminateConfigIssues(config);
}

function readTerminateConfig(config: JsonObject): TerminateConfig {
  const issues = terminateConfigIssues(config);
  if (issues.length) {
    throw new Error(
      `Invalid terminate config: ${issues.map(({ path, message }) => `${path}: ${message}`).join('; ')}`,
    );
  }
  return config.outcome === TERMINATE_OUTCOMES.failure
    ? { outcome: TERMINATE_OUTCOMES.failure }
    : {};
}

export class TerminateInstruction extends WorkflowInstruction<TerminateConfig> {
  static readonly type = 'terminate' as const;
  static readonly branches: null = null;
  static readonly result: null = null;

  constructor(context: WorkflowInstructionContext) {
    super({ ...context, node: context.node });
  }

  static create(
    source: WorkflowNodeSourceInput<TerminateConfig>,
  ): NodeExpression {
    return createNodeExpression(TerminateInstruction, source);
  }

  static validateConfig(config: unknown): ConfigIssue[] {
    return terminateConfigIssues(config);
  }

  async run(): Promise<WorkflowInstructionResult> {
    const config = readTerminateConfig(this.config);
    return {
      status:
        config.outcome === TERMINATE_OUTCOMES.failure
          ? NODE_RUN_STATUS.FAILED
          : NODE_RUN_STATUS.RESOLVED,
      terminated: true,
    };
  }
}

export default TerminateInstruction;
