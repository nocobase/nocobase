import { conflict } from '../kernel/errors.js';
import type { OnlineAgentPublicItem, OnlineAgentOutcome } from './codec.js';

export type OnlineAgentStreamEvent =
  | {
      type: 'part';
      boundary: { afterSeq: number };
      messageIndex: number;
      item: OnlineAgentPublicItem;
    }
  | {
      type: 'saved';
      boundary: { afterSeq: number };
      lastSeq: number;
      status: 'idle';
      outcome: OnlineAgentOutcome;
    };
export interface OnlineAgentStreamWriter {
  publish(messageIndex: number, item: OnlineAgentPublicItem): Promise<void>;
  finish(outcome: OnlineAgentOutcome, lastSeq: number): Promise<void>;
}
export interface OnlineAgentStreamManager {
  open(id: string, afterSeq: number): Promise<OnlineAgentStreamWriter>;
  receive(id: string): Promise<ReadableStream<OnlineAgentStreamEvent> | null>;
}

/** Cache and listener attachment are synchronous so the first subscription has no replay gap. */
export class OnlineAgentMemoryStreamManager implements OnlineAgentStreamManager {
  private channels = new Map<
    string,
    {
      events: OnlineAgentStreamEvent[];
      listeners: Set<ReadableStreamDefaultController<OnlineAgentStreamEvent>>;
      bytes: number;
    }
  >();
  private bytes = 0;
  constructor(
    private limit: number = 4 * 1024 * 1024,
    private totalLimit: number = 32 * 1024 * 1024,
  ) {}
  async open(id: string, afterSeq: number): Promise<OnlineAgentStreamWriter> {
    if (this.channels.size >= 1024)
      throw new Error('OnlineAgent channel limit exceeded.');
    if (this.channels.has(id))
      throw conflict('This conversation already has an open stream.');
    const channel = {
      events: [] as OnlineAgentStreamEvent[],
      listeners: new Set<
        ReadableStreamDefaultController<OnlineAgentStreamEvent>
      >(),
      bytes: 0,
    };
    this.channels.set(id, channel);
    let finished: string | null = null;
    const deliver = (event: OnlineAgentStreamEvent) => {
      for (const listener of channel.listeners) {
        if ((listener.desiredSize ?? 0) <= 0) {
          listener.error(new Error('The stream consumer is too slow.'));
          channel.listeners.delete(listener);
        } else listener.enqueue(event);
      }
    };
    return {
      publish: async (messageIndex, item) => {
        if (finished !== null) throw conflict('This stream is closed.');
        const event: OnlineAgentStreamEvent = {
          type: 'part',
          boundary: { afterSeq },
          messageIndex,
          item,
        };
        const size = Buffer.byteLength(JSON.stringify(event));
        if (
          channel.bytes + size > this.limit ||
          this.bytes + size > this.totalLimit
        )
          throw new Error('OnlineAgent stream cache limit exceeded.');
        channel.events.push(event);
        channel.bytes += size;
        this.bytes += size;
        deliver(event);
      },
      finish: async (outcome, lastSeq) => {
        const key = JSON.stringify([outcome, lastSeq]);
        if (finished !== null) {
          if (finished !== key)
            throw conflict(
              'Stream completion conflicts with the saved result.',
            );
          return;
        }
        finished = key;
        if (this.channels.get(id) === channel) this.channels.delete(id);
        this.bytes -= channel.bytes;
        deliver({
          type: 'saved',
          boundary: { afterSeq },
          lastSeq,
          status: 'idle',
          outcome,
        });
        for (const listener of channel.listeners) listener.close();
        channel.listeners.clear();
        channel.events = [];
        channel.bytes = 0;
      },
    };
  }
  async receive(
    id: string,
  ): Promise<ReadableStream<OnlineAgentStreamEvent> | null> {
    const channel = this.channels.get(id);
    if (!channel) return null;
    if (channel.listeners.size >= 64)
      throw new Error('OnlineAgent subscriber limit exceeded.');
    let subscriber: ReadableStreamDefaultController<OnlineAgentStreamEvent>;
    return new ReadableStream<OnlineAgentStreamEvent>(
      {
        start(controller) {
          subscriber = controller;
          for (const event of channel.events) controller.enqueue(event);
          channel.listeners.add(controller);
        },
        cancel() {
          channel.listeners.delete(subscriber);
        },
      },
      { highWaterMark: 4096 },
    );
  }
}
