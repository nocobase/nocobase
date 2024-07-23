/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Application from './application';

export class PubSubManager {
  adapter: IPubSubAdapter;
  subscribes = new Map();

  constructor(
    protected app: Application,
    protected options: any = {},
  ) {
    app.on('afterStart', async () => {
      await this.connect();
    });
    app.on('afterStop', async () => {
      await this.close();
    });
    app.on('beforeLoadPlugin', async (plugin) => {
      if (!plugin.name) {
        return;
      }
      console.log('beforeLoadPlugin', plugin.name);
      await this.subscribe(plugin.name, plugin.onMessage.bind(plugin));
    });
  }

  get prefix() {
    return this.options.name || this.app.name;
  }

  setAdapter(adapter: IPubSubAdapter) {
    this.adapter = adapter;
  }

  async connect() {
    if (!this.adapter) {
      return;
    }
    await this.adapter.connect();
    // subscribe 要在 connect 之后
    for (const [channel, callbacks] of this.subscribes) {
      for (const callback of callbacks) {
        await this.adapter.subscribe(`${this.prefix}.${channel}`, callback);
      }
    }
  }

  async close() {
    if (!this.adapter) {
      return;
    }
    return await this.adapter.close();
  }

  async subscribe(channel, callback) {
    if (!this.subscribes.has(channel)) {
      const set = new Set();
      this.subscribes.set(channel, set);
    }
    const set = this.subscribes.get(channel);
    set.add(callback);
  }

  async unsubscribe(channel, callback) {
    const set = this.subscribes.get(channel);
    if (set) {
      set.delete(callback);
    }
    if (!this.adapter) {
      return;
    }
    return this.adapter.unsubscribe(`${this.prefix}.${channel}`, callback);
  }

  async publish(channel, message) {
    if (!this.adapter) {
      return;
    }
    return this.adapter.publish(`${this.prefix}.${channel}`, message);
  }

  onMessage(callback) {
    if (!this.adapter) {
      return;
    }
    return this.adapter.onMessage((channel, message) => {
      if (channel.startsWith(`${this.prefix}.`)) {
        callback(channel, message);
      }
    });
  }
}

export interface IPubSubAdapter {
  connect(): Promise<any>;
  close(): Promise<any>;
  subscribe(channel: string, callback): Promise<any>;
  unsubscribe(channel: string, callback): Promise<any>;
  publish(channel: string, message): Promise<any>;
  onMessage(callback): void;
}
