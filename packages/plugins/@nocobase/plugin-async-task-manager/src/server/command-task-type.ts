/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CancelError } from './interfaces/async-task-manager';
import process from 'node:process';
import { Worker, ResourceLimits } from 'worker_threads';
import path from 'path';
import { TaskType } from './task-type';

const getResourceLimitsFromEnv = (): ResourceLimits => {
  let resourceLimitsUndefined = true;
  const resourceLimits: ResourceLimits = {};
  if (process.env.ASYNC_TASK_WORKER_MAX_OLD) {
    resourceLimits.maxOldGenerationSizeMb = Number.parseInt(process.env.ASYNC_TASK_WORKER_MAX_OLD, 10);
    resourceLimitsUndefined = false;
  }
  if (process.env.ASYNC_TASK_WORKER_MAX_YOUNG) {
    resourceLimits.maxYoungGenerationSizeMb = Number.parseInt(process.env.ASYNC_TASK_WORKER_MAX_YOUNG, 10);
    resourceLimitsUndefined = false;
  }
  return resourceLimitsUndefined ? undefined : resourceLimits;
};

const RESOURCE_LIMITS = getResourceLimitsFromEnv();

export function parseArgv(list: string[]) {
  const argv: any = {};

  for (const item of list) {
    const match = item.match(/^--([^=]+)=(.*)$/);

    if (match) {
      const key = match[1];
      let value: any = match[2];

      if (value.startsWith('{') || value.startsWith('[')) {
        try {
          value = JSON.parse(value);
        } catch (err) {
          // ignore parse error, keep raw text
        }
      } else {
        if (value === 'true') {
          value = true;
        } else if (value === 'false') {
          value = false;
        }
      }

      argv[key] = value;
      continue;
    }

    const parts = item.split(':');
    if (parts.length === 2) {
      const command = parts[0];
      const commandValue = parts[1];
      argv[command] = commandValue;
    }
  }

  return argv;
}

export class CommandTaskType extends TaskType {
  static type = 'command';

  workerThread: Worker;

  static defaults(data) {
    data.argv?.push(`--taskId=${data.id}`);
    return data;
  }

  async execute() {
    const { argv } = this.record.params;
    const parsedArgv = parseArgv(argv);
    const isDev = (process.argv[1]?.endsWith('.ts') || process.argv[1].includes('tinypool')) ?? false;
    const appRoot = process.env.APP_PACKAGE_ROOT || 'packages/core/app';
    const workerPath = path.resolve(process.cwd(), appRoot, isDev ? 'src/index.ts' : 'lib/index.js');

    const workerPromise = new Promise((resolve, reject) => {
      let settled = false;
      let successPayload: any;

      const settleOnce = (err?: Error | null, payload?: any) => {
        if (settled) {
          return;
        }
        settled = true;
        if (err) {
          reject(err);
          return;
        }
        resolve(payload);
      };

      try {
        this.logger?.info(
          `Creating worker for task ${this.record.id} - path: ${workerPath}, argv: ${JSON.stringify(
            argv,
          )}, isDev: ${isDev}`,
        );

        const worker = new Worker(workerPath, {
          execArgv: isDev ? ['--require', 'tsx/cjs'] : [],
          workerData: {
            argv,
          },
          env: {
            ...process.env,
            WORKER_MODE: '-',
            ...(parsedArgv.app && parsedArgv.app !== 'main' ? { STARTUP_SUBAPP: parsedArgv.app } : {}),
          },
          resourceLimits: RESOURCE_LIMITS,
        });

        this.workerThread = worker;
        this.logger?.debug(`Worker created successfully for task ${this.record.id}`);

        let isCancelling = false;

        // Listen for abort signal
        this.abortController.signal.addEventListener('abort', () => {
          isCancelling = true;
          this.logger?.info(`Terminating worker for task ${this.record.id} due to cancellation`);
          worker.terminate();
        });

        worker.on('message', (message) => {
          this.logger?.trace(`Worker message received for task ${this.record.id} - type: ${message.type}`);
          if (message.type === 'progress') {
            this.reportProgress(message.payload);
          }

          if (message.type === 'success') {
            this.logger?.info(
              `Worker completed successfully for task ${this.record.id} with payload: ${JSON.stringify(
                message.payload,
              )}`,
            );
            // Wait for worker exit to ensure app shutdown and DB commits are finished.
            successPayload = message.payload;
          }
        });

        worker.on('error', (error) => {
          this.logger?.error(`Worker error for task ${this.record.id}`, error);
          settleOnce(error);
        });

        worker.on('exit', (code) => {
          this.logger?.info(`Worker exited for task ${this.record.id} with code ${code}`);
          if (isCancelling) {
            settleOnce(new CancelError());
          } else if (code !== 0) {
            settleOnce(new Error(`Worker stopped with exit code ${code}`));
          } else {
            settleOnce(null, successPayload ?? code);
          }
        });

        worker.on('messageerror', (error) => {
          settleOnce(error);
        });
      } catch (error) {
        settleOnce(error as Error);
      }
    });

    return workerPromise;
  }
}
