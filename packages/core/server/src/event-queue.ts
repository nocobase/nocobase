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

import Application from './application';

type Callback = (
  message: any,
  options: {
    id?: string;
    signal?: AbortSignal;
  },
) => Promise<void> | void;

export type QueueEventOptions = {
  interval?: number;
  concurrency?: number;
  idle(): boolean;
  process: Callback;
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
  unsubscribe(channel: string, event?: QueueEventOptions): void;
  publish(channel: string, message: any, options: QueueMessageOptions): Promise<void> | void;
}

export interface EventQueueOptions {
  channelPrefix?: string;
}

export const QUEUE_DEFAULT_INTERVAL = 1_000;
export const QUEUE_DEFAULT_CONCURRENCY = 1;
export const QUEUE_DEFAULT_ACK_TIMEOUT = 15_000;

async function sleep(time = QUEUE_DEFAULT_INTERVAL, timeout = false) {
  return new Promise((resolve, reject) => {
    setTimeout(timeout ? reject : resolve, time);
  });
}

export class MemoryEventQueueAdapter implements IEventQueueAdapter {
  private connected = false;

  private emitter: EventEmitter = new EventEmitter();

  private reading: Map<string, Promise<void>> = new Map();

  private events: Map<string, QueueEventOptions> = new Map();

  protected queues: Map<string, { id: string; content: any; options?: QueueMessageOptions }[]> = new Map();

  get processing() {
    const processing = Array.from(this.reading.values());

    if (processing.length > 0) {
      return Promise.all(processing);
    }

    return null;
  }

  listen = async (channel: string) => {
    if (this.reading.has(channel)) {
      await this.reading.get(channel);
    }
    const event = this.events.get(channel);
    if (!event) {
      console.warn(`queue (${channel}) not found, skipping...`);
      return;
    }
    if (!event.idle()) {
      console.debug(`queue (${channel}) is not idle, skipping...`);
      return;
    }
    const reading = this.read(channel);
    this.reading.set(channel, reading);
    await reading;
  };

  isConnected(): boolean {
    return this.connected;
  }

  connect() {
    if (this.connected) {
      return;
    }
    this.connected = true;

    // setImmediate(() => {
    //   for (const channel of this.events.keys()) {
    //     this.consume(channel);
    //   }
    // });
  }

  async close() {
    this.connected = false;
    if (this.processing) {
      await this.processing;
    }
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

    // if (this.connected) {
    //   this.consume(channel);
    // }
  }
  unsubscribe(channel: string) {
    if (!this.events.has(channel)) {
      return;
    }
    this.events.delete(channel);
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
    queue.push({ id: randomUUID(), content, options });

    // this.consume(channel, true);
    setImmediate(() => {
      this.emitter.emit(channel, channel);
    });
  }
  // async consume(channel: string, once = false) {
  //   while (this.connected && this.events.has(channel)) {
  //     const event = this.events.get(channel);
  //     const interval = event.interval || QUEUE_DEFAULT_INTERVAL;
  //     const concurrency = event.concurrency || QUEUE_DEFAULT_CONCURRENCY;
  //     const processor = event.process;

  //     if (!event.idle()) {
  //       if (once) {
  //         break;
  //       }
  //       await sleep(interval);
  //       continue;
  //     }

  //     const queue = this.queues.get(channel);
  //     if (!queue?.length) {
  //       if (once) {
  //         break;
  //       }
  //       await sleep(interval);
  //       continue;
  //     }

  //     for (let i = 0; i < concurrency || queue.length; i += 1) {
  //       const message = queue.shift();
  //       try {
  //         await processor(message.content, {
  //           signal: AbortSignal.timeout(message.options.timeout || QUEUE_DEFAULT_ACK_TIMEOUT),
  //         });
  //       } catch (ex) {
  //         queue.unshift(message);
  //         console.error(ex);
  //       }
  //     }

  //     if (once) {
  //       break;
  //     }
  //     await sleep(interval);
  //   }
  // }

  async read(channel: string) {
    const event = this.events.get(channel);
    if (!event) {
      this.reading.delete(channel);
      return;
    }
    const queue = this.queues.get(channel);

    while (queue?.length) {
      const messages = queue.slice(0, event.concurrency || QUEUE_DEFAULT_CONCURRENCY);
      queue.splice(0, messages.length);
      const batch = messages.map(({ id, ...message }) => this.process(channel, { id, message }));
      await Promise.all(batch);
    }
    this.reading.delete(channel);
  }

  async process(channel, { id, message }) {
    const event = this.events.get(channel);
    const { content, options: { timeout = QUEUE_DEFAULT_ACK_TIMEOUT, maxRetries = 0, retried = 0 } = {} } = message;
    try {
      await event.process(content, {
        signal: AbortSignal.timeout(timeout),
      });
    } catch (ex) {
      if (maxRetries > 0 && retried < maxRetries) {
        const currentRetry = retried + 1;
        console.warn(
          `redis queue (${channel}) consum message (${id}) failed, retrying (${currentRetry} / ${maxRetries})...`,
          ex,
        );
        setImmediate(() => {
          this.publish(channel, content, { timeout, maxRetries, retried: currentRetry, timestamp: Date.now() });
        });
      } else {
        console.error(ex);
      }
    }
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
    this.events = new Map();

    this.setAdapter(new MemoryEventQueueAdapter());

    app.on('afterStart', async () => {
      await this.connect();
    });
    app.on('beforeStop', async () => {
      app.logger.info('[queue] gracefully shuting down...');
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
    for (const [channel, event] of this.events.entries()) {
      this.adapter.unsubscribe(this.getFullChannel(channel), event);
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
  unsubscribe(channel: string, options: QueueEventOptions) {
    if (!this.events.has(channel)) {
      return;
    }
    this.events.delete(channel);

    if (this.isConnected()) {
      this.adapter.unsubscribe(this.getFullChannel(channel), options);
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
    await this.adapter.publish(c, message, { timeout: QUEUE_DEFAULT_ACK_TIMEOUT, ...options, timestamp: Date.now() });
  }
}

export default EventQueue;
