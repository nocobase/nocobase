/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Logger } from '@nocobase/logger';
import { ITask, TaskConstructor, TaskModel } from './task';
import { Application, QueueMessageOptions } from '@nocobase/server';
import { TaskId, TaskStatus } from '../../common/types';
import { Transactionable } from '@nocobase/database';

export interface CreateTaskOptions extends Transactionable {
  useQueue?: boolean | QueueMessageOptions;
  context?: any;
}

export interface AsyncTasksManager {
  concurrency: number;
  setLogger(logger: Logger): void;
  setApp(app: Application): void;
  registerTaskType(taskType: TaskConstructor): void;
  createTask(data: Omit<TaskModel, 'id'>, options?: CreateTaskOptions): Promise<ITask>;
  cancelTask(taskId: TaskId): Promise<void>;
  getTaskStatus(taskId: TaskId): Promise<TaskStatus>;
  getTask(taskId: TaskId): ITask | undefined;
  runTask(task: ITask): Promise<void>;
}

export class CancelError extends Error {
  constructor(message = 'Task cancelled') {
    super(message);
    this.name = 'CancelError';
  }
}
