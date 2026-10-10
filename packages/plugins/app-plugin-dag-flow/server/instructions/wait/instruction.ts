import { NODE_RUN_STATUS } from '../../engine/constants.js';
import type { JsonObject } from '../../engine/types.js';
import { createNodeExpression } from '../../../dsl/definition.js';
import {
  WorkflowInstruction,
  type WorkflowInstructionApiContext,
  type WorkflowInstructionResult,
} from '../base.js';
import type {
  ConfigIssue,
  NodeExpression,
  WorkflowNodeSourceInput,
} from '../types.js';
import { WaitInstructionApi, type WaitResumePayload } from './api.js';

export type WaitConfig = JsonObject & { correlation?: unknown };

export class WaitInstruction extends WorkflowInstruction<WaitConfig> {
  static readonly type = 'wait' as const;
  static readonly branches: null = null;
  static readonly result: null = null;
  static readonly createApi = (
    context: WorkflowInstructionApiContext,
  ): WaitInstructionApi => new WaitInstructionApi(context);

  static create(source: WorkflowNodeSourceInput<WaitConfig>): NodeExpression {
    return createNodeExpression(WaitInstruction, source);
  }

  static validateConfig(config: unknown): ConfigIssue[] {
    if (!config || typeof config !== 'object' || Array.isArray(config))
      return [{ path: 'config', message: 'wait config must be an object' }];
    return Object.keys(config)
      .filter((key) => key !== 'correlation')
      .map((key) => ({
        path: `config.${key}`,
        message: `wait config does not accept field "${key}"`,
      }));
  }

  async run(): Promise<WorkflowInstructionResult> {
    const issues = WaitInstruction.validateConfig(this.config);
    if (issues.length)
      throw new TypeError(issues.map((issue) => issue.message).join('; '));
    const correlation =
      this.config.correlation === undefined
        ? null
        : this.processor.getParsedValue(this.config.correlation, this.node);
    return { status: NODE_RUN_STATUS.PENDING, meta: { wait: { correlation } } };
  }

  async resume(): Promise<WorkflowInstructionResult> {
    const request = this.processor.resumeRequest;
    if (
      !request ||
      request.instructionType !== WaitInstruction.type ||
      String(request.nodeRunId) !== String(this.nodeRun.id)
    )
      throw new Error('Wait resume requires its persisted request');
    if (this.nodeRun.status !== NODE_RUN_STATUS.PENDING)
      throw new Error('Wait node is no longer pending');
    const payload = request.payload as WaitResumePayload;
    return {
      status: payload.status,
      result: payload.result,
      ...(payload.error == null ? {} : { error: payload.error }),
      meta: this.nodeRun.meta,
    };
  }
}
