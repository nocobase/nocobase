/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@nocobase/utils';
import Application from '../application';
import { HandlerManager } from './handler-manager';
import {
  PubSubCallback,
  type IPubSubAdapter,
  type PubSubManagerOptions,
  type PubSubManagerPublishOptions,
  type PubSubManagerSubscribeOptions,
} from './types';

export const createPubSubManager = (app: Application, options: PubSubManagerOptions) => {
  const pubSubManager = new PubSubManager(app, options);
  if (app.serving()) {
    app.on('afterStart', async () => {
      await pubSubManager.connect();
    });
    app.on('afterStop', async () => {
      await pubSubManager.close();
    });
  }
  return pubSubManager;
};

export class PubSubManager {
  protected publisherId: string;
  protected adapter: IPubSubAdapter;
  protected handlerManager: HandlerManager;

  constructor(
    protected app: Application,
    protected options: PubSubManagerOptions = {},
  ) {
    this.publisherId = uid();
    this.handlerManager = new HandlerManager(this.publisherId);
  }

  get channelPrefix() {
    return this.options?.channelPrefix ? `${this.options.channelPrefix}.` : '';
  }

  setAdapter(adapter: IPubSubAdapter) {
    this.adapter = adapter;
  }

  async isConnected() {
    if (this.adapter) {
      return this.adapter.isConnected();
    }
    return false;
  }

  async connect() {
    if (!this.adapter) {
      return;
    }
    if (!this.app.serving()) {
      this.app.logger.warn('app is not serving, will not connect to event queue');
      return;
    }
    await this.adapter.connect();
    // 如果没连接前添加的订阅，连接后需要把订阅添加上
    await this.handlerManager.each(async (channel, headler) => {
      this.app.logger.debug(`[PubSubManager] subscribe ${channel} added before connected`);
      await this.adapter.subscribe(`${this.channelPrefix}${channel}`, headler);
    });
  }

  async close() {
    if (!this.adapter) {
      return;
    }
    return await this.adapter.close();
  }

  async subscribe(channel: string, callback: PubSubCallback, options: PubSubManagerSubscribeOptions = {}) {
    // 先退订，防止重复订阅
    await this.unsubscribe(channel, callback);
    const handler = this.handlerManager.set(channel, callback, options);
    // 连接之后才能订阅

    if (await this.isConnected()) {
      this.app.logger.debug(`[PubSubManager] subscribe ${channel} added after connected`);
      await this.adapter.subscribe(`${this.channelPrefix}${channel}`, handler);
    }
  }

  async unsubscribe(channel: string, callback: PubSubCallback) {
    const handler = this.handlerManager.delete(channel, callback);

    if (!this.adapter || !handler) {
      return;
    }

    return this.adapter.unsubscribe(`${this.channelPrefix}${channel}`, handler);
  }

  async publish(channel: string, message: any, options?: PubSubManagerPublishOptions) {
    if (!this.adapter?.isConnected()) {
      this.app.logger.warn(
        `[PubSubManager] adapter is not exist or not connected, cannot publish message to channel ${channel}`,
      );
      return;
    }

    const wrappedMessage = JSON.stringify({
      publisherId: this.publisherId,
      ...options,
      message: message,
    });

    await this.adapter.publish(`${this.channelPrefix}${channel}`, wrappedMessage);

    this.app.logger.trace(`[PubSubManager] published message to channel ${channel}`);
  }
}
