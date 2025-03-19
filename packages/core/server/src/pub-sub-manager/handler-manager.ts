/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import crypto from 'node:crypto';
import _ from 'lodash';
import { type PubSubManagerSubscribeOptions } from './types';

export class HandlerManager {
  handlers: Map<any, any>;
  uniqueMessageHandlers: Map<any, any>;

  constructor(protected publisherId: string) {
    this.reset();
  }

  protected async getMessageHash(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(message));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
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

  async handleMessage({ channel, message, callback, debounce }) {
    if (!debounce) {
      await callback(message);
      return;
    }
    const messageHash = channel + (await this.getMessageHash(message));
    if (!this.uniqueMessageHandlers.has(messageHash)) {
      this.uniqueMessageHandlers.set(messageHash, this.debounce(callback, debounce));
    }
    const handler = this.uniqueMessageHandlers.get(messageHash);
    try {
      await handler(message);
      setTimeout(() => {
        this.uniqueMessageHandlers.delete(messageHash);
      }, debounce);
    } catch (error) {
      this.uniqueMessageHandlers.delete(messageHash);
      throw error;
    }
  }

  wrapper(channel, callback, options) {
    const { debounce = 0 } = options;
    return async (wrappedMessage) => {
      const json = JSON.parse(wrappedMessage);
      if (!this.verifyMessage(json)) {
        return;
      }
      await this.handleMessage({ channel, message: json.message, debounce, callback });
    };
  }

  set(channel: string, callback, options: PubSubManagerSubscribeOptions) {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Map());
    }
    const headlerMap = this.handlers.get(channel);
    const headler = this.wrapper(channel, callback, options);
    headlerMap.set(callback, headler);
    return headler;
  }

  get(channel: string, callback) {
    const headlerMap = this.handlers.get(channel);
    if (!headlerMap) {
      return;
    }
    return headlerMap.get(callback);
  }

  delete(channel: string, callback) {
    if (!callback) {
      return;
    }
    const headlerMap = this.handlers.get(channel);
    if (!headlerMap) {
      return;
    }
    const headler = headlerMap.get(callback);
    headlerMap.delete(callback);
    return headler;
  }

  reset() {
    this.handlers = new Map();
    this.uniqueMessageHandlers = new Map();
  }

  async each(callback) {
    for (const [channel, headlerMap] of this.handlers) {
      for (const headler of headlerMap.values()) {
        await callback(channel, headler);
      }
    }
  }
}
