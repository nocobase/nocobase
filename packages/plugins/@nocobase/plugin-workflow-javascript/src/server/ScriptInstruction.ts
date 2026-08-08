/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import winston, { Logger } from 'winston';
import Joi from 'joi';

import WorkflowPlugin, { Processor, Instruction, JOB_STATUS, FlowNodeModel } from '@nocobase/plugin-workflow';

import { CacheTransport } from './cache-logger';
import { PENDING_JAVASCRIPT_TASK_CHANNEL } from './constants';
import { ABORT_JAVASCRIPT_JOB_SYNC_MESSAGE_TYPE, getAbortReason, RunningJobs } from './RunningJobs';
import { ScriptArguments, ScriptRunResult, ScriptWorkerRunner } from './ScriptWorkerRunner';

type ScriptArgument = { name: string; value?: unknown };

type ScriptConfig = { content?: string; timeout?: number; continue?: boolean; arguments?: ScriptArgument[] };

type JavaScriptJobMeta = {
  args: ScriptArguments;
  [key: string]: unknown;
};

export default class ScriptInstruction extends Instruction {
  static get workerScript() {
    return ScriptWorkerRunner.workerScript;
  }

  static async run(
    source: string,
    args: ScriptArguments,
    options: { logger: Logger; timeout?: number; signal?: AbortSignal },
  ): Promise<ScriptRunResult> {
    return ScriptWorkerRunner.run(source, args, options);
  }

  constructor(
    workflow: WorkflowPlugin,
    private readonly runningJobs: RunningJobs,
  ) {
    super(workflow);
  }

  configSchema = Joi.object({
    content: Joi.string(),
    timeout: Joi.number(),
    continue: Joi.boolean(),
    arguments: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          value: Joi.any(),
        }),
      )
      .optional(),
  });

  async run(node: FlowNodeModel, prevJob, processor: Processor, options?: { signal?: AbortSignal }) {
    const { content = '', continue: cont, timeout } = node.config as ScriptConfig;
    const args = processor.getParsedValue(node.config.arguments ?? [], node.id) as ScriptArgument[];
    const _args = args.reduce((pre, item) => ({ ...pre, [item.name]: item.value }), {} as Record<string, unknown>);
    const { workflow } = processor.execution;
    const sync = this.workflow.isWorkflowSync(workflow);

    processor.logger.info(`run script execution node id: ${node.id}, start in ${new Date().toLocaleString()}`);

    if (sync) {
      const result = await (this.constructor as typeof ScriptInstruction).run(content, _args, {
        timeout,
        logger: processor.logger,
        signal: options?.signal,
      });

      if (result.status === JOB_STATUS.RESOLVED) {
        processor.logger.info(`run script test success, node id: ${node.id},the result is ${result.result}`);
      } else {
        processor.logger.error(`run script test failed, node id: ${node.id},the reason is ${result.result}`);
      }

      return {
        result: result.result,
        status: cont
          ? JOB_STATUS.RESOLVED
          : result.status === JOB_STATUS.RESOLVED
            ? JOB_STATUS.RESOLVED
            : JOB_STATUS.ERROR,
      };
    }

    const meta: JavaScriptJobMeta = {
      args: _args,
    };

    const { id } = processor.saveJob({
      status: JOB_STATUS.PENDING,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
      startedAt: null,
      meta,
    });

    const abortQueuedJob = async () => {
      await this.runningJobs.abortAcrossInstances(this.workflow, {
        type: ABORT_JAVASCRIPT_JOB_SYNC_MESSAGE_TYPE,
        jobId: id,
        executionId: processor.execution.id,
        reason: getAbortReason(options?.signal?.reason),
      });
    };

    if (options?.signal?.aborted) {
      await abortQueuedJob();
    } else {
      options?.signal?.addEventListener(
        'abort',
        () => {
          abortQueuedJob().catch((error) => {
            processor.logger.error(`broadcasting JavaScript job (${id}) abort signal failed`, { error });
          });
        },
        { once: true },
      );
    }

    processor.logger.info(`script (#${node.id}) has been queued, waiting for JavaScript Worker resource...`);

    await processor.exit();

    try {
      await this.workflow.app.eventQueue.publish(PENDING_JAVASCRIPT_TASK_CHANNEL, {
        jobId: id,
      });
    } catch (error) {
      processor.logger.error(`publishing JavaScript job (${id}) failed, recovery will republish it`, { error });
    }
  }

  async resume(node: FlowNodeModel, job, processor: Processor) {
    return job;
  }

  async test(config: ScriptConfig = {}) {
    const { content, timeout } = config;
    const args = (config.arguments ?? []).reduce(
      (pre, item) => ({ ...pre, [item.name]: item.value }),
      {} as Record<string, unknown>,
    );
    const transport = new CacheTransport();
    const logger = winston.createLogger({
      transports: [transport],
    });
    const result = await (this.constructor as typeof ScriptInstruction).run(content ?? '', args, { timeout, logger });
    const log = transport.getLogs();
    return {
      ...result,
      log: log?.join(''),
    };
  }
}
