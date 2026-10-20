import { Redis, type RedisOptions } from 'ioredis';
import {
  REALTIME_MAX_MESSAGE_BYTES,
  validateRealtimeTopic,
} from '../protocol.js';
import type {
  RealtimeBroker,
  RealtimeBrokerCallbacks,
  RealtimeBrokerControl,
  RealtimeBrokerEvent,
  RealtimeBrokerState,
} from './types.js';

export interface RedisRealtimeBrokerOptions {
  readonly namespace: string;
  readonly connection?: RedisOptions;
  readonly setupTimeoutMs?: number;
  readonly onError?: (error: unknown) => void;
}

/** Redis Pub/Sub is transient. A successful publish is admission, not delivery. */
export function createRedisRealtimeBroker(
  options: RedisRealtimeBrokerOptions,
): RealtimeBroker {
  if (!options.namespace.trim())
    throw new TypeError('Realtime namespace is required.');
  const channel = `nocobase:realtime:${options.namespace}`;
  let publisher: Redis | undefined;
  let subscriber: Redis | undefined;
  let listener: ((event: RealtimeBrokerEvent) => Promise<void>) | undefined;
  let callbacks: RealtimeBrokerCallbacks | undefined;
  let subscribed = false;
  let generation = 0;
  let closed = false;
  let everReady = false;
  let state: RealtimeBrokerState = 'connecting';
  const waiters = new Set<{ resolve(): void; reject(error: Error): void }>();
  function report(error: unknown): void {
    try {
      options.onError?.(error);
    } catch {
      /* Logging must not break recovery. */
    }
  }
  function notify(callback: (() => void) | undefined): void {
    try {
      callback?.();
    } catch (error) {
      report(error);
    }
  }
  function update(): void {
    const next = closed
      ? 'closed'
      : subscribed && publisher?.status === 'ready'
        ? 'ready'
        : everReady
          ? 'recovering'
          : 'connecting';
    if (next === state) return;
    state = next;
    notify(() => callbacks?.onStateChange(state));
    if (state === 'ready') {
      const recovered = everReady;
      everReady = true;
      for (const waiter of [...waiters]) waiter.resolve();
      if (recovered) notify(() => callbacks?.onRecovery());
    }
  }
  function createConnections(): void {
    const connection: RedisOptions = {
      ...options.connection,
      commandTimeout: options.connection?.commandTimeout ?? 5_000,
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 0,
      autoResubscribe: false,
      autoResendUnfulfilledCommands: false,
    };
    publisher = new Redis(connection);
    subscriber = new Redis(connection);
    publisher.on('ready', update);
    publisher.on('close', update);
    subscriber.on('close', () => {
      generation += 1;
      subscribed = false;
      update();
    });
    subscriber.on('ready', () => {
      const current = ++generation;
      const client = subscriber!;
      void client.subscribe(channel).then(
        () => {
          if (closed || current !== generation) return;
          subscribed = true;
          update();
        },
        (error: unknown) => {
          report(error);
          if (!closed && current === generation) client.disconnect(true);
        },
      );
    });
    subscriber.on('message', (receivedChannel: string, data: string) => {
      if (closed || receivedChannel !== channel || !subscribed) return;
      try {
        const message = parseEnvelope(data, options.namespace);
        if (!message) return;
        if (message.type === 'control')
          notify(() => callbacks?.onControl(message.control));
        else void listener?.(message.event).catch(report);
      } catch (error) {
        report(error);
      }
    });
    for (const client of [publisher, subscriber]) {
      client.on('error', report);
      void client.connect().catch(report);
    }
  }
  async function publish(value: Envelope): Promise<void> {
    if (closed || state !== 'ready' || !publisher)
      throw new Error('Realtime Redis broker is not ready.');
    const namespace =
      value.type === 'event' ? value.event.namespace : value.control.namespace;
    if (namespace !== options.namespace)
      throw new Error('Realtime Redis namespace mismatch.');
    const encoded = JSON.stringify(value);
    if (
      new TextEncoder().encode(encoded).byteLength >
      REALTIME_MAX_MESSAGE_BYTES * 2
    )
      throw new Error('Realtime Redis message is too large.');
    // Deliberately do not retry: a lost reply does not prove Redis rejected it.
    await publisher.publish(channel, encoded);
  }
  return {
    setup(receive, hooks) {
      if (closed)
        return Promise.reject(new Error('Realtime Redis broker is closed.'));
      listener = receive;
      callbacks = hooks;
      notify(() => callbacks?.onStateChange(state));
      if (!publisher) createConnections();
      if (state === 'ready') return Promise.resolve();
      return new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () => waiter.reject(new Error('Realtime Redis setup timed out.')),
          options.setupTimeoutMs ?? 5_000,
        );
        const waiter = {
          resolve() {
            clearTimeout(timer);
            waiters.delete(waiter);
            resolve();
          },
          reject(error: Error) {
            clearTimeout(timer);
            waiters.delete(waiter);
            reject(error);
          },
        };
        waiters.add(waiter);
      });
    },
    publish: (event) => publish({ type: 'event', event }),
    publishControl: (control) => publish({ type: 'control', control }),
    shutdown() {
      closed = true;
      generation += 1;
      update();
      for (const waiter of [...waiters])
        waiter.reject(new Error('Realtime Redis broker is closed.'));
      publisher?.disconnect();
      subscriber?.disconnect();
      listener = undefined;
      callbacks = undefined;
      return Promise.resolve();
    },
  };
}

type Envelope =
  | { type: 'event'; event: RealtimeBrokerEvent }
  | { type: 'control'; control: RealtimeBrokerControl };
function parseEnvelope(data: string, namespace: string): Envelope | undefined {
  if (
    new TextEncoder().encode(data).byteLength >
    REALTIME_MAX_MESSAGE_BYTES * 2
  )
    return;
  const value: unknown = JSON.parse(data);
  if (!record(value)) return;
  const body =
    value.type === 'event'
      ? value.event
      : value.type === 'control'
        ? value.control
        : undefined;
  if (!record(body) || body.namespace !== namespace || !identifier(body.origin))
    return;
  if (value.type === 'control') {
    if (
      (body.kind !== 'disconnect-user' && body.kind !== 'disconnect-session') ||
      !identifier(body.subjectId)
    )
      return;
    return {
      type: 'control',
      control: {
        origin: body.origin,
        namespace,
        kind: body.kind,
        subjectId: body.subjectId,
      },
    };
  }
  if (
    !identifier(body.eventId) ||
    typeof body.topic !== 'string' ||
    typeof body.publishedAt !== 'string' ||
    !Number.isFinite(Date.parse(body.publishedAt)) ||
    !Object.hasOwn(body, 'payload') ||
    (body.userId !== undefined && !identifier(body.userId))
  )
    return;
  validateRealtimeTopic(body.topic);
  return {
    type: 'event',
    event: {
      eventId: body.eventId,
      origin: body.origin,
      namespace,
      topic: body.topic,
      publishedAt: body.publishedAt,
      payload: body.payload,
      userId: body.userId,
    },
  };
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function identifier(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 256;
}
