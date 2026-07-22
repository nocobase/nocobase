/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { once } from 'node:events';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import winston, { Logger } from 'winston';
import Joi from 'joi';

import {
  Processor,
  Instruction,
  JOB_STATUS,
  FlowNodeModel,
  IJob,
  WorkflowTimeoutError,
} from '@nocobase/plugin-workflow';

import { CacheTransport } from './cache-logger';

type ScriptArgument = { name: string; value?: unknown };

type ScriptConfig = { content?: string; timeout?: number; continue?: boolean; arguments?: ScriptArgument[] };

type ScriptArguments = Record<string, unknown> | unknown[];

export default class ScriptInstruction extends Instruction {
  /**
   * Returns the worker script path based on whether WORKFLOW_SCRIPT_MODULES is configured.
   * - WORKFLOW_SCRIPT_MODULES set: uses Node.js vm with require support (unsafe; not a security boundary)
   * - WORKFLOW_SCRIPT_MODULES unset: uses QuickJS (WASM) for maximum security (no require, no Node.js APIs)
   */
  static get workerScript() {
    const hasModules = (process.env.WORKFLOW_SCRIPT_MODULES ?? '').split(',').filter(Boolean).length > 0;
    return path.join(__dirname, hasModules ? 'Vm.js' : 'QuickJs.js');
  }

  static async run(
    source: string,
    args: ScriptArguments,
    options: { logger: Logger; timeout?: number; signal?: AbortSignal },
  ) {
    const { logger, timeout, signal } = options;
    let result: unknown;

    const worker = new Worker(this.workerScript, {
      workerData: { source, args, options: timeout ? { timeout } : {} },
    });

    const abortListener = () => {
      worker.terminate();
    };
    signal?.addEventListener('abort', abortListener, { once: true });

    worker.on('message', (message) => {
      if (message.type === 'result') {
        result = message.result;
      }
    });

    worker.stdout.on('data', (data) => {
      logger.info(data.toString());
    });
    worker.stderr.on('data', (data) => {
      logger.error(data.toString());
    });

    const excution = new Promise((resolve, reject) => {
      worker.on('error', (error) => {
        reject(error);
      });

      const stdoutPromise = once(worker.stdout, 'close');
      const stderrPromise = once(worker.stderr, 'close');

      worker.on('exit', (code) => {
        Promise.all([stdoutPromise, stderrPromise])
          .then(() => {
            if (code !== 0) {
              reject(new Error(`Worker stopped with exit code ${code}`));
            }
            resolve(result);
          })
          .catch(reject);
      });
    });

    try {
      await excution;
    } catch (e) {
      signal?.removeEventListener('abort', abortListener);
      if (signal?.aborted) {
        throw signal.reason instanceof Error ? signal.reason : new WorkflowTimeoutError();
      }
      return {
        status: JOB_STATUS.ERROR,
        result: e instanceof Error ? e.message : String(e),
      };
    }

    signal?.removeEventListener('abort', abortListener);

    return {
      status: JOB_STATUS.RESOLVED,
      result,
    };
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

    const { id } = processor.saveJob({
      status: JOB_STATUS.PENDING,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
    });

    processor.logger.info(`script (#${node.id}) has been started, waiting for response...`);

    await processor.exit();

    const jobResult: IJob = {
      status: JOB_STATUS.PENDING,
    };

    // eslint-disable-next-line promise/catch-or-return
    (this.constructor as typeof ScriptInstruction)
      .run(content, _args, { timeout, logger: processor.logger, signal: options?.signal })
      .then((res) => {
        if (res.status === JOB_STATUS.RESOLVED) {
          processor.logger.info(`script (#${node.id}) get result success`);
          jobResult.status = JOB_STATUS.RESOLVED;
          jobResult.result = res.result;
          processor.logger.info(`run script execution success, node id: ${node.id},the result is ${res.result}`);

          return;
        }

        if (cont) {
          processor.logger.warn(`script (#${node.id}) get result failed, the reason is ${res.result}`);
          jobResult.status = JOB_STATUS.RESOLVED;
          jobResult.result = res.result;

          return;
        }

        processor.logger.info(`script (#${node.id}) get result failed, the reason is ${res.result}`);
        jobResult.status = JOB_STATUS.ERROR;
        jobResult.result = res.result;
      })
      .catch((e) => {
        const message = e instanceof Error ? e.message : String(e);
        processor.logger.error(`script (#${node.id}) get result failed, the reason is ${message}`);
        jobResult.status = JOB_STATUS.ERROR;
        jobResult.result = message;
      })
      .finally(() => {
        processor.logger.debug(`script (#${node.id}) ended, resume workflow...`);
        setImmediate(async () => {
          const job = await this.workflow.db.getRepository('jobs').findOne({ filterByTk: id });
          const execution = await job.getExecution();
          if (execution.status !== 0) {
            processor.logger.warn(`script (#${node.id}) result discarded because execution (${execution.id}) is ended`);
            return;
          }
          job.set(jobResult);
          await this.workflow.resume(job).catch(() => {});
        });
      });
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
