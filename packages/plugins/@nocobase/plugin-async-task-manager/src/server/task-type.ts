/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Logger } from '@nocobase/logger';
import { CancelError } from './interfaces/async-task-manager';
import { ITask, TaskModel } from './interfaces/task';
import Application from '@nocobase/server';
import { TASK_STATUS } from '../common/constants';

type TaskOptions = {
  onProgress?: (record: TaskModel) => void;
};

export class TaskType implements ITask {
  static type: string;
  static cancelable = true;

  static defaults(data) {
    return data;
  }

  protected logger: Logger;
  protected app: Application;
  protected abortController: AbortController = new AbortController();

  public onProgress: (record: TaskModel) => void;

  get isCanceled() {
    return this.record.status === TASK_STATUS.CANCELED;
  }

  constructor(public record: TaskModel) {}

  setLogger(logger: Logger) {
    this.logger = logger;
  }

  setApp(app: Application) {
    this.app = app;
  }

  /**
   * Cancel the task
   */
  async cancel() {
    if (this.record.status === TASK_STATUS.RUNNING) {
      this.abortController.abort();
    }
    if (this.isCanceled) {
      return this;
    }
    this.logger?.debug(`Task ${this.record.id} cancelled`);
    return this;
  }

  /**
   * Execute the task implementation
   * @returns Promise that resolves with the task result
   */
  execute(): Promise<any> {
    return Promise.resolve();
  }

  /**
   * Report task progress
   * @param progress Progress information containing total and current values
   */
  reportProgress(progress: { total: number; current: number }) {
    this.record.set({
      progressTotal: progress.total,
      progressCurrent: progress.current,
    });
    this.logger?.trace(
      `Task ${this.record.id} progress update - current: ${progress.current}, total: ${progress.total}`,
    );
    this.onProgress?.(this.record);
  }

  /**
   * Run the task
   * This method handles task lifecycle, including:
   * - Status management
   * - Error handling
   * - Progress tracking
   * - Event emission
   */
  async run() {
    this.logger?.info(`Starting task ${this.record.id}, type: ${(this.constructor as typeof TaskType).type}`);

    if (this.isCanceled) {
      this.logger?.info(`Task ${this.record.id} was cancelled before execution`);
      if (this.record.status !== TASK_STATUS.CANCELED) {
        await this.record.update({
          status: TASK_STATUS.CANCELED,
        });
      }
      return;
    }
    this.record = await this.record.update({
      startedAt: new Date(),
      status: TASK_STATUS.RUNNING,
    });

    try {
      const result = await this.execute();

      this.logger?.info(`Task ${this.record.id} completed successfully with result: ${JSON.stringify(result)}`);
      await this.record.update({
        status: TASK_STATUS.SUCCEEDED,
        doneAt: new Date(),
        result,
      });
    } catch (error) {
      if (error instanceof CancelError) {
        // this.cancel();
        this.logger?.info(`Task ${this.record.id} was cancelled during execution`);
        return;
      } else {
        await this.record.update({
          status: TASK_STATUS.FAILED,
          doneAt: new Date(),
          error: error.toString(),
        });

        this.logger?.error(`Task ${this.record.id} failed with error: ${error.message}`);
        throw error;
      }
    } finally {
      const duration = this.record.doneAt.getTime() - this.record.startedAt.getTime();
      this.logger?.info(`Task ${this.record.id} finished in ${duration}ms`);
    }
  }

  toJSON() {
    return this.record.toJSON();
  }
}
