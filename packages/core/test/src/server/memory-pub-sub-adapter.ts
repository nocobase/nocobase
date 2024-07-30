/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { IPubSubAdapter } from '@nocobase/server';
import { uid } from '@nocobase/utils';
import EventEmitter from 'events';

class ExtendedEventEmitter extends EventEmitter {
  allListeners = [];
  constructor() {
    super();
  }

  // 覆盖 emit 方法
  // @ts-ignore
  emit(event, ...args) {
    // 首先触发特定事件的监听器
    super.emit(event, ...args);

    // 然后触发所有的统一监听器
    for (const listener of this.allListeners) {
      listener(event, ...args);
    }
  }

  // 添加 subscribeAll 方法
  subscribeAll(listener) {
    this.allListeners.push(listener);
  }
}

export class MemoryPubSubAdapter implements IPubSubAdapter {
  static instances = new Map<string, MemoryPubSubAdapter>();

  // use EventEmitter to simulate the external service
  private eventEmitter = new ExtendedEventEmitter();
  private connected = false;

  constructor(options?: any) {}

  static create(name?: string, options?: any) {
    if (!name) {
      name = uid();
    }
    if (!this.instances.has(name)) {
      this.instances.set(name, new MemoryPubSubAdapter(options));
    }

    return this.instances.get(name);
  }

  async connect() {
    this.connected = true;
  }

  async close() {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async publish(channel, message) {
    if (!this.connected) {
      return;
    }

    // publish event to external service
    this.eventEmitter.emit(channel, message);
  }

  subscribe(channel: string, callback, options?: any): Promise<any> {
    // to append new channel or topic to external service
    return;
  }

  unsubscribe(channel: string, callback): Promise<void> {
    // to remove channel or topic from external service
    return;
  }

  subscribeAll(callback, options?: any): Promise<void> {
    this.eventEmitter.subscribeAll(callback);
    return;
  }
}
