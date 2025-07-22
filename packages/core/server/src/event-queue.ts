/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';

import Application from './application';
import { sleep } from '@nocobase/utils';

export const QUEUE_DEFAULT_INTERVAL = 250;
export const QUEUE_DEFAULT_CONCURRENCY = 1;
export const QUEUE_DEFAULT_ACK_TIMEOUT = 15_000;

export type QueueCallbackOptions = {
  id?: string;
  retried?: number;
  signal?: AbortSignal;
};

export type QueueCallback = (message: any, options: QueueCallbackOptions) => Promise<void>;

export type QueueEventOptions = {
  /**
   * @experimental
   */
  interval?: number;
  concurrency?: number;
  idle(): boolean;
  process: QueueCallback;
};

export type QueueMessageOptions = {
  timeout?: number;
  maxRetries?: number;
  retried?: number;
  timestamp?: number;
};

export interface IEventQueueAdapter {
  isConnected(): boolean;
  connect(): Promise<void> | void;
  close(): Promise<void> | void;
  subscribe(channel: string, event: QueueEventOptions): void;
  unsubscribe(channel: string): void;
  publish(channel: string, message: any, options: QueueMessageOptions): Promise<void> | void;
}

export interface EventQueueOptions {
  channelPrefix?: string;
}

export class MemoryEventQueueAdapter implements IEventQueueAdapter {
  private connected = false;

  private emitter: EventEmitter = new EventEmitter();

  private reading: Map<string, Promise<void>[]> = new Map();

  protected events: Map<string, QueueEventOptions> = new Map();

  protected queues: Map<string, { id: string; content: any; options?: QueueMessageOptions }[]> = new Map();

  get processing() {
    const processing = Array.from(this.reading.values());

    if (processing.length > 0) {
      return Promise.all(processing);
    }

    return null;
  }

  private get storagePath() {
    return path.resolve(process.cwd(), 'storage', 'apps', this.options.appName, 'event-queue.json');
  }

  listen = (channel: string) => {
    if (!this.connected) {
      return;
    }
    const event = this.events.get(channel);
    if (!event) {
      console.warn(`memory queue (${channel}) not found, skipping...`);
      return;
    }
    if (!event.idle()) {
      return;
    }

    const reading = this.reading.get(channel) || [];
    const count = (event.concurrency || QUEUE_DEFAULT_CONCURRENCY) - reading.length;
    if (count <= 0) {
      console.debug(
        `memory queue (${channel}) is already reading as max concurrency (${reading.length}), waiting last reading to end...`,
      );
      return;
    }
    console.debug(`reading more from queue (${channel}), count: ${count}`);
    this.read(channel, count).forEach((promise) => {
      reading.push(promise);
      // eslint-disable-next-line promise/catch-or-return
      promise.finally(() => {
        const index = reading.indexOf(promise);
        if (index > -1) {
          reading.splice(index, 1);
        }
      });
    });
    this.reading.set(channel, reading);
  };

  constructor(private options: { appName: string }) {
    this.emitter.setMaxListeners(0);
  }

  isConnected(): boolean {
    return this.connected;
  }

  setConnected(connected: boolean) {
    this.connected = connected;
  }

  async loadFromStorage() {
    let queues = {};
    let exists = false;
    try {
      await fs.stat(this.storagePath);
      exists = true;
    } catch (ex) {
      console.info(`memory queue storage file not found, skip`);
    }
    if (exists) {
      try {
        const queueJson = await fs.readFile(this.storagePath);
        queues = JSON.parse(queueJson.toString());
        console.debug('memory queue loaded from storage', queues);
        await fs.unlink(this.storagePath);
      } catch (ex) {
        console.error('failed to load queue from storage', ex);
      }
    }
    this.queues = new Map(Object.entries(queues));
  }

  private async saveToStorage() {
    const queues = Array.from(this.queues.entries()).reduce((acc, [channel, queue]) => {
      if (queue?.length) {
        acc[channel] = queue;
      }
      return acc;
    }, {});

    if (Object.keys(queues).length) {
      await fs.mkdir(path.dirname(this.storagePath), { recursive: true });
      await fs.writeFile(this.storagePath, JSON.stringify(queues));
      console.debug('memory queue saved to storage', queues);
    } else {
      console.debug('memory queue empty, no need to save to storage');
    }
  }

  async connect() {
    if (this.connected) {
      return;
    }

    await this.loadFromStorage();

    this.connected = true;

    setImmediate(() => {
      for (const channel of this.events.keys()) {
        this.consume(channel);
      }
      // for (const channel of this.queues.keys()) {
      //   const queue = this.queues.get(channel);
      //   if (!queue?.length) {
      //     continue;
      //   }
      //   this.emitter.emit(channel, channel);
      // }
    });
  }

  async close() {
    if (!this.connected) {
      return;
    }
    this.connected = false;
    if (this.processing) {
      console.info('memory queue waiting for processing job...');
      await this.processing;
      console.info('memory queue job cleaned');
    }

    console.log('memory queue gracefully shutting down...');
    await this.saveToStorage();
  }

  subscribe(channel: string, options: QueueEventOptions): void {
    if (this.events.has(channel)) {
      return;
    }
    this.events.set(channel, options);
    if (!this.queues.has(channel)) {
      this.queues.set(channel, []);
    }

    this.emitter.on(channel, this.listen);

    if (this.connected) {
      this.consume(channel);
    }
  }

