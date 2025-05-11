/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Application from './application';

type Callback = (message: any) => Promise<void> | void;

type WrappedCallback = () => Callback | null;

export type QueueEventOptions =
  | {
      topic?: string;
      interval?: number;
      concurrency?: number;
      idle(): boolean;
      process: Callback;
    }
  | WrappedCallback;

type QueueChannelWithTopic = [string, string];

const defaultEventOptions: QueueEventOptions = {
  interval: 2000,
  idle() {
    return true;
  },
  process(message) {},
};

export interface IEventQueueAdapter {
  isConnected(): boolean;
  connect(): Promise<void> | void;
  close(): Promise<void> | void;
  subscribe(channel: string, event: QueueEventOptions): void;
  unsubscribe(channel: string, event?: QueueEventOptions): void;
  publish(channel: string | QueueChannelWithTopic, message: any): Promise<void> | void;
}

export interface EventQueueOptions {
  channelPrefix?: string;
}

export const QUEUE_DEFAULT_TOPIC = 'DEFAULT';
export const QUEUE_DEFAULT_INTERVAL = 1000;
export const QUEUE_DEFAULT_CONCURRENCY = 1;

async function sleep(time = QUEUE_DEFAULT_INTERVAL) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

export class MemoryEventQueueAdapter implements IEventQueueAdapter {
  private connected = false;

  private events: Map<string, Set<QueueEventOptions>> = new Map();

  protected queues: Map<string, Map<string, any[]>> = new Map();

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
  publish(channel: string | QueueChannelWithTopic, message: any) {
    let topic = QUEUE_DEFAULT_TOPIC;
    if (Array.isArray(channel)) {
      topic = channel[1];
      channel = channel[0];
    }
    if (!this.queues.get(channel)) {
      this.queues.set(channel, new Map());
    }
    const queue = this.queues.get(channel);
    if (!queue.get(topic)) {
      queue.set(topic, []);
    }
    queue.get(topic).push(message);

    const events = this.events.get(channel);
    if (!events) {
      return;
    }
    for (const event of events) {
      this.consume(channel, event, true);
    }
  }

  async consume(channel: string, event: QueueEventOptions, once = false) {
    while (this.connected && this.events.get(channel)?.has(event)) {
      let processor: Callback;
      let interval = QUEUE_DEFAULT_INTERVAL;
      let concurrency = QUEUE_DEFAULT_CONCURRENCY;
      let topic = QUEUE_DEFAULT_TOPIC;
      if (typeof event === 'function') {
        processor = event();
        if (!processor) {
          if (once) {
            break;
          }
          await sleep(interval);
          continue;
        }
      } else {
        processor = event.process;
        interval = event.interval ?? QUEUE_DEFAULT_INTERVAL;
        concurrency = event.concurrency ?? QUEUE_DEFAULT_CONCURRENCY;
        topic = event.topic ?? QUEUE_DEFAULT_TOPIC;

        if (!event.idle()) {
          if (once) {
            break;
          }
          await sleep(interval);
          continue;
        }
      }

      const queue = this.queues.get(channel);
      if (!queue || !queue.get(topic)?.length) {
        if (once) {
          break;
        }
        await sleep(interval);
        continue;
      }

      const messages = queue.get(topic);
      for (let i = 0; i < concurrency || messages.length; i += 1) {
        const message = messages.shift();
        try {
          await processor(message);
        } catch (ex) {
          messages.unshift(message);
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
    app.on('beforeStop', async () => {
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
      return;
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
  async publish(channel: string | QueueChannelWithTopic, message: any) {
    if (!this.adapter) {
      return;
    }
    if (!this.isConnected()) {
      return;
    }
    const c = Array.isArray(channel) ? [this.getFullChannel(channel[0]), channel[1]] : this.getFullChannel(channel);
    await this.adapter.publish(c as string | QueueChannelWithTopic, message);
  }
}

export default EventQueue;
