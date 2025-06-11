/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Transactionable } from '@nocobase/database';
import Application from './application';
import { PubSubCallback, PubSubManager, PubSubManagerPublishOptions } from './pub-sub-manager';
import { omit } from 'lodash';
import { Plugin } from './plugin';

export class SyncMessageManager {
  protected versionManager: SyncMessageVersionManager;
  protected pubSubManager: PubSubManager;
  constructor(
    protected app: Application,
    protected options: any = {},
  ) {
    this.versionManager = new SyncMessageVersionManager();
    app.on('beforeLoadPlugin', async (plugin) => {
      if (!plugin.name) {
        return;
      }

      await this.subscribe(plugin.name, this.createWrapper(plugin));
      //await this.subscribe(plugin.name, plugin.handleSyncMessage.bind(plugin));
    });
  }

  createWrapper(target: Plugin) {
    const wrapper = async (message) => {
      target.log.debug(`pulgin: ${target.name} => handleSyncMessage =>`, {
        app: this.app.name,
        module: 'SyncMessageManager',
        payload: message,
        timestamp: new Date().toISOString(),
      });
      await target.handleSyncMessage.bind(target)(message);
    };

    wrapper.displayName = `${target.name}.handleSyncMessage`;
    return wrapper;
  }

  get debounce() {
    return this.options.debounce || 1000;
    // return isNumber(this.options.debounce) || isUndefined(this.options.debounce) ? this.options.debounce : 1000;
  }

  async publish(channel: string, message, options?: PubSubManagerPublishOptions & Transactionable) {
    const { transaction, targetApp, ...others } = options || {};
    // 支持跨应用同步
    const targetChannel = `${targetApp || this.app.name}.sync.${channel}`;

    // 保持和 pub-sub-manager 一样，避免日志造成误会，非 task worker 或开启了 taskWorkerCanPublish 的才允许发布消息
    if (!this.app.isTaskWorker || options?.taskWorkerCanPublish) {
      this.app.log.debug(`plugin: ${channel} => sendSyncMessage =>`, {
        app: this.app.name,
        module: 'SyncMessageManager',
        channel: targetChannel,
        timestamp: new Date().toISOString(),
        payload: message,
        options,
      });
    }

    if (transaction) {
      return await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(
            new Error(
              `Publish message to ${channel} timeout, channel: ${channel}, message: ${JSON.stringify(message)}`,
            ),
          );
        }, 50000);

        transaction.afterCommit(async () => {
          try {
            const r = await this.app.pubSubManager.publish(targetChannel, message, {
              skipSelf: true,
              ...others,
            });

            resolve(r);
          } catch (error) {
            reject(error);
          } finally {
            clearTimeout(timer);
          }
        });
      });
    } else {
      return await this.app.pubSubManager.publish(targetChannel, message, {
        skipSelf: true,
        ...options,
      });
    }
  }

  async subscribe(channel: string, callback: PubSubCallback) {
    return await this.app.pubSubManager.subscribe(`${this.app.name}.sync.${channel}`, callback, {
      debounce: this.debounce,
    });
  }

  async unsubscribe(channel: string, callback: PubSubCallback) {
    return this.app.pubSubManager.unsubscribe(`${this.app.name}.sync.${channel}`, callback);
  }

  async sync() {
    //  处理pod间状态同步
    const { uniqueMessageHandlers, deleteUniqueMessageHandler } = this.app.pubSubManager.getHandlerManager();

    if (uniqueMessageHandlers instanceof Map && uniqueMessageHandlers.size) {
      console.log('\r\n SyncMessageManager => sync =>', uniqueMessageHandlers);
      for (const [messageHash, handler] of uniqueMessageHandlers.entries()) {
        try {
          // 使用 flush 方法立即执行防抖函数
          if (handler.flush) {
            await handler.flush();
          } else {
            await handler();
          }
          deleteUniqueMessageHandler(messageHash);
        } catch (error) {
          console.error(`Error executing handler for message hash ${messageHash}:`, error);
        }
      }
      console.log('\r\n SyncMessageManager => sync => done');
    }
  }

  async publishMessageToMainApp(
    channel: string,
    message,
    options?: Omit<PubSubManagerPublishOptions, 'targetApp'> & Transactionable,
  ) {
    await this.publish(channel, message, omit(options, 'targetApp'));
  }
}

export class SyncMessageVersionManager {
  // TODO
}
