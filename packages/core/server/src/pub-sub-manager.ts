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
  basename?: string;
}

export interface PubSubManagerPublishOptions {
  skipSelf?: boolean;
  onlySelf?: boolean;
}

export interface PubSubManagerSubscribeOptions {
  debounce?: number;
}

export class PubSubManager {
  adapter: IPubSubAdapter;
  messageHanders = new Map();
  subscribes = new Map();
  publisherId: string;
  connected: boolean;

  static create(app: Application, options: PubSubManagerOptions) {
    const pubSubManager = new PubSubManager(options);
    app.on('afterStart', async () => {
      await pubSubManager.connect();
    });
    app.on('afterStop', async () => {
      await pubSubManager.close();
    });
    return pubSubManager;
  }

  constructor(protected options: PubSubManagerOptions = {}) {
    this.publisherId = uid();
  }

  get basename() {
    return this.options?.basename ? `${this.options.basename}.` : '';
  }

  setAdapter(adapter: IPubSubAdapter) {
    this.adapter = adapter;
  }

  async connect() {
    if (!this.adapter) {
      return;
    }
    this.connected = true;
    await this.adapter.connect();
    // subscribe 要在 connect 之后
    for (const [channel, callbacks] of this.subscribes) {
      for (const [, fn] of callbacks) {
        await this.adapter.subscribe(`${this.basename}${channel}`, fn);
      }
    }
  }

  async close() {
    if (!this.adapter) {
      return;
    }
    this.connected = false;
    return await this.adapter.close();
  }

  getMessageHash(message) {
    return crypto.createHash('sha256').update(JSON.stringify(message)).digest('hex');
  }

  async subscribe(channel: string, callback, options: PubSubManagerSubscribeOptions = {}) {
    const { debounce = 0 } = options;
    const wrappedCallback = async (wrappedMessage) => {
      const { onlySelf, skipSelf, publisherId, message } = JSON.parse(wrappedMessage);
      if (onlySelf && publisherId !== this.publisherId) {
        return;
      } else if (!onlySelf && skipSelf && publisherId === this.publisherId) {
        return;
      }
      if (!debounce) {
        await callback(message);
        return;
      }
      const messageHash = '__subscribe__' + channel + this.getMessageHash(message);
      if (!this.messageHanders.has(messageHash)) {
        this.messageHanders.set(messageHash, this.debounce(callback, debounce));
      }
      const handleMessage = this.messageHanders.get(messageHash);
      await handleMessage(message);
      this.messageHanders.delete(messageHash);
    };
    if (!this.subscribes.has(channel)) {
      const map = new Map();
      this.subscribes.set(channel, map);
    }
    const map: Map<any, any> = this.subscribes.get(channel);
    const previous = map.get(callback);
    if (previous) {
      await this.adapter.unsubscribe(`${this.basename}${channel}`, previous);
    }
    map.set(callback, wrappedCallback);
    if (this.connected) {
      await this.adapter.subscribe(`${this.basename}${channel}`, wrappedCallback);
    }
  }

  async unsubscribe(channel, callback) {
    const map: Map<any, any> = this.subscribes.get(channel);
    let fn = null;
    if (map) {
      fn = map.get(callback);
    }
    if (!this.adapter || !fn) {
      return;
    }
    return this.adapter.unsubscribe(`${this.basename}${channel}`, fn);
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

    return this.adapter.publish(`${this.basename}${channel}`, wrappedMessage);
  }

  async subscribeAll(callback, options: PubSubManagerSubscribeOptions = {}) {
    if (!this.adapter) {
      return;
    }
    const { debounce = 0 } = options;
    return this.adapter.subscribeAll(async (channel: string, wrappedMessage) => {
      if (!channel.startsWith(this.basename)) {
        return;
      }
      const { onlySelf, skipSelf, publisherId, message } = JSON.parse(wrappedMessage);
      if (onlySelf && publisherId !== this.publisherId) {
        return;
      } else if (!onlySelf && skipSelf && publisherId === this.publisherId) {
        return;
      }
      const realChannel = channel.substring(this.basename.length);
      if (!debounce) {
        await callback(realChannel, message);
        return;
      }
      const messageHash = '__subscribe_all__' + realChannel + this.getMessageHash(message);
      if (!this.messageHanders.has(messageHash)) {
        this.messageHanders.set(messageHash, this.debounce(callback, debounce));
      }
      const handleMessage = this.messageHanders.get(messageHash);
      await handleMessage(realChannel, message);
      this.messageHanders.delete(messageHash);
    });
  }

  protected debounce(func, wait: number) {
    if (wait) {
      return _.debounce(func, wait);
    }
    return func;
  }
}

export interface IPubSubAdapter {
  connect(): Promise<any>;
  close(): Promise<any>;
  subscribe(channel: string, callback): Promise<any>;
  unsubscribe(channel: string, callback): Promise<any>;
  publish(channel: string, message): Promise<any>;
  subscribeAll(callback): Promise<any>;
}
