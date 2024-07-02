/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'node:crypto';
import EventEmitter from 'node:events';
import Application from './application';
import { isEqual, uniqWith } from 'lodash';

export abstract class SyncAdapter {
  abstract get ready(): boolean;
  abstract onSync(callback: Function): void;
  abstract publish(data: Record<string, any>): void;
}

export type SyncMessageData = Record<string, any>;

export type SyncEventCallback = (message: SyncMessageData) => void;

export type SyncMessage = {
  namespace: string;
  nodeId: string;
} & SyncMessageData;

export class SyncManager {
  private nodeId: string;
  private app: Application;
  private eventEmitter = new EventEmitter();
  private adapter = null;
  private buffer: SyncMessageData[] = [];
  private flushTimer: NodeJS.Timeout = null;

  onSync = (messages: SyncMessage) => {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    const uniqueMessages = uniqWith(
      this.buffer.concat(
        messages
          .filter((item) => item.message.nodeId !== this.nodeId && item.message.appName === this.app.name)
          .map(({ message: { nodeId, appName, ...message } }) => message),
      ),
      isEqual,
    );
    this.buffer = uniqueMessages;

    this.flushTimer = setTimeout(() => {
      this.buffer.forEach(({ namespace, ...message }) => {
        this.eventEmitter.emit(namespace, message);
      });
    }, 1000);
  };

  constructor(app: Application) {
    this.app = app;
    this.nodeId = `${process.env.NODE_ID || randomUUID()}-${process.pid}`;
  }

  public async use(adapter: SyncAdapter) {
    if (this.adapter) {
      throw new Error('Adapter already exists');
    }
    if (!adapter) {
      return;
    }
    this.adapter = adapter;
    this.adapter.onSync(this.onSync);
  }

  public subscribe(namespace: string, callback: SyncEventCallback) {
    this.eventEmitter.on(namespace, callback);
  }

  public unsubscribe(namespace: string, callback: SyncEventCallback) {
    this.eventEmitter.off(namespace, callback);
  }

  /**
   * Publish a message to the sync manager
   */
  public publish(namespace: string, data: SyncMessageData) {
    if (!this.adapter) {
      return;
    }
    this.adapter.publish({ ...data, nodeId: this.nodeId, appName: this.app.name, namespace });
  }
}
