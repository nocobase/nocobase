/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { SyncSourceModel } from './models/sync-source';
import { UserData } from './user-data-resource-manager';
import dayjs from 'dayjs';

export type SyncSourceConfig = {
  sourceInstance: SyncSourceModel;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};

interface ISyncSource {
  pull(): Promise<UserData[]>;
}

export abstract class SyncSource implements ISyncSource {
  instance: SyncSourceModel;
  protected options: {
    [key: string]: any;
  };
  protected ctx: Context;

  constructor(config: SyncSourceConfig) {
    const { options, ctx, sourceInstance } = config;
    this.instance = sourceInstance;
    this.options = options;
    this.ctx = ctx;
  }

  abstract pull(): Promise<UserData[]>;

  async newTask() {
    const batch = generateUniqueNumber();
    return await this.instance.createTask({ batch, status: 'init' });
  }

  async beginTask(taskId: number) {
    const tasks = await this.instance.getTasks({ where: { id: taskId } });
    if (!tasks && !tasks.length) {
      throw new Error(`Task [${taskId}] is not found.`);
    }
    const task = tasks[0];
    if (task.status !== 'init') {
      throw new Error(`Task [${taskId}] is not init.`);
    }
    task.status = 'processing';
    await task.save();
  }

  async endTask(params: EndTaskParams) {
    const { taskId, success, cost, message } = params;
    const tasks = await this.instance.getTasks({ where: { id: taskId } });
    if (!tasks && !tasks.length) {
      throw new Error(`Task [${taskId}] is not found.`);
    }
    const task = tasks[0];
    if (task.status !== 'processing') {
      throw new Error(`Task [${taskId}] is not processing.`);
    }
    task.status = success ? 'success' : 'failed';
    task.cost = cost;
    task.message = message;
    await task.save();
  }

  async retryTask(taskId: number) {
    const tasks = await this.instance.getTasks({ where: { id: taskId } });
    if (!tasks && !tasks.length) {
      throw new Error(`Task [${taskId}] is not found.`);
    }
    const task = tasks[0];
    if (task.status !== 'failed') {
      throw new Error(`Task [${taskId}] is not failed.`);
    }
    task.status = 'processing';
    task.message = '';
    await task.save();
    return task;
  }
}

export type SyncSourceExtend<T extends SyncSource> = new (config: SyncSourceConfig) => T;

type EndTaskParams = {
  taskId: number;
  success: boolean;
  cost?: number;
  message?: string;
};

function generateUniqueNumber() {
  const formattedDate = dayjs().format('YYYYMMDDHHmmss');
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return formattedDate + randomDigits;
}
