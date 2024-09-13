/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SyncResult, UserData, UserDataResourceManager } from './user-data-resource-manager';
import { SyncSourceManager } from './sync-source-manager';
import { Context } from '@nocobase/actions';
import { SyncSource } from './sync-source';
import { Logger } from '@nocobase/logger';
import { ExternalAPIError } from './error';

export class UserDataSyncService {
  resourceManager: UserDataResourceManager;
  sourceManager: SyncSourceManager;
  logger: Logger;

  constructor(resourceManager: UserDataResourceManager, sourceManager: SyncSourceManager, logger: Logger) {
    this.resourceManager = resourceManager;
    this.sourceManager = sourceManager;
    this.logger = logger;
  }

  async pull(sourceName: string, ctx: Context) {
    const source = await this.sourceManager.getByName(sourceName, ctx);
    const task = await source.newTask();
    await source.beginTask(task.id);
    ctx.log.info('begin sync task of source', { source: sourceName, sourceType: source.instance.sourceType });
    this.runSync(source, task, ctx);
  }

  async push(data: any): Promise<SyncResult[]> {
    const { dataType, records } = data;
    if (dataType === undefined) {
      throw new Error('dataType for user data synchronize is required');
    }
    if (dataType !== 'user' && dataType !== 'department') {
      throw new Error('dataType must be user or department');
    }
    if (records === undefined) {
      throw new Error('records for user data synchronize is required');
    }
    if (records.length === 0) {
      throw new Error('records must have at least one piece of data');
    }
    const userData: UserData = {
      dataType: data.dataType,
      matchKey: data.matchKey,
      records: data.records,
      sourceName: data.sourceName ? data.sourceName : 'api',
    };
    this.logger.info({
      source: data.sourceName ? data.sourceName : 'api',
      sourceType: 'api',
      data: data,
    });
    return await this.resourceManager.updateOrCreate(userData);
  }

  async retry(sourceId: number, taskId: number, ctx: Context) {
    const source = await this.sourceManager.getById(sourceId, ctx);
    const task = await source.retryTask(taskId);
    ctx.log.info('retry sync task of source', {
      source: source.instance.name,
      sourceType: source.instance.name,
      task: task.id,
    });
    this.runSync(source, task, ctx);
  }

  async runSync(source: SyncSource, task: any, ctx: Context) {
    const currentTimeMillis = new Date().getTime();
    try {
      ctx.log.info('begin pull data of source', {
        source: source.instance.name,
        sourceType: source.instance.sourceType,
      });
      const data = await source.pull();
      // 输出拉取的数据
      this.logger.info({
        source: source.instance.name,
        sourceType: source.instance.sourceType,
        batch: task.batch,
        data: data,
      });
      ctx.log.info('end pull data of source', { source: source.instance.name, sourceType: source.instance.sourceType });
      ctx.log.info('begin update data of source', {
        source: source.instance.name,
        sourceType: source.instance.sourceType,
      });
      for (const item of data) {
        await this.resourceManager.updateOrCreate(item);
      }
      ctx.log.info('end update data of source', {
        source: source.instance.name,
        sourceType: source.instance.sourceType,
      });
      const costTime = new Date().getTime() - currentTimeMillis;
      await source.endTask({ taskId: task.id, success: true, cost: costTime });
    } catch (err) {
      ctx.log.error(
        `sync task of source: ${source.instance.name} sourceType: ${source.instance.sourceType} error: ${err.message}`,
        { method: 'runSync', err: err.stack, cause: err.cause },
      );
      let message = err.message;
      if (err instanceof ExternalAPIError) {
        message = 'The sync source API call failed. Please check the logs to troubleshoot the issue.';
      }
      await source.endTask({ taskId: task.id, success: false, message });
    }
  }
}
