/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Cache } from '@nocobase/cache';
import Application, { AppSupervisor } from '@nocobase/server';
import {
  CONSUME_MODE,
  CONFIG_KEYS,
  SYNC_MESSAGE_TYPE,
  SYSTEM_MANAGEMENT_CONFIG_CHNAGE_EVENT,
  CUSTOM_CHANNEL,
} from '../constants';
import { isEmpty } from '@nocobase/utils';

export type ConsumeMode = (typeof CONSUME_MODE)[keyof typeof CONSUME_MODE];

export class SystemManager {
  static displayName = 'NocobaseSystemManager';
  private customChannel = CUSTOM_CHANNEL;
  constructor(
    protected app: Application,
    protected cache: Cache,
  ) {
    this.subscribeCustomChannel();
  }
  private convertValue = (key: string, value: string) => {
    if (
      [CONFIG_KEYS.DISABLE_META_OP, CONFIG_KEYS.USE_QUEUE_FOR_CREATE_WORKFLOW, CONFIG_KEYS.STOP_ASYNC_TASK].includes(
        key,
      )
    ) {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return Boolean(value);
    }
    if (key === CONFIG_KEYS.WORKFLOW_TASK_DELAY) {
      return Number(value);
    }
    return value;
  };
  public getMainAppInstance = async () => {
    return AppSupervisor.getInstance().getApp('main');
  };
  private getMainAppRepository = async () => {
    const mainApp = await this.getMainAppInstance();
    if (!mainApp) {
      return null;
    }
    const repository = await mainApp.db.getRepository('systemManagement');
    return repository;
  };
  private getTransformValues = async () => {
    const repository = await this.getMainAppRepository();
    const items = await repository?.find();
    return items?.reduce((prev, current) => {
      prev[current.key] = this.convertValue(current.key, current.value);
      return prev;
    }, {});
  };
  public getConfig = async (): Promise<Record<string, any>> => {
    const result = await this.cache.wrap('config', async () => {
      return await this.getTransformValues();
    });
    return result;
  };
  public setConfig = async (config: Record<string, any>) => {
    const repository = await this.getMainAppRepository();
    if (isEmpty(config)) {
      throw Error('config is required');
    }
    for (const key in config) {
      if (Object.prototype.hasOwnProperty.call(config, key)) {
        await repository.updateOrCreate({
          filterKeys: ['key'],
          values: { key, value: config[key] },
        });
      }
    }
    const newCahce = await this.getTransformValues();
    await this.cache.set('config', newCahce);

    const changedConfig = await this.getConfig();
    // 配置变更 发布全局同步消息
    this.app.pubSubManager.publish(
      this.customChannel,
      {
        type: SYNC_MESSAGE_TYPE.SYSTEM_MANAGEMENT_CONFIG_CHANGE,
        config: changedConfig,
      },
      {
        skipSelf: false,
      },
    );
  };
  public getConsumeMode = async () => {
    const { consumeMode } = await this.getConfig();
    return consumeMode;
  };
  private handleCustomSyncMessage = async (message: any) => {
    const { type } = message || {};
    if (type === SYNC_MESSAGE_TYPE.SYSTEM_MANAGEMENT_CONFIG_CHANGE) {
      const { config } = message;
      await this.app.emitAsync(SYSTEM_MANAGEMENT_CONFIG_CHNAGE_EVENT, config);
    }
  };
  private subscribeCustomChannel = () => {
    this.app.pubSubManager.subscribe(this.customChannel, this.handleCustomSyncMessage.bind(this));
  };
}

export default SystemManager;
