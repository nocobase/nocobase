/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Logger } from '@nocobase/logger';
import { EventEmitter } from 'events';
import { Application } from '@nocobase/server';
import { Model } from '@nocobase/database';
import { TaskId, TaskStatus } from '../../common/types';

export class TaskModel extends Model {
  id: TaskId;
  origin: string;
  type: string;
  title?: string;
  params: Record<string, any>;
  tags?: Record<string, string>;
  status: TaskStatus;
  progressTotal?: number;
  progressCurrent?: number;
  createdAt?: Date;
  startedAt?: Date;
  doneAt?: Date;
  createdById?: number;
  // Additional fields can be added as needed
}

export interface ITask {
  record: TaskModel;
  onProgress: (record: TaskModel) => void;
  setLogger(logger: Logger): void;
  setApp(app: Application): void;

  isCanceled: boolean;
  cancel(options?: { silent?: boolean });
  execute(): Promise<any>;
  reportProgress(progress: { total: number; current: number }): void;
  run(): Promise<void>;
  toJSON<TaskModelAttributes>(): TaskModelAttributes;
}

export interface TaskConstructor {
  type: string;
  new (model: TaskModel): ITask;
}
