/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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

  private events: Map<string, Set<QueueEventOptions>> = new Map();

  protected queues: Map<string, { content: any; timeout?: number }[]> = new Map();

  isConnected(): boolean {
    return this.connected;
  }

  connect() {
    if (this.connected) {
      return;
    }
    this.connected = true;

    setImmediate(() => {
      for (const [channel, events] of this.events.entries()) {
        for (const event of events) {
          this.consume(channel, event);
        }
      }
    });
  }

  close() {
    this.connected = false;
  }

  subscribe(channel: string, options: QueueEventOptions): void {
    this.events.set(channel, this.events.get(channel) || new Set());
    const event = this.events.get(channel);
    if (event.has(options)) {
      return;
    }
    event.add(options);

    if (this.connected) {
      this.consume(channel, options);
    }
  }
  unsubscribe(channel: string, options: QueueEventOptions) {
    if (!this.events.has(channel)) {
      return;
    }
    const events = this.events.get(channel);
    if (options) {
      events.delete(options);
    } else {
      events.clear();
    }
    if (events.size === 0) {
      this.events.delete(channel);
    }
  }
  publish(channel: string, content: any, options: QueueMessageOptions = {}) {
    const events = this.events.get(channel);
    if (!events) {
      return;
    }
    if (!this.queues.get(channel)) {
      this.queues.set(channel, []);
    }
    const queue = this.queues.get(channel);
    queue.push({ content, timeout: options.timeout });

    for (const event of events) {
      this.consume(channel, event, true);
    }
  }

  async consume(channel: string, event: QueueEventOptions, once = false) {
    while (this.connected && this.events.get(channel)?.has(event)) {
      const interval = event.interval || QUEUE_DEFAULT_INTERVAL;
      const concurrency = event.concurrency || QUEUE_DEFAULT_CONCURRENCY;
      const processor = event.process;

      if (!event.idle()) {
        if (once) {
          break;
        }
        await sleep(interval);
        continue;
      }

      const queue = this.queues.get(channel);
      if (!queue || !queue.length) {
        if (once) {
          break;
        }
        await sleep(interval);
        continue;
      }

      for (let i = 0; i < concurrency || queue.length; i += 1) {
        const message = queue.shift();
        try {
          await processor(message.content, {
            signal: AbortSignal.timeout(message.timeout || QUEUE_DEFAULT_ACK_TIMEOUT),
          });
        } catch (ex) {
          queue.unshift(message);
          console.error(ex);
        }
      }

      if (once) {
        break;
      }
      await sleep(interval);
    }
  }
}

export class EventQueue {
  protected adapter: IEventQueueAdapter;
  protected events: Map<string, Set<QueueEventOptions>> = new Map();

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
    app.on('afterStop', async () => {
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

    for (const [channel, events] of this.events.entries()) {
      for (const event of events) {
        this.adapter.subscribe(this.getFullChannel(channel), event);
      }
    }
  }
  async close() {
    if (!this.adapter) {
      return;
    }
    for (const [channel, events] of this.events.entries()) {
      for (const event of events) {
        this.adapter.unsubscribe(this.getFullChannel(channel), event);
      }
    }
    return this.adapter.close();
  }
  subscribe(channel: string, options: QueueEventOptions) {
    this.events.set(channel, this.events.get(channel) || new Set());
    const event = this.events.get(channel);
    if (event.has(options)) {
      return;
    }
    event.add(options);

    if (this.isConnected()) {
      this.adapter.subscribe(this.getFullChannel(channel), options);
    }
  }
  unsubscribe(channel: string, options: QueueEventOptions) {
    if (!this.events.has(channel)) {
      return;
    }
    const events = this.events.get(channel);
    if (options) {
      events.delete(options);
    } else {
      events.clear();
    }
    if (events.size === 0) {
      this.events.delete(channel);
    }

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
    await this.adapter.publish(c, message, { timeout: QUEUE_DEFAULT_ACK_TIMEOUT, ...options });
  }
}

export default EventQueue;