  unsubscribe(channel: string) {
    if (!this.events.has(channel)) {
      return;
    }
    this.events.delete(channel);
    this.emitter.off(channel, this.listen);
  }

  publish(channel: string, content: any, options: QueueMessageOptions = { timestamp: Date.now() }) {
    const event = this.events.get(channel);
    if (!event) {
      return;
    }
    if (!this.queues.get(channel)) {
      this.queues.set(channel, []);
    }
    const queue = this.queues.get(channel);
    const message = { id: randomUUID(), content, options };
    queue.push(message);
    console.debug(`memory queue (${channel}) published message`, content);

    setImmediate(() => {
      this.emitter.emit(channel, channel);
    });
  }

  async consume(channel: string, once = false) {
    while (this.connected && this.events.get(channel)) {
      const event = this.events.get(channel);
      const interval = event.interval || QUEUE_DEFAULT_INTERVAL;

      const queue = this.queues.get(channel);
      if (event.idle() && queue?.length) {
        this.listen(channel);
      }

      if (once) {
        break;
      }
      await sleep(interval);
    }
  }

  read(channel: string, n: number): Promise<void>[] {
    const queue = this.queues.get(channel);

    if (!queue?.length) {
      return [];
    }
    const messages = queue.slice(0, n);
    console.debug(`memory queue (${channel}) read ${messages.length} messages`, messages);
    queue.splice(0, messages.length);
    const batch = messages.map(({ id, ...message }) => this.process(channel, { id, message }));
    return batch;
  }

  async process(channel: string, { id, message }) {
    const event = this.events.get(channel);
    const { content, options: { timeout = QUEUE_DEFAULT_ACK_TIMEOUT, maxRetries = 0, retried = 0 } = {} } = message;
    console.debug(`memory queue (${channel}) processing message (${id})...`, content);
    return event
      .process(content, {
        id,
        retried,
        signal: AbortSignal.timeout(timeout),
      })
      .then(() => {
        console.debug(`memory queue (${channel}) consumed message (${id})`);
      })
      .catch((ex) => {
        if (maxRetries > 0 && retried < maxRetries) {
          const currentRetry = retried + 1;
          console.warn(
            `memory queue (${channel}) consum message (${id}) failed, retrying (${currentRetry} / ${maxRetries})...`,
            ex,
          );
          setTimeout(() => {
            this.publish(channel, content, { timeout, maxRetries, retried: currentRetry, timestamp: Date.now() });
          }, 1000);
        } else {
          console.error(ex);
        }
      });
  }
}

export class EventQueue {
  protected adapter: IEventQueueAdapter;
  protected events: Map<string, QueueEventOptions> = new Map();

  get channelPrefix() {
    return this.options?.channelPrefix;
  }

  constructor(
    protected app: Application,
    protected options: EventQueueOptions = {},
  ) {
    this.setAdapter(new MemoryEventQueueAdapter({ appName: this.app.name }));

    app.on('afterStart', async () => {
      await this.connect();
    });
    app.on('beforeStop', async () => {
      app.logger.info('[queue] gracefully shutting down...');
      await this.close();
    });
  }
  getFullChannel(channel: string) {
    return [this.app.name, this.channelPrefix, channel].filter(Boolean).join('.');
  }
  setAdapter<A extends IEventQueueAdapter>(adapter: A) {
    this.adapter = adapter;
  }
  isConnected() {
    if (!this.adapter) {
      return false;
    }
    return this.adapter.isConnected();
  }
  async connect() {
    if (!this.adapter) {
      throw new Error('no adapter set, cannot connect');
    }
    await this.adapter.connect();

    for (const [channel, event] of this.events.entries()) {
      this.adapter.subscribe(this.getFullChannel(channel), event);
    }
  }
  async close() {
    if (!this.adapter) {
      return;
    }
    await this.adapter.close();
    for (const channel of this.events.keys()) {
      this.adapter.unsubscribe(this.getFullChannel(channel));
    }
  }
  subscribe(channel: string, options: QueueEventOptions) {
    if (this.events.has(channel)) {
      this.app.logger.warn(`event queue already subscribed on channel "${channel}", new subscription will be ignored`);
      return;
    }
    this.events.set(channel, options);

    if (this.isConnected()) {
      this.adapter.subscribe(this.getFullChannel(channel), options);
    }
  }
  unsubscribe(channel: string) {
    if (!this.events.has(channel)) {
      return;
    }
    this.events.delete(channel);

    if (this.isConnected()) {
      this.adapter.unsubscribe(this.getFullChannel(channel));
    }
  }
  async publish(channel: string, message: any, options: QueueMessageOptions = {}) {
    if (!this.adapter) {
      throw new Error('no adapter set, cannot publish');
    }
    if (!this.isConnected()) {
      throw new Error('event queue not connected, cannot publish');
    }
    const c = this.getFullChannel(channel);
    this.app.logger.debug('event queue publishing:', { channel: c, message });
    await this.adapter.publish(c, message, {
      timeout: QUEUE_DEFAULT_ACK_TIMEOUT,
      ...options,
      timestamp: Date.now(),
    });
  }
}

export default EventQueue;
