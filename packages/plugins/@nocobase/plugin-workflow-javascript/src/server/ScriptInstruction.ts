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

import { Processor, Instruction, JOB_STATUS, FlowNodeModel, IJob } from '@nocobase/plugin-workflow';

import { CacheTransport } from './cache-logger';

type ScriptConfig = { content?: string; timeout?: number; continue?: boolean; arguments?: { [key: string]: any }[] };

export default class ScriptInstruction extends Instruction {
  static async run(source, args, options: { logger: Logger; timeout?: number }) {
    const { logger, timeout } = options;
    let result;

    const worker = new Worker(path.join(__dirname, 'Vm.js'), {
      workerData: { source, args, options: timeout ? { timeout } : {} },
    });

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
      console.log(e);
      return {
        status: JOB_STATUS.ERROR,
        result: e.message,
      };
    }

    return {
      status: JOB_STATUS.RESOLVED,
      result,
    };
  }

  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const { content = '', continue: cont, timeout } = node.config as ScriptConfig;
    const args = processor.getParsedValue(node.config.arguments ?? [], node.id);
    const _args = args.reduce((pre, item) => ({ ...pre, [item.name]: item.value }), {});
    const { workflow } = processor.execution;
    const sync = this.workflow.isWorkflowSync(workflow);

    processor.logger.info(`run script execution node id: ${node.id}, start in ${new Date().toLocaleString()}`);

    if (sync) {
      const result = await (this.constructor as typeof ScriptInstruction).run(content, _args, {
        timeout,
        logger: processor.logger,
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
      .run(content, _args, { timeout, logger: processor.logger })
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
        processor.logger.error(`script (#${node.id}) get result failed, the reason is ${e.message}`);
        jobResult.status = JOB_STATUS.ERROR;
        jobResult.result = e.message;
      })
      .finally(() => {
        processor.logger.debug(`script (#${node.id}) ended, resume workflow...`);
        setImmediate(async () => {
          const job = await this.workflow.db.getRepository('jobs').findOne({ filterByTk: id });
          job.set(jobResult);
          this.workflow.resume(job);
        });
      });
  }

  async resume(node: FlowNodeModel, job, processor: Processor) {
    return job;
  }

  async test(config: ScriptConfig = {}) {
    const { content, timeout } = config;
    const args = (config.arguments ?? []).reduce((pre, item) => ({ ...pre, [item.name]: item.value }), {});
    const transport = new CacheTransport();
    const logger = winston.createLogger({
      transports: [transport],
    });
    const result = await (this.constructor as typeof ScriptInstruction).run(content, args, { timeout, logger });
    const log = transport.getLogs();
    return {
      ...result,
      log: log?.join(''),
    };
  }
}
