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

let publisherId = undefined;

export const createPubSubManager = (app: Application, options: PubSubManagerOptions) => {
  if (app.pubSubManager) {
    app.pubSubManager.getHandlerManager().reset();
    return app.pubSubManager;
  }
  const pubSubManager = new PubSubManager(app, options);
  app.on('afterStart', async () => {
    await pubSubManager.connect();
  });
  app.on('afterStop', async () => {
    await pubSubManager.close();
  });
  return pubSubManager;
};

export class PubSubManager {
  protected publisherId: string;
  protected adapter: IPubSubAdapter;
  protected handlerManager: HandlerManager;
  protected app: Application;
  constructor(
    app: Application,
    protected options: PubSubManagerOptions = {},
  ) {
    publisherId = publisherId || uid();
    this.app = app;
    // this.publisherId = `${publisherId}#${app.name}`;
    this.publisherId = uid();
    this.handlerManager = new HandlerManager(this.publisherId);
  }

  get channelPrefix() {
    return this.options?.channelPrefix ? `${this.options.channelPrefix}.` : '';
  }

  getHandlerManager() {
    return this.handlerManager;
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
    // 由于应用的自启动过程中，afterStart可能触发两次，导致重复连接注册事件。所以如果已经连接，就不再连接
    if (!this.adapter) {
      return;
    }

    await this.adapter.connect();

    const count = this.handlerManager.countFunctions();
    this.app.logger.info(`PubSubManager 建立连接成功!!!, 订阅数量: ${count}`, this.handlerManager.handlers);
    // 如果没连接前添加的订阅，连接后需要把订阅添加上
    await this.handlerManager.each(async (channel, headler) => {
      await this.adapter.subscribe(`${this.channelPrefix}${channel}`, headler);
    });
  }

  async close() {
    if (!this.adapter) {
      return;
    }
    this.app.logger.info('PubSubManager 关闭连接!!!');
    return await this.adapter.close();
  }

  async subscribe(channel: string, callback: PubSubCallback, options: PubSubManagerSubscribeOptions = {}) {
    // console.log(`\r\n\r\n 准备订阅: ${channel}，先退订，防止重复订阅`, { isConnected: await this.isConnected() });
    // 先退订，防止重复订阅
    await this.unsubscribe(channel, callback);
    const handler = this.handlerManager.set(channel, callback, options);
    // 连接之后才能订阅
    // console.log(`订阅到: ${channel} isConnected: ${await this.isConnected()}`, { handler, callback }); // Add this line
    if (await this.isConnected()) {
      await this.adapter.subscribe(`${this.channelPrefix}${channel}`, handler);
    }
  }

  async unsubscribe(channel: string, callback: PubSubCallback) {
    const handler = this.handlerManager.delete(channel, callback);
    // console.log(`取消订阅: ${channel}, 删除旧订阅: ${!!handler}`, {
    //   isConnected: await this.isConnected(),
    //   flag: !this.adapter || !handler,
    // });
    if (!this.adapter || !handler) {
      return;
    }

    return this.adapter.unsubscribe(`${this.channelPrefix}${channel}`, handler);
  }

  async publish(channel: string, message: any, options?: PubSubManagerPublishOptions) {
    if (!this.adapter?.isConnected() || process.env.__E2E__) {
      return;
    }

    // 默认 task Worker 任务服务不发送消息，特殊场景需要用到时通过 taskWorkerCanPublish 开启
    if (this.app.isTaskWorker && !options?.taskWorkerCanPublish) {
      return;
    }

    const wrappedMessage = JSON.stringify({
      publisherId: this.publisherId,
      ...options,
      message: message,
    });

    return this.adapter.publish(`${this.channelPrefix}${channel}`, wrappedMessage);
  }
}
