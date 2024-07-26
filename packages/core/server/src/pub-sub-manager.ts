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

export class PubSubManager {
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
    return this.adapter?.connected || false;
  }

  setAdapter(adapter: IPubSubAdapter) {
    this.adapter = adapter;
  }

  async connect() {
    if (!this.adapter) {
      return;
    }
    await this.adapter.connect();
    for (const [channel, callbacks] of this.subscribes) {
      for (const [, fn] of callbacks) {
        await this.adapter.subscribe(`${this.channelPrefix}${channel}`, fn);
      }
    }
  }

  async close() {
    if (!this.adapter) {
      return;
    }
    return await this.adapter.close();
  }

  async getMessageHash(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(message));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  async subscribe(channel: string, callback, options: PubSubManagerSubscribeOptions = {}) {
    const { debounce = 0 } = options;
    const wrappedCallback = async (wrappedMessage) => {
      const json = JSON.parse(wrappedMessage);
      if (!this.verifyMessage(json)) {
        return;
      }
      await this.handleMessage({ channel, message: json.message, debounce, callback });
    };
    if (!this.subscribes.has(channel)) {
      const map = new Map();
      this.subscribes.set(channel, map);
    }
    const map: Map<any, any> = this.subscribes.get(channel);
    const previous = map.get(callback);
    if (previous) {
      await this.adapter.unsubscribe(`${this.channelPrefix}${channel}`, previous);
    }
    map.set(callback, wrappedCallback);
    if (this.connected) {
      await this.adapter.subscribe(`${this.channelPrefix}${channel}`, wrappedCallback);
    }
  }

  async unsubscribe(channel, callback) {
    const map: Map<any, any> = this.subscribes.get(channel);
    let fn = null;
    if (map) {
      fn = map.get(callback);
      map.delete(callback);
    }
    if (!this.adapter || !fn) {
      return;
    }
    return this.adapter.unsubscribe(`${this.channelPrefix}${channel}`, fn);
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
    if (!this.adapter) {
      return;
    }
    const { debounce = 0 } = options;
    return this.adapter.subscribeAll(async (channel: string, wrappedMessage) => {
      if (!channel.startsWith(this.channelPrefix)) {
        return;
      }
      const json = JSON.parse(wrappedMessage);
      if (!this.verifyMessage(json)) {
        return;
      }
      const realChannel = channel.substring(this.channelPrefix.length);
      await this.handleMessage({
        callback,
        debounce,
        subscribeAll: true,
        channel: realChannel,
        message: json.message,
      });
    });
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
      this.messageHandlers.delete(messageHash);
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
}

export interface IPubSubAdapter {
  connected?: boolean;
  connect(): Promise<any>;
  close(): Promise<any>;
  subscribe(channel: string, callback): Promise<any>;
  unsubscribe(channel: string, callback): Promise<any>;
  publish(channel: string, message): Promise<any>;
  subscribeAll(callback): Promise<any>;
}
