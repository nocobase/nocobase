import { conflict } from '../kernel/errors.js';
import type {
  OnlineAgentPublicItem,
  OnlineAgentOutcome,
  OnlineAgentStreamEvent,
} from '../../shared/online-agent.js';
export type { OnlineAgentStreamEvent } from '../../shared/online-agent.js';
export interface OnlineAgentStreamWriter {
  seal(): Promise<void>;
  discard(error?: Error): Promise<void>;
  append(messageIndex: number, text: string): Promise<void>;
  publish(messageIndex: number, item: OnlineAgentPublicItem): Promise<void>;
  message(
    message: import('../../shared/conversations.js').ConversationMessage,
  ): Promise<void>;
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
      events: Map<string, OnlineAgentStreamEvent>;
      sizes: Map<string, number>;
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
      events: new Map<string, OnlineAgentStreamEvent>(),
      sizes: new Map<string, number>(),
      listeners: new Set<
        ReadableStreamDefaultController<OnlineAgentStreamEvent>
      >(),
      bytes: 0,
    };
    this.channels.set(id, channel);
    let finished: string | null = null;
    let sealed = false;
    let discarded = false;
    const deliver = (event: OnlineAgentStreamEvent) => {
      for (const listener of channel.listeners) {
        if ((listener.desiredSize ?? 0) <= 0) {
          listener.error(new Error('The stream consumer is too slow.'));
          channel.listeners.delete(listener);
        } else listener.enqueue(structuredClone(event));
      }
    };
    const cache = (
      key: string,
      snapshot: OnlineAgentStreamEvent,
      event: OnlineAgentStreamEvent,
      retainedSize = Buffer.byteLength(JSON.stringify(snapshot)),
    ) => {
      const size = retainedSize - (channel.sizes.get(key) ?? 0);
      if (
        channel.bytes + size > this.limit ||
        this.bytes + size > this.totalLimit
      )
        throw new Error('OnlineAgent stream cache limit exceeded.');
      channel.events.set(key, snapshot);
      channel.sizes.set(key, retainedSize);
      channel.bytes += size;
      this.bytes += size;
      deliver(event);
    };
    const seal = () => {
      if (sealed) return;
      sealed = true;
      if (this.channels.get(id) === channel) this.channels.delete(id);
      this.bytes -= channel.bytes;
      channel.events.clear();
      channel.sizes.clear();
      channel.bytes = 0;
    };
    return {
      seal: async () => {
        seal();
      },
      discard: async (error) => {
        if (discarded || finished !== null) return;
        discarded = true;
        sealed = true;
        if (this.channels.get(id) === channel) this.channels.delete(id);
        this.bytes -= channel.bytes;
        channel.events.clear();
        channel.sizes.clear();
        channel.bytes = 0;
        for (const listener of channel.listeners) {
          if (error) listener.error(error);
          else listener.close();
        }
        channel.listeners.clear();
      },
      append: async (messageIndex, text) => {
        if (sealed || finished !== null)
          throw conflict('This stream is closed.');
        const previous = channel.events.get(String(messageIndex));
        const prefix =
          previous?.type === 'part'
            ? previous.item.parts.map((part) => part.text).join('')
            : '';
        // Charge only the new fragment. Do not serialize the growing prefix per token.
        const retainedSize =
          (channel.sizes.get(String(messageIndex)) ??
            Buffer.byteLength(
              JSON.stringify({
                type: 'part',
                boundary: { afterSeq },
                messageIndex,
                item: {
                  role: 'assistant',
                  parts: [{ type: 'text', text: '' }],
                },
              }),
            )) +
          Buffer.byteLength(JSON.stringify(text)) -
          2;
        cache(
          String(messageIndex),
          {
            type: 'part',
            boundary: { afterSeq },
            messageIndex,
            item: {
              role: 'assistant',
              parts: [{ type: 'text', text: prefix + text }],
            },
          },
          { type: 'delta', boundary: { afterSeq }, messageIndex, text },
          retainedSize,
        );
      },
      message: async (message) => {
        if (sealed || finished !== null)
          throw conflict('This stream is closed.');
        const event: OnlineAgentStreamEvent = {
          type: 'message',
          message: structuredClone(message),
        };
        cache(`message:${message.id}`, event, event);
      },
      publish: async (messageIndex, item) => {
        if (sealed || finished !== null)
          throw conflict('This stream is closed.');
        const event: OnlineAgentStreamEvent = {
          type: 'part',
          boundary: { afterSeq },
          messageIndex,
          item: structuredClone(item),
        };
        cache(String(messageIndex), event, event);
      },
      finish: async (outcome, lastSeq) => {
        if (discarded) return;
        const key = JSON.stringify([outcome, lastSeq]);
        if (finished !== null) {
          if (finished !== key)
            throw conflict(
              'Stream completion conflicts with the saved result.',
            );
          return;
        }
        seal();
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
        channel.events.clear();
        channel.sizes.clear();
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
          for (const event of channel.events.values())
            controller.enqueue(structuredClone(event));
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
