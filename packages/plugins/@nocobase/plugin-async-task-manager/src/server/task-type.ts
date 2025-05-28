/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { v4 as uuidv4 } from 'uuid';
import EventEmitter from 'events';
import { Logger } from '@nocobase/logger';
import { TaskOptions, TaskStatus, CancelError } from './interfaces/async-task-manager';
import { ITask } from './interfaces/task';
import Application from '@nocobase/server';
import PluginErrorHandler, { ErrorHandler } from '@nocobase/plugin-error-handler';

export abstract class TaskType extends EventEmitter implements ITask {
  static type: string;
  static cancelable = true;

  public status: TaskStatus;
  protected logger: Logger;
  protected app: Application;

  public progress: {
    total: number;
    current: number;
  } = {
    total: 0,
    current: 0,
  };

  public startedAt: Date;
  public fulfilledAt: Date;
  public taskId: string;
  public tags: Record<string, string>;
  public createdAt: Date;
  public context?: any;
  public title;
  protected abortController: AbortController = new AbortController();

  private _isCancelled = false;

  get isCancelled() {
    return this._isCancelled;
  }

  constructor(
    protected options: TaskOptions,
    tags?: Record<string, string>,
  ) {
    super();

    this.status = {
      type: 'pending',
      indicator: 'spinner',
    };

    this.taskId = uuidv4();
    this.tags = tags || {};
    this.createdAt = new Date();
    this.options.argv?.push(`--taskId=${this.taskId}`);
  }

  setLogger(logger: Logger) {
    this.logger = logger;
  }

  setApp(app: Application) {
    this.app = app;
  }

  setContext(context: any) {
    this.context = context;
  }

  /**
   * Cancel the task
   */
  async cancel() {
    this._isCancelled = true;
    this.abortController.abort();
    this.logger?.debug(`Task ${this.taskId} cancelled`);
    return true;
  }

  async statusChange(status: TaskStatus) {
    this.status = status;
    this.emit('statusChange', this.status);
  }

  /**
   * Execute the task implementation
   * @returns Promise that resolves with the task result
   */
  abstract execute(): Promise<any>;

  /**
   * Report task progress
   * @param progress Progress information containing total and current values
   */
  reportProgress(progress: { total: number; current: number }) {
    this.progress = progress;
    this.logger?.debug(`Task ${this.taskId} progress update - current: ${progress.current}, total: ${progress.total}`);
    this.emit('progress', progress);
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
    this.startedAt = new Date();
    this.logger?.info(`Starting task ${this.taskId}, type: ${(this.constructor as typeof TaskType).type}`);

    this.status = {
      type: 'running',
      indicator: 'progress',
    };

    this.emit('statusChange', this.status);

    try {
      if (this._isCancelled) {
        this.logger?.info(`Task ${this.taskId} was cancelled before execution`);
        this.status = {
          type: 'cancelled',
        };
        this.emit('statusChange', this.status);
        return;
      }

      const executePromise = this.execute();
      const result = await executePromise;

      this.status = {
        type: 'success',
        indicator: 'success',
        payload: result,
      };

      this.logger?.info(`Task ${this.taskId} completed successfully with result: ${JSON.stringify(result)}`);
      this.emit('statusChange', this.status);
    } catch (error) {
      if (error instanceof CancelError) {
        this.statusChange({ type: 'cancelled' });
        this.logger?.info(`Task ${this.taskId} was cancelled during execution`);
        return;
      } else {
        this.status = {
          type: 'failed',
          indicator: 'error',
          errors: [{ message: this.renderErrorMessage(error) }],
        };

        this.logger?.error(`Task ${this.taskId} failed with error: ${error.message}`);
        this.emit('statusChange', this.status);
      }
    } finally {
      this.fulfilledAt = new Date();
      const duration = this.fulfilledAt.getTime() - this.startedAt.getTime();
      this.logger?.info(`Task ${this.taskId} finished in ${duration}ms`);
    }
  }

  private renderErrorMessage(error: Error) {
    const errorHandlerPlugin = this.app.pm.get('error-handler') as PluginErrorHandler;
    if (!errorHandlerPlugin || !this.context) {
      return error.message;
    }

    const errorHandler: ErrorHandler = errorHandlerPlugin.errorHandler;

    errorHandler.renderError(error, this.context);
    return this.context.body.errors[0].message;
  }

  toJSON(options?: { raw?: boolean }) {
    const json = {
      cancelable: (this.constructor as typeof TaskType).cancelable,
      taskId: this.taskId,
      status: { ...this.status },
      progress: this.progress,
      tags: this.tags,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      fulfilledAt: this.fulfilledAt,
      title: this.title,
    };

    // If not in raw mode and the status is success with a file path, transform the status format
    if (!options?.raw && json.status.type === 'success' && json.status.payload?.filePath) {
      json.status = {
        type: 'success',
        indicator: 'success',
        resultType: 'file',
        payload: {},
      };
    }

    return json;
  }
}
