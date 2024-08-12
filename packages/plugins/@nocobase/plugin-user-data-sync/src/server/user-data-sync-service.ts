/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UserData, UserDataResourceManager } from './user-data-resource-manager';
import { SyncSourceManager } from './sync-source-manager';
import { Context } from '@nocobase/actions';
import { SyncSource } from './sync-source';
import { Logger } from '@nocobase/logger';

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
    ctx.log.info(`begin sync task of source: ${sourceName} sourceType: ${source.instance.sourceType}`);
    this.runSync(source, task, ctx);
  }

  async push(data: any) {
    const userData: UserData = {
      dataType: data.dataType,
      uniqueKey: data.uniqueKey,
      records: data.records,
      sourceName: data.sourceName,
    };
    await this.resourceManager.updateOrCreate(userData);
  }

  async retry(sourceId: number, taskId: number, ctx: Context) {
    const source = await this.sourceManager.getById(sourceId, ctx);
    const task = await source.retryTask(taskId);
    ctx.log.info(`retry sync task of source: ${source.instance.name} sourceType: ${source.instance.sourceType}`);
    this.runSync(source, task, ctx);
  }

  async runSync(source: SyncSource, task: any, ctx: Context) {
    const currentTimeMillis = new Date().getTime();
    try {
      ctx.log.info(`begin pull data of source: ${source.instance.name} sourceType: ${source.instance.sourceType}`);
      const data = await source.pull();
      // 输出拉取的数据
      this.logger.info(
        `pull data of source: ${source.instance.name} sourceType: ${source.instance.sourceType} batch:${
          task.batch
        } data: ${JSON.stringify(data)}`,
      );
      ctx.log.info(`end pull data of source: ${source.instance.name} sourceType: ${source.instance.sourceType}`);
      ctx.log.info(`begin update data of source: ${source.instance.name} sourceType: ${source.instance.sourceType}`);
      for (const item of data) {
        await this.resourceManager.updateOrCreate(item);
      }
      ctx.log.info(`end update data of source: ${source.instance.name} sourceType: ${source.instance.sourceType}`);
      const costTime = new Date().getTime() - currentTimeMillis;
      await source.endTask({ taskId: task.id, success: true, cost: costTime });
    } catch (err) {
      ctx.log.error(
        `sync task of source: ${source.instance.name} sourceType: ${source.instance.sourceType} error: ${err.message}`,
      );
      await source.endTask({ taskId: task.id, success: false, message: err.message });
    }
  }
}
