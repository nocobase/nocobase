import { randomUUID } from 'node:crypto';
import { JsonToSseTransformStream, uiMessageChunkSchema } from 'ai';
import { parseJsonEventStream } from '@ai-sdk/provider-utils';
import { Redis, type RedisOptions } from 'ioredis';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream/generic';
import {
  conversationsRepo,
  findConversation,
  lockConversation,
} from '../core/conversations/conversation.store.js';
import { conflict, notFound } from '../kernel/errors.js';
import { asJson, jsonObject } from '../kernel/values.js';
import type { TxRunner } from '../kernel/tx.js';
import type { NativeUIChunk } from './native.js';

/** Plugin-owned connections: the host cache interface does not expose Redis pub/sub. */
export type OnlineAgentRecoveryConfig = {
  redis: RedisOptions;
  namespace: string;
};
type Association = {
  streamId: string;
  executionId: string;
  backend: 'native' | 'runner';
};
const LEASE_MS = 30_000;
const MAX_BYTES = 8 * 1024 * 1024;

/** Single bounded response. Neither cancellation nor a slow subscriber cancels its producer. */
export class UIStreamChannel {
  private controller!: ReadableStreamDefaultController<NativeUIChunk>;
  private ended = false;
  private bytes = 0;
  private claimed = false;
  private initial?: ReadableStream<string>;
  readonly source: ReadableStream<NativeUIChunk>;
  constructor(
    readonly association: Association,
    private onError: (error: unknown) => void,
  ) {
    this.source = new ReadableStream(
      {
        start: (controller) => {
          this.controller = controller;
        },
        cancel: () => {
          this.ended = true;
        },
      },
      { highWaterMark: 4096 },
    );
  }
  attach(stream: ReadableStream<string>): void {
    this.initial = stream;
  }
  take(): ReadableStream<string> | undefined {
    if (this.claimed) return;
    this.claimed = true;
    return this.initial;
  }
  write(chunk: NativeUIChunk): void {
    if (this.ended) return;
    this.bytes += Buffer.byteLength(JSON.stringify(chunk));
    if (this.bytes > MAX_BYTES || (this.controller.desiredSize ?? 0) <= 0) {
      this.fail(new Error('UI stream limit exceeded; read saved history.'));
      return;
    }
    this.controller.enqueue(chunk);
  }
  fail(error: unknown): void {
    if (this.ended) return;
    this.onError(error);
    this.controller.enqueue({
      type: 'error',
      errorText:
        'The UI stream was interrupted; reconcile saved history and execution.',
    });
    this.close();
  }
  close(): void {
    if (!this.ended) this.controller.close();
    this.ended = true;
  }
}

