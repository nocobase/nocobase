import { CancelError } from './interfaces/async-task-manager';
import process from 'node:process';
import { Worker } from 'worker_threads';
import path from 'path';
import { TaskType } from './task-type';

export class CommandTaskType extends TaskType {
  static type = 'command';

  workerThread: Worker;

  async execute() {
    const { argv } = this.options;
    const isDev = (process.argv[1]?.endsWith('.ts') || process.argv[1].includes('tinypool')) ?? false;
    const appRoot = process.env.APP_PACKAGE_ROOT || 'packages/core/app';
    const workerPath = path.resolve(process.cwd(), appRoot, isDev ? 'src/index.ts' : 'lib/index.js');

    const workerPromise = new Promise((resolve, reject) => {
      try {
        this.logger?.info(
          `Creating worker for task ${this.taskId} - path: ${workerPath}, argv: ${JSON.stringify(
            argv,
          )}, isDev: ${isDev}`,
        );

        const worker = new Worker(workerPath, {
          execArgv: isDev ? ['--require', 'tsx/cjs'] : [],
          workerData: {
            argv,
          },
        });

        this.workerThread = worker;
        this.logger?.debug(`Worker created successfully for task ${this.taskId}`);

        let isCancelling = false;

        // Listen for abort signal
        this.abortController.signal.addEventListener('abort', () => {
          isCancelling = true;
          this.logger?.info(`Terminating worker for task ${this.taskId} due to cancellation`);
          worker.terminate();
        });

        worker.on('message', (message) => {
          this.logger?.debug(`Worker message received for task ${this.taskId} - type: ${message.type}`);
          if (message.type === 'progress') {
            this.reportProgress(message.payload);
          }

          if (message.type === 'success') {
            this.logger?.info(
              `Worker completed successfully for task ${this.taskId} with payload: ${JSON.stringify(message.payload)}`,
            );
            resolve(message.payload);
          }
        });

        worker.on('error', (error) => {
          this.logger?.error(`Worker error for task ${this.taskId}`, error);
          reject(error);
        });

        worker.on('exit', (code) => {
          this.logger?.info(`Worker exited for task ${this.taskId} with code ${code}`);
          if (isCancelling) {
            reject(new CancelError());
          } else if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
          } else {
            resolve(code);
          }
        });

        worker.on('messageerror', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });

    return workerPromise;
  }
}
