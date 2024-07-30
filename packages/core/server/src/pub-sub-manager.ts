/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@nocobase/utils';
import crypto from 'crypto';
import _ from 'lodash';
import Application from './application';

export interface PubSubManagerOptions {
  channelPrefix?: string;
}

export interface PubSubManagerPublishOptions {
  skipSelf?: boolean;
  onlySelf?: boolean;
}

export interface PubSubManagerSubscribeOptions {
  debounce?: number;
}

export const createPubSubManager = (app: Application, options: PubSubManagerOptions) => {
  const pubSubManager = new PubSubManager(options);
  app.on('afterStart', async () => {
    await pubSubManager.connect();
  });
  app.on('afterStop', async () => {
    await pubSubManager.close();
  });
  return pubSubManager;
};

export class PubSubManager implements PubSubAble {
  adapter: IPubSubAdapter;
  messageHandlers = new Map();
  subscribes = new Map();
  publisherId: string;

  constructor(protected options: PubSubManagerOptions = {}) {
    this.publisherId = uid();
  }

  get channelPrefix() {
    return this.options?.channelPrefix ? `${this.options.channelPrefix}.` : '';
  }

  get connected() {
    return this.adapter.isConnected();
  }

  setAdapter(adapter: IPubSubAdapter) {
    this.adapter = adapter;

    adapter.subscribeAll(async (channel, message) => {
      await this.onMessage(channel, message);
    });
  }

  async onMessage(channel, wrappedMessage) {
    const json = JSON.parse(wrappedMessage);

    if (!this.verifyMessage(json)) {
      return;
    }

    if (this.channelPrefix) {
      // remove prefix from channel
      channel = channel.replace(this.channelPrefix, '');
    }

    const channelSubscribes = this.subscribes.get(channel);

    if (channelSubscribes) {
      for (const [callback, options] of channelSubscribes) {
        await this.handleMessage({
          channel,
          message: json.message,
          callback,
          debounce: options?.debounce,
        });
      }
    }

    const subscribeAllSubscribes = this.subscribes.get('__subscribe_all__');

    if (subscribeAllSubscribes) {
      for (const [callback, options] of subscribeAllSubscribes) {
        await this.handleMessage({
          channel,
          message: json.message,
          callback,
          debounce: options?.debounce,
          subscribeAll: true,
        });
      }
    }
  }

  async connect() {
    if (!this.adapter) {
      return;
    }

    await this.adapter.connect();
  }

  async close() {
    if (!this.adapter) {
      return;
    }

    return await this.adapter.close();
  }

  async subscribe(channel: string, callback, options: PubSubManagerSubscribeOptions = {}) {
    if (!this.subscribes.has(channel)) {
      const map = new Map();
      this.subscribes.set(channel, map);
    }

    const map: Map<any, any> = this.subscribes.get(channel);
    map.set(callback, options);

    return this.adapter?.subscribe(`${this.channelPrefix}${channel}`, callback, options);
  }

  async unsubscribe(channel, callback) {
    const map: Map<any, any> = this.subscribes.get(channel);
    map?.delete(callback);

    return this.adapter?.unsubscribe(`${this.channelPrefix}${channel}`, callback);
  }

  async publish(channel, message, options?: PubSubManagerPublishOptions) {
    if (!this.adapter) {
      return;
    }

    const wrappedMessage = JSON.stringify({
      publisherId: this.publisherId,
      ...options,
      message: message,
    });

    return this.adapter.publish(`${this.channelPrefix}${channel}`, wrappedMessage);
  }

  async subscribeAll(callback, options: PubSubManagerSubscribeOptions = {}) {
    return this.subscribe('__subscribe_all__', callback, options);
  }

  protected async handleMessage({ channel, message, callback, debounce, subscribeAll = false }) {
    const args = subscribeAll ? [channel, message] : [message];

    if (!debounce) {
      await callback(...args);
      return;
    }

    const prefix = subscribeAll ? '__subscribe_all__' : '__subscribe__';

    const messageHash = prefix + channel + (await this.getMessageHash(message));

    if (!this.messageHandlers.has(messageHash)) {
      this.messageHandlers.set(messageHash, this.debounce(callback, debounce));
    }

    const handleMessage = this.messageHandlers.get(messageHash);

    try {
      const args = subscribeAll ? [channel, message] : [message];
      await handleMessage(...args);
    } catch (error) {
      this.messageHandlers.delete(messageHash);
      throw error;
    }
  }

  protected verifyMessage({ onlySelf, skipSelf, publisherId }) {
    if (onlySelf && publisherId !== this.publisherId) {
      return;
    } else if (!onlySelf && skipSelf && publisherId === this.publisherId) {
      return;
    }

    return true;
  }

  protected debounce(func, wait: number) {
    if (wait) {
      return _.debounce(func, wait);
    }
    return func;
  }

  protected async getMessageHash(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(message));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }
}

export interface PubSubAble {
  publish(channel: string, message, options?: any): Promise<any>;
  subscribe(channel: string, callback, options?: any): Promise<any>;
  unsubscribe(channel: string, callback): Promise<any>;
  subscribeAll(callback, options?: any): Promise<void>;
}

export interface IPubSubAdapter extends PubSubAble {
  isConnected(): boolean;
  connect(): Promise<any>;
  close(): Promise<any>;
  publish(channel: string, message): Promise<any>;
}