/** SDK framing and the upstream resumable-stream engine, never a second replay implementation. */
export class OnlineAgentUIStreams {
  private publisher?: Redis;
  private subscriber?: Redis;
  private context?: ResumableStreamContext;
  private ready?: Promise<void>;
  private callbacks = new Map<string, (message: string) => void>();
  private tasks = new Set<Promise<unknown>>();
  private readers = new Set<() => void>();
  private channels = new Map<
    string,
    {
      channel: UIStreamChannel;
      userId: string;
      timer?: ReturnType<typeof setInterval>;
    }
  >();
  constructor(
    private deps: {
      tx?: TxRunner;
      recovery?: OnlineAgentRecoveryConfig;
      onError(error: unknown): void;
      measure?(phase: string, durationMs: number): void;
    },
  ) {
    if (deps.recovery && (!deps.tx || !deps.recovery.namespace.trim()))
      throw new Error(
        'UI recovery requires a database and an application namespace.',
      );
  }
  get enabled(): boolean {
    return Boolean(this.deps.recovery);
  }
  private key(id: string): string {
    return `${this.deps.recovery!.namespace}:producer:${id}`;
  }
  private fail(error: unknown): void {
    for (const { channel } of this.channels.values()) channel.fail(error);
  }
  async producerAvailable(id: string): Promise<boolean> {
    if (this.channels.has(id)) return true;
    if (!this.enabled) return false;
    try {
      await this.preflight();
      return Boolean(await this.publisher!.get(this.key(id)));
    } catch {
      return false;
    }
  }
  async preflight(): Promise<void> {
    if (!this.enabled) return;
    if (!this.ready)
      this.ready = (async () => {
        const options: RedisOptions = {
          ...this.deps.recovery!.redis,
          lazyConnect: true,
          enableOfflineQueue: false,
          maxRetriesPerRequest: 0,
          retryStrategy: () => null,
          connectTimeout: 1000,
          commandTimeout: 1500,
        };
        this.publisher = new Redis(options);
        this.subscriber = new Redis(options);
        this.publisher.on('error', (error) => this.fail(error));
        this.subscriber.on('error', (error) => this.fail(error));
        await Promise.all([
          this.publisher.connect(),
          this.subscriber.connect(),
        ]);
        const callbacks = this.callbacks;
        this.subscriber.on('message', (channel, value) =>
          callbacks.get(channel)?.(value),
        );
        // Upstream keeps draining after publication failure. Surface failure without repeating business work.
        const safely = async <T>(
          work: () => Promise<T>,
          fallback: T,
        ): Promise<T> => {
          try {
            return await work();
          } catch (error) {
            this.fail(error);
            return fallback;
          }
        };
        this.context = createResumableStreamContext({
          keyPrefix: this.deps.recovery!.namespace,
          waitUntil: (task) => {
            this.tasks.add(task);
            void task
              .finally(() => this.tasks.delete(task))
              .catch((error: unknown) => this.deps.onError(error));
          },
          publisher: {
            connect: async () => {},
            get: (key: string) => safely(() => this.publisher!.get(key), null),
            incr: (key: string) => this.publisher!.incr(key),
            set: (key: string, value: string, options?: { EX?: number }) =>
              safely(
                () =>
                  options?.EX
                    ? this.publisher!.set(key, value, 'EX', options.EX)
                    : this.publisher!.set(key, value),
                null,
              ),
            publish: (key: string, value: string) =>
              safely(() => this.publisher!.publish(key, value), 0),
          },
          subscriber: {
            connect: async () => {},
            subscribe: async (
              key: string,
              callback: (message: string) => void,
            ) => {
              callbacks.set(key, callback);
              await this.subscriber!.subscribe(key);
            },
            unsubscribe: async (key: string) => {
              callbacks.delete(key);
              if (this.subscriber!.status === 'ready')
                return this.subscriber!.unsubscribe(key);
            },
          },
        });
      })();
    try {
      await this.ready;
      await this.publisher!.ping();
      if (this.subscriber!.status !== 'ready')
        throw new Error('Subscriber unavailable.');
    } catch {
      throw conflict(
        'Shared UI recovery is unavailable; reconcile state before submitting input.',
      );
    }
  }
  private async association(
    userId: string,
    id: string,
    value?: Association,
    clear?: string,
  ): Promise<Association | undefined> {
    if (!value && !clear) {
      const row = await findConversation(this.deps.tx!.read(), id);
      if (!row || row.userId !== userId) throw notFound('Conversation');
      return jsonObject(row.metadata).onlineUIStream as Association | undefined;
    }
    const started = performance.now();
    try {
      await this.deps.tx!.run(async ({ conn }) => {
        const row = await lockConversation(conn, id, new Date().toISOString());
        if (!row || row.userId !== userId) throw notFound('Conversation');
        const metadata = { ...jsonObject(row.metadata) };
        if (
          clear &&
          (metadata.onlineUIStream as Association | undefined)?.streamId !==
            clear
        )
          return;
        if (value) metadata.onlineUIStream = value;
        else delete metadata.onlineUIStream;
        await conversationsRepo(conn).updateMany({
          filter: { id },
          values: { metadata: asJson(metadata) },
        });
      });
    } finally {
      this.deps.measure?.('ui-stream.association', performance.now() - started);
    }
  }
  async open(
    userId: string,
    id: string,
    executionId: string,
    backend: Association['backend'],
    stop?: () => void,
  ): Promise<UIStreamChannel> {
    await this.preflight();
    if (this.channels.has(id) || this.channels.size >= 1024)
      throw conflict(
        'This conversation already has a UI producer or the producer limit was reached.',
      );
    const channel = new UIStreamChannel(
      { streamId: randomUUID(), executionId, backend },
      (error) => this.deps.onError(error),
    );
    if (
      this.enabled &&
      !(await this.publisher!.set(
        this.key(id),
        channel.association.streamId,
        'PX',
        LEASE_MS,
        'NX',
      ))
    )
      throw conflict('This conversation already has a UI producer.');
    const active = {
      channel,
      userId,
      timer: undefined as ReturnType<typeof setInterval> | undefined,
    };
    this.channels.set(id, active);
    try {
      const source = channel.source.pipeThrough(new JsonToSseTransformStream());
      if (this.enabled) {
        const stream = await this.context!.createNewResumableStream(
          channel.association.streamId,
          () => source,
        );
        if (
          !stream ||
          (await this.context!.hasExistingStream(
            channel.association.streamId,
          )) !== true
        )
          throw conflict('UI stream registration failed before admission.');
        channel.attach(stream);
        if (stop) {
          const stopKey = `${this.deps.recovery!.namespace}:stop:${channel.association.streamId}`;
          this.callbacks.set(stopKey, (message) => {
            if (message === channel.association.streamId) stop();
          });
          await this.subscriber!.subscribe(stopKey);
        }
        await this.association(userId, id, channel.association);
        active.timer = setInterval(() => {
          void this.publisher!.eval(
            "if redis.call('get',KEYS[1]) == ARGV[1] then return redis.call('pexpire',KEYS[1],ARGV[2]) else return 0 end",
            1,
            this.key(id),
            channel.association.streamId,
            LEASE_MS,
          )
            .then((held) => {
              if (!held)
                channel.fail(new Error('UI producer association expired.'));
            })
            .catch((error) => channel.fail(error));
        }, 5000);
        active.timer.unref();
      } else channel.attach(source);
      return channel;
    } catch (error) {
      await this.close(id, channel);
      throw error;
    }
  }
  async bind(
    id: string,
    channel: UIStreamChannel,
    executionId: string,
  ): Promise<void> {
    channel.association.executionId = executionId;
    const active = this.channels.get(id);
    if (this.enabled && active?.channel === channel)
      await this.association(active.userId, id, channel.association);
  }
  async release(id: string, channel: UIStreamChannel): Promise<void> {
    const active = this.channels.get(id);
    if (active?.channel !== channel) return;
    clearInterval(active.timer);
    if (this.enabled) {
      await this.association(
        active.userId,
        id,
        undefined,
        channel.association.streamId,
      );
      const stopKey = `${this.deps.recovery!.namespace}:stop:${channel.association.streamId}`;
      if (this.callbacks.delete(stopKey) && this.subscriber!.status === 'ready')
        await this.subscriber!.unsubscribe(stopKey).catch((error: unknown) =>
          this.deps.onError(error),
        );
      await this.publisher!.eval(
        "if redis.call('get',KEYS[1]) == ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end",
        1,
        this.key(id),
        channel.association.streamId,
      ).catch((error: unknown) => this.deps.onError(error));
    }
    this.channels.delete(id);
  }
  async close(id: string, channel: UIStreamChannel): Promise<void> {
    try {
      await this.release(id, channel);
    } finally {
      channel.close();
    }
  }
  /** Called only after the adapter verified a terminal Run and completed its canonical synchronization. */
  async forgetCompleted(
    userId: string,
    id: string,
    executionId: string,
  ): Promise<void> {
    if (!this.enabled) return;
    const association = await this.association(userId, id);
    if (!association || association.executionId !== executionId) return;
    await this.association(userId, id, undefined, association.streamId);
    try {
      await this.preflight();
      await this.publisher!.eval(
        "if redis.call('get',KEYS[1]) == ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end",
        1,
        this.key(id),
        association.streamId,
      );
    } catch (error) {
      this.deps.onError(error);
    }
  }
  /** Authorized business Stop, separate from cancelling any browser subscription. */
  async requestStop(
    userId: string,
    id: string,
    executionId: string,
  ): Promise<boolean> {
    if (!this.enabled) return false;
    await this.preflight();
    const association = await this.association(userId, id);
    if (
      !association ||
      association.backend !== 'native' ||
      association.executionId !== executionId
    )
      return false;
    if ((await this.publisher!.get(this.key(id))) !== association.streamId)
      return false;
    return (
      (await this.publisher!.publish(
        `${this.deps.recovery!.namespace}:stop:${association.streamId}`,
        association.streamId,
      )) > 0
    );
  }
  async receive(
    userId: string,
    id: string,
    channel?: UIStreamChannel,
  ): Promise<ReadableStream<NativeUIChunk> | null> {
    let stream = channel?.take();
    let association = channel?.association;
    if (!stream) {
      if (!this.enabled) return null;
      await this.preflight();
      // A supplied channel belongs to one accepted submission, even after its initial stream was claimed.
      // Only an unpinned conversation read may discover the current producer.
      association = channel
        ? channel.association
        : await this.association(userId, id);
      if (!association) return null;
      if ((await this.publisher!.get(this.key(id))) !== association.streamId)
        throw conflict(
          'The UI producer was lost; reconcile saved history and execution.',
        );
      try {
        stream =
          (await this.context!.resumeExistingStream(association.streamId)) ??
          undefined;
      } catch {
        throw conflict(
          'The UI stream was interrupted; reconcile saved history and execution.',
        );
      }
      if (!stream)
        throw conflict(
          'The UI stream expired or finished; reconcile saved history and execution.',
        );
    }
    const parsed: ReadableStream<NativeUIChunk> = parseJsonEventStream({
      stream: stream.pipeThrough(new TextEncoderStream()),
      schema: uiMessageChunkSchema,
    }).pipeThrough(
      new TransformStream({
        transform(result, controller) {
          if (!result.success) throw result.error;
          controller.enqueue(result.value as NativeUIChunk);
        },
      }),
    );
    const reader = parsed.getReader();
    let controller: ReadableStreamDefaultController<NativeUIChunk>;
    let ended = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    let missing = 0;
    const cleanup = () => {
      clearInterval(timer);
      this.readers.delete(shutdown);
    };
    const fail = (error: Error) => {
      if (ended) return;
      ended = true;
      cleanup();
      controller.error(error);
      void reader
        .cancel(error)
        .catch((error: unknown) => this.deps.onError(error));
    };
    const shutdown = () =>
      fail(
        new Error(
          'UI subscription service stopped; reconcile history and execution.',
        ),
      );
    return new ReadableStream<NativeUIChunk>({
      start: (value) => {
        controller = value;
        this.readers.add(shutdown);
        if (this.enabled && association) {
          const streamId = association.streamId;
          // The upstream sentinel may outlive a dead producer. This is application liveness, not a replay engine.
          timer = setInterval(() => {
            void this.publisher!.get(this.key(id))
              .then((owner) => {
                missing = owner === streamId ? 0 : missing + 1;
                if (missing >= 2)
                  fail(
                    new Error(
                      'The UI producer was lost; reconcile saved history and execution.',
                    ),
                  );
              })
              .catch(() =>
                fail(
                  new Error(
                    'Shared UI recovery was interrupted; reconcile saved history and execution.',
                  ),
                ),
              );
          }, 5000);
          timer.unref();
        }
      },
      pull: async () => {
        try {
          const next = await reader.read();
          if (ended) return;
          if (next.done) {
            ended = true;
            cleanup();
            controller.close();
          } else {
            if (next.value.type === 'finish') clearInterval(timer);
            controller.enqueue(next.value);
          }
        } catch (error) {
          fail(
            error instanceof Error
              ? error
              : new Error('The UI subscription was interrupted.'),
          );
        }
      },
      cancel: async () => {
        ended = true;
        cleanup();
        await reader.cancel();
      },
    });
  }
  async shutdown(): Promise<void> {
    for (const stop of [...this.readers]) stop();
    for (const { channel, timer } of this.channels.values()) {
      clearInterval(timer);
      channel.close();
    }
    await Promise.allSettled([...this.tasks]);
    this.publisher?.disconnect();
    this.subscriber?.disconnect();
    this.channels.clear();
  }
}
