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

import { Logger } from 'winston';

import { JOB_STATUS, WorkflowTimeoutError } from '@nocobase/plugin-workflow';

export type ScriptArguments = Record<string, unknown> | unknown[] | null;

export type ScriptRunResult = {
  status: number;
  result?: unknown;
};

type WorkerOutcome =
  | { type: 'result'; result: unknown }
  | { type: 'error'; error: Error }
  | { type: 'exit'; code: number }
  | { type: 'aborted' };

function isWorkerResult(message: unknown): message is { type: 'result'; result: unknown } {
  return typeof message === 'object' && message !== null && 'type' in message && message.type === 'result';
}

export class ScriptWorkerRunner {
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
  ): Promise<ScriptRunResult> {
    const { logger, timeout, signal } = options;

    const worker = new Worker(this.workerScript, {
      workerData: { source, args, options: timeout ? { timeout } : {} },
    });

    worker.stdout.on('data', (data) => {
      logger.info(data.toString());
    });
    worker.stderr.on('data', (data) => {
      logger.error(data.toString());
    });

    const outputClosed = Promise.all([once(worker.stdout, 'close'), once(worker.stderr, 'close')]);
    const outcomePromise = new Promise<WorkerOutcome>((resolve) => {
      const finish = (outcome: WorkerOutcome) => {
        worker.removeListener('message', messageListener);
        worker.removeListener('error', errorListener);
        worker.removeListener('exit', exitListener);
        signal?.removeEventListener('abort', abortListener);
        resolve(outcome);
      };
      const messageListener = (message: unknown) => {
        if (isWorkerResult(message)) {
          finish({ type: 'result', result: message.result });
        }
      };
      const errorListener = (error: Error) => {
        finish({ type: 'error', error });
      };
      const exitListener = (code: number) => {
        finish({ type: 'exit', code });
      };
      const abortListener = () => {
        finish({ type: 'aborted' });
      };

      worker.on('message', messageListener);
      worker.once('error', errorListener);
      worker.once('exit', exitListener);
      signal?.addEventListener('abort', abortListener, { once: true });
      if (signal?.aborted) {
        abortListener();
      }
    });

    const outcome = await outcomePromise;
    try {
      if (outcome.type !== 'exit') {
        await worker.terminate();
      }
      await outputClosed;
    } catch (error) {
      if (outcome.type === 'aborted' || signal?.aborted) {
        throw signal.reason instanceof Error ? signal.reason : new WorkflowTimeoutError();
      }
      return {
        status: JOB_STATUS.ERROR,
        result: error instanceof Error ? error.message : String(error),
      };
    }

    if (outcome.type === 'aborted') {
      throw signal?.reason instanceof Error ? signal.reason : new WorkflowTimeoutError();
    }

    if (outcome.type === 'error') {
      return {
        status: JOB_STATUS.ERROR,
        result: outcome.error.message,
      };
    }

    if (outcome.type === 'exit' && outcome.code !== 0) {
      return {
        status: JOB_STATUS.ERROR,
        result: `Worker stopped with exit code ${outcome.code}`,
      };
    }

    return {
      status: JOB_STATUS.RESOLVED,
      result: outcome.type === 'result' ? outcome.result : undefined,
    };
  }
}
