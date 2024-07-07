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

export abstract class SyncAdapter extends EventEmitter {
  abstract get ready(): boolean;
  public abstract publish(data: Record<string, any>): void;
}

export type SyncMessageData = Record<string, string>;

export type SyncEventCallback = (message: SyncMessageData) => void;

export type SyncMessage = {
  namespace: string;
  nodeId: string;
  appName: string;
} & SyncMessageData;

/**
 * @experimental
 */
export class SyncManager {
  private nodeId: string;
  private app: Application;
  private eventEmitter = new EventEmitter();
  private adapter = null;
  private incomingBuffer: SyncMessageData[] = [];
  private outgoingBuffer: [string, SyncMessageData][] = [];
  private flushTimer: NodeJS.Timeout = null;

  private onSync = (messages: SyncMessage[]) => {
    this.app.logger.info('sync messages received into buffer:', messages);
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.incomingBuffer = uniqWith(
      this.incomingBuffer.concat(
        messages
          .filter((item) => item.nodeId !== this.nodeId && item.appName === this.app.name)
          .map(({ nodeId, appName, ...message }) => message),
      ),
      isEqual,
    );

    this.flushTimer = setTimeout(() => {
      this.incomingBuffer.forEach(({ namespace, ...message }) => {
        this.app.logger.info(`emit sync event in namespace ${namespace}`);
        this.eventEmitter.emit(namespace, message);
      });
    }, 1000);
  };

  private onReady = () => {
    while (this.outgoingBuffer.length) {
      const [namespace, data] = this.outgoingBuffer.shift();
      this.publish(namespace, data);
    }
  };

  constructor(app: Application) {
    this.app = app;
    this.nodeId = `${process.env.NODE_ID || randomUUID()}-${process.pid}`;
  }

  public init(adapter: SyncAdapter) {
    if (this.adapter) {
      throw new Error('sync adapter is already exists');
    }
    if (!adapter) {
      return;
    }
    this.adapter = adapter;
    this.adapter.on('message', this.onSync);
    this.adapter.on('ready', this.onReady);
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
    if (!this.adapter.ready) {
      this.outgoingBuffer.push([namespace, data]);
      this.app.logger.warn(`sync adapter is not ready for now, message will be send when it is ready`);
      return;
    }
    this.app.logger.info(`publishing sync message from #${this.nodeId} (${this.app.name}) in namespace ${namespace}:`, {
      data,
    });
    return this.adapter.publish({ ...data, nodeId: this.nodeId, appName: this.app.name, namespace });
  }
}
