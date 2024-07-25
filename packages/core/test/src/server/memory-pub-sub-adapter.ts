/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { IPubSubAdapter } from '@nocobase/server';
import { AsyncEmitter, applyMixins, uid } from '@nocobase/utils';
import { EventEmitter } from 'events';
import boolean from '@nocobase/database/src/operators/boolean';

export class MemoryPubSubAdapter extends EventEmitter implements IPubSubAdapter {
  declare emitAsync: (event: string | symbol, ...args: any[]) => Promise<boolean>;

  private connected = false;

  static instances = new Map<string, MemoryPubSubAdapter>();

  static create(name?: string, options?: any) {
    if (!name) {
      name = uid();
    }
    if (!this.instances.has(name)) {
      this.instances.set(name, new MemoryPubSubAdapter(options));
    }
    return this.instances.get(name);
  }

  constructor(protected options: any = {}) {
    super();
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

    this.emit('message', channel, message);
  }
}
