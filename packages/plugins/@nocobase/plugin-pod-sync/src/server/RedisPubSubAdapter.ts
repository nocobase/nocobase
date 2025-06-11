/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createClient, RedisClientType } from 'redis';
import { IPubSubAdapter, PubSubCallback, Application } from '@nocobase/server';

export function createRedisPubSubAdapter(options: { url: string }) {
  return new RedisPubSubAdapter(options);
}

export class RedisPubSubAdapter implements IPubSubAdapter {
  private client: RedisClientType;
  private subscriber: RedisClientType;

  constructor(private options: { url: string }) {
    this.client = createClient({ url: this.options.url });
    this.subscriber = createClient({ url: this.options.url });
  }

  async connect() {
    // 在适配器中处理应用重启后的连接问题
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      if (!this.subscriber.isOpen) {
        await this.subscriber.connect();
      }
    } catch (e) {
      console.error(e);
    }
  }

  isConnected() {
    return this.client.isOpen && this.subscriber.isOpen;
  }

  async close() {
    try {
      if (this.client.isOpen) {
        await this.client.quit();
      }
      if (this.subscriber.isOpen) {
        await this.subscriber.quit();
      }
      // console.log(`\r\n ${this.app.name} [RedisPubSubAdapter] 关闭 \r\n `);
    } catch (e) {
      console.error('Error while closing Redis clients:', e);
    }
  }

  async subscribe(channel: string, callback: PubSubCallback) {
    await this.unsubscribe(channel, callback);
    // console.log(`\r\n ${this.app.name} [RedisPubSubAdapter] 订阅频道 ${channel} `, {
    //   callback,
    //   isConnected: this.isConnected(),
    // });
    await this.subscriber.subscribe(channel, async (message) => {
      // console.log(`\r\n  ${this.app.name} [RedisPubSubAdapter] 收到消息 ${channel} `, { message });
      try {
        await callback(message);
      } catch (error) {
        console.error('Error while processing message:', error);
      }
    });
  }

  async unsubscribe(channel: string, callback: PubSubCallback) {
    if (!this.subscriber.isOpen) {
      await this.subscriber.connect();
    }
    try {
      await this.subscriber.unsubscribe(channel, callback);
      // console.log(`\r\n [RedisPubSubAdapter] 退订频道 ${channel} `, { callback });
    } catch (error) {
      console.error(`[RedisPubSubAdapter] 退订频道 ${channel} 失败`, error);
    }
  }

  async publish(channel: string, message: string) {
    // console.log(`\r\n [${channel}] => publish =>`, { channel, message });
    await this.client.publish(channel, message);
  }
}
