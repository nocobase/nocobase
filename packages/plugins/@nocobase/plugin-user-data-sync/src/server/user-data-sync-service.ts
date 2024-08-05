/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UserDataResourceManager } from './user-data-resource-manager';
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

  async sync(sourceName: string, ctx: Context) {
    const source = await this.sourceManager.getByName(sourceName, ctx);
    const taskId = await source.newTask();
    await source.beginTask(taskId);
    this.logger.info(
      `begin sync task of source: ${sourceName} sourceType: ${
        source.instance.sourceType
      } time: ${new Date().toLocaleString()}`,
    );
    this.runSync(source, taskId);
  }

  async retry(sourceId: number, taskId: number, ctx: Context) {
    const source = await this.sourceManager.getById(sourceId, ctx);
    await source.retryTask(taskId);
    this.logger.info(
      `retry sync task of source: ${source.instance.name} sourceType: ${
        source.instance.sourceType
      } time: ${new Date().toLocaleString()}`,
    );
    this.runSync(source, taskId);
  }

  async runSync(source: SyncSource, taskId: number) {
    const currentTimeMillis = new Date().getTime();
    try {
      this.logger.info(
        `begin pull data of source: ${source.instance.name} sourceType: ${
          source.instance.sourceType
        } time: ${new Date().toLocaleString()}`,
      );
      const data = await source.pull();
      this.logger.info(
        `end pull data of source: ${source.instance.name} sourceType: ${
          source.instance.sourceType
        } time: ${new Date().toLocaleString()} cost: ${new Date().getTime() - currentTimeMillis}`,
      );
      this.logger.info(
        `begin update data of source: ${source.instance.name} sourceType: ${
          source.instance.sourceType
        } time: ${new Date().toLocaleString()}`,
      );
      await this.resourceManager.updateOrCreate(data);
      this.logger.info(
        `end update data of source: ${source.instance.name} sourceType: ${
          source.instance.sourceType
        } time: ${new Date().toLocaleString()} cost: ${new Date().getTime() - currentTimeMillis}`,
      );
      const costTime = new Date().getTime() - currentTimeMillis;
      await source.endTask({ taskId, success: true, cost: costTime });
    } catch (err) {
      this.logger.error(
        `sync task of source: ${source.instance.name} sourceType: ${source.instance.sourceType} error: ${err.message}`,
      );
      await source.endTask({ taskId, success: false, message: err.message });
    }
  }
}
