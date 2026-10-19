import {
  encodeRealtimeServerMessage,
  parseRealtimeClientMessage,
  REALTIME_MAX_MESSAGE_BYTES,
  RealtimeProtocolError,
  validateRealtimeTopic,
  type RealtimeServerMessage,
} from '../protocol.js';
import { createAuthorizationGate } from './authorization.js';
import { createInMemoryBroker } from './broker.js';
import {
  compileTopic,
  formatTopic,
  matchTopic,
  topicsOverlap,
  type TopicDefinition,
} from './topics.js';
import {
  authorizeWithin,
  positiveLimit,
  snapshotPayload,
} from './validation.js';
import type {
  DefinedRealtimeTopic,
  RealtimeBroker,
  RealtimeBrokerState,
  RealtimeBrokerControl,
  RealtimeBrokerEvent,
  RealtimeConnection,
  RealtimePublishOptions,
  RealtimePublishResult,
  RealtimeService,
  RealtimeSubscription,
  RealtimeTopicAudience,
  RealtimeTopicFamily,
  RealtimeTopicOptions,
} from './types.js';

export interface RealtimeServiceOptions {
  readonly logger?: {
    error(bindings: { err: unknown }, message: string): void;
  };
  readonly broker?: RealtimeBroker;
  readonly namespace?: string;
  readonly maxConnections?: number;
  readonly maxSubscriptionsPerConnection?: number;
  readonly maxMessageBytes?: number;
  readonly maxBufferedBytesPerConnection?: number;
  readonly maxPendingMessagesPerConnection?: number;
  readonly authorizationTimeoutMs?: number;
  readonly sessionCheckIntervalMs?: number;
  readonly maxConcurrentAuthorizations?: number;
  readonly maxPendingAuthorizations?: number;
  readonly maxRecentEventIds?: number;
}

interface PendingSubscription {
  readonly controller: AbortController;
  readonly definition: TopicDefinition;
  readonly promise: Promise<RealtimeSubscription>;
}

interface ConnectionState {
  readonly connection: RealtimeConnection;
  readonly controller: AbortController;
  readonly pending: Map<string, PendingSubscription>;
  nextSessionCheck: number;
  queued: number;
}

interface SubscriptionState {
  pendingEvent?: { encoded: string };
  delivery: Promise<void>;
  readonly subscription: RealtimeSubscription;
  readonly definition: TopicDefinition;
  readonly controller: AbortController;
  readonly requestId?: string;
}

export function createRealtimeService(
  options: RealtimeServiceOptions = {},
): RealtimeService {
  const limits = {
    authorizations: positiveLimit(options.maxConcurrentAuthorizations, 256),
    pendingAuthorizations: positiveLimit(
      options.maxPendingAuthorizations,
      2048,
    ),
    recentEventIds: positiveLimit(options.maxRecentEventIds, 10_000),
    connections: positiveLimit(options.maxConnections, 10_000),
    subscriptions: positiveLimit(options.maxSubscriptionsPerConnection, 64),
    messageBytes: positiveLimit(
      options.maxMessageBytes,
      REALTIME_MAX_MESSAGE_BYTES,
    ),
    bufferedBytes: positiveLimit(
      options.maxBufferedBytesPerConnection,
      1024 * 1024,
    ),
    pendingMessages: positiveLimit(options.maxPendingMessagesPerConnection, 64),
    authorizationTimeout: positiveLimit(options.authorizationTimeoutMs, 5_000),
    sessionCheckInterval: positiveLimit(options.sessionCheckIntervalMs, 30_000),
  };
  if (limits.messageBytes > REALTIME_MAX_MESSAGE_BYTES)
    throw new RangeError(
      'Realtime message limit exceeds the protocol maximum.',
    );
  const origin = crypto.randomUUID();
  const namespace = options.namespace ?? 'default';
  const broker = options.broker ?? createInMemoryBroker();
  const connections = new Map<string, ConnectionState>();
  const subscriptions = new Map<string, SubscriptionState>();
  const byTopic = new Map<string, Set<string>>();
  const listeners = new Map<string, Set<(count: number) => void>>();
  const definitions = new Map<string, TopicDefinition>();
  const gate = createAuthorizationGate(
    limits.authorizations,
    limits.pendingAuthorizations,
  );
  const deliveries = new Set<Promise<void>>();
  const recentEvents = new Set<string>();
  const metrics = {
    published: 0,
    publishFailures: 0,
    received: 0,
    duplicates: 0,
    coalesced: 0,
    delivered: 0,
    authorizationFailures: 0,
    authorizationTimeouts: 0,
    authorizationDurationMs: 0,
  };
  let brokerState: RealtimeBrokerState = 'connecting';
  let closed = false;
  let setup: Promise<void> | undefined;
  let closing: Promise<void> | undefined;
  let sessionTimer: ReturnType<typeof setInterval> | undefined;
  let checkingSessions = false;

  const service: RealtimeService = {
    setup() {
      if (closed)
        return Promise.reject(
          failure('SERVICE_CLOSED', 'Realtime service is closed.'),
        );
      setup ??= broker
        .setup(receive, {
          onStateChange(state) {
            brokerState = state;
          },
          onRecovery() {
            if (closed) return;
            for (const { connection } of connections.values())
              send(connection, { type: 'resync' });
          },
          onControl(control) {
            if (
              !closed &&
              control.namespace === namespace &&
              control.origin !== origin
            )
              disconnectMatching(control);
          },
        })
        .catch((error: unknown) => {
          setup = undefined;
          throw error;
        });
      return setup;
    },
    connect(ws, context = {}) {
      assertOpen();
      if (connections.size >= limits.connections) {
        ws.close(1013, 'realtime connection limit');
        throw failure(
          'TOO_MANY_CONNECTIONS',
          'Realtime connection limit reached.',
        );
      }
      const connection: RealtimeConnection = {
        ...context,
        id: crypto.randomUUID(),
        ws,
        connectedAt: new Date(),
        subscriptions: new Set(),
      };
      connections.set(connection.id, {
        connection,
        controller: new AbortController(),
        pending: new Map(),
        nextSessionCheck: nextSessionCheck(),
        queued: 0,
      });
      sessionTimer ??= setInterval(
        () => {
          void checkSessions();
        },
        Math.min(1_000, limits.sessionCheckInterval),
      );
      return connection;
    },
    disconnect(connection) {
      const state = connections.get(connection.id);
      if (!state || state.connection !== connection) return;
      connections.delete(connection.id);
      state.controller.abort();
      for (const pending of state.pending.values()) pending.controller.abort();
      state.pending.clear();
      for (const id of [...connection.subscriptions]) removeSubscription(id);
      connection.subscriptions.clear();
      if (connections.size === 0) {
        clearInterval(sessionTimer);
        sessionTimer = undefined;
      }
    },
    disconnectUser(userId) {
      return revoke('disconnect-user', userId);
    },
    disconnectSession(sessionId) {
      return revoke('disconnect-session', sessionId);
    },
    async flush() {
      await Promise.all([...deliveries]);
    },
    async subscribe(connection, topic, requestId) {
      const state = requireConnection(connection);
      const definition = requireTopic(topic);
      const existing = findSubscription(connection, topic);
      if (existing) return existing.subscription;
      const pending = state.pending.get(topic);
      if (pending) return pending.promise;
      if (
        connection.subscriptions.size + state.pending.size >=
        limits.subscriptions
      ) {
        throw failure(
          'TOO_MANY_SUBSCRIPTIONS',
          'Realtime connection has too many subscriptions.',
        );
      }
      const controller = new AbortController();
      const signal = AbortSignal.any([
        controller.signal,
        state.controller.signal,
      ]);
      const promise = (async (): Promise<RealtimeSubscription> => {
        await service.setup();
        await authorize(connection, definition, topic, signal);
        if (
          signal.aborted ||
          definitions.get(definition.pattern) !== definition
        )
          throw cancelled();
        requireConnection(connection);
        const subscription: RealtimeSubscription = {
          id: crypto.randomUUID(),
          connectionId: connection.id,
          topic,
          userId: connection.principal?.userId,
          createdAt: new Date(),
        };
        subscriptions.set(subscription.id, {
          delivery: Promise.resolve(),
          subscription,
          definition,
          controller,
          requestId,
        });
        connection.subscriptions.add(subscription.id);
        const ids = byTopic.get(topic) ?? new Set<string>();
        ids.add(subscription.id);
        byTopic.set(topic, ids);
        notify(topic);
        return subscription;
      })();
      state.pending.set(topic, { controller, definition, promise });
      try {
        return await promise;
      } finally {
        if (state.pending.get(topic)?.controller === controller)
          state.pending.delete(topic);
      }
    },
    unsubscribe(connection, selector) {
      const state = connections.get(connection.id);
      if (!state || state.connection !== connection) return [];
      if (selector.topic) {
        state.pending.get(selector.topic)?.controller.abort();
        state.pending.delete(selector.topic);
      }
      const removed: RealtimeSubscription[] = [];
      for (const id of [...connection.subscriptions]) {
        const entry = subscriptions.get(id);
        if (
          !entry ||
          (selector.subscriptionId && selector.subscriptionId !== id) ||
          (selector.topic && selector.topic !== entry.subscription.topic)
        )
          continue;
        removed.push(entry.subscription);
        removeSubscription(id);
      }
      return removed;
    },
    async handleClientMessage(connection, data) {
      let requestId: string | undefined;
      try {
        requireConnection(connection);
        const bytes =
          typeof data === 'string'
            ? new TextEncoder().encode(data).byteLength
            : data.byteLength;
        if (bytes > limits.messageBytes)
          throw failure('MESSAGE_TOO_LARGE', 'Realtime message is too large.');
        const message = parseRealtimeClientMessage(data);
        requestId = message.id;
        switch (message.type) {
          case 'subscribe': {
            const subscription = await service.subscribe(
              connection,
              message.topic,
              message.id,
            );
            if (!subscriptions.has(subscription.id)) return;
            send(connection, {
              type: 'subscribed',
              id: message.id,
              topic: subscription.topic,
              subscriptionId: subscription.id,
            });
            return;
          }
          case 'unsubscribe': {
            const removed = service.unsubscribe(connection, message);
            send(connection, {
              type: 'unsubscribed',
              id: message.id,
              topic: message.topic ?? removed[0]?.topic,
              subscriptionId:
                message.subscriptionId ??
                (removed.length === 1 ? removed[0]?.id : undefined),
            });
            return;
          }
          case 'publish':
            throw failure(
              'PUBLISH_FORBIDDEN',
              'Client publish is not allowed.',
            );
          case 'ping':
            send(connection, { type: 'pong', id: message.id });
            return;
        }
      } catch (error) {
        if (
          error instanceof RealtimeProtocolError &&
          error.code === 'SUBSCRIPTION_CANCELLED'
        )
          return;
        sendError(connection, error, requestId);
      }
    },
    registerTopic(topic, topicOptions) {
      return register(compileTopic(topic, topicOptions, false));
    },
    defineTopic<Payload, Audience extends RealtimeTopicAudience>(
      topic: string,
      topicOptions: RealtimeTopicOptions<Payload> & {
        readonly audience: Audience;
      },
    ): DefinedRealtimeTopic<Payload, Audience> {
      const definition = compileTopic(topic, topicOptions, false);
      const close = register(definition);
      const handle =
        topicOptions.audience === 'user'
          ? {
              name: topic,
              audience: 'user' as const,
              close,
              publishFor: (
                userId: string,
                payload: Payload,
              ): Promise<RealtimePublishResult> =>
                publishDefined(definition, topic, payload, { userId }),
            }
          : {
              name: topic,
              audience: 'public' as const,
              close,
              publish: (payload: Payload): Promise<RealtimePublishResult> =>
                publishDefined(definition, topic, payload),
            };
      return handle as DefinedRealtimeTopic<Payload, Audience>;
    },
    defineTopicFamily<Params extends Record<string, string>, Payload>(
      pattern: string,
      topicOptions: RealtimeTopicOptions<Payload, Params> & {
        readonly audience: 'public';
      },
    ): RealtimeTopicFamily<Params, Payload> {
      const definition = compileTopic(
        pattern,
        {
          ...topicOptions,
          authorize: topicOptions.authorize
            ? (context) =>
                topicOptions.authorize!({
                  ...context,
                  params: context.params as Params,
                })
            : undefined,
        },
        true,
      );
      const close = register(definition);
      return {
        pattern,
        close,
        topic: (params): string => formatTopic(definition, params),
        publish: async (params, payload): Promise<RealtimePublishResult> =>
          publishDefined(definition, formatTopic(definition, params), payload),
      };
    },
    async publish(topic, payload, publishOptions = {}) {
      return publishDefined(
        requireTopic(topic),
        topic,
        payload,
        publishOptions,
      );
    },
    subscriptionCount(topic) {
      return byTopic.get(topic)?.size ?? 0;
    },
    onTopicSubscriptionChange(topic, listener) {
      validateRealtimeTopic(topic);
      const callbacks =
        listeners.get(topic) ?? new Set<(count: number) => void>();
      callbacks.add(listener);
      listeners.set(topic, callbacks);
      return () => {
        callbacks.delete(listener);
        if (!callbacks.size) listeners.delete(topic);
      };
    },
    diagnostics() {
      return {
        ...metrics,
        brokerState,
        activeAuthorizations: gate.active,
        waitingAuthorizations: gate.waiting,
        queuedDeliveries: deliveries.size,
        connections: connections.size,
        subscriptions: subscriptions.size,
        pendingSubscriptions: [...connections.values()].reduce(
          (sum, state) => sum + state.pending.size,
          0,
        ),
      };
    },
    close() {
      if (closing) return closing;
      closed = true;
      brokerState = 'closed';
      recentEvents.clear();
      for (const state of connections.values())
        terminate(state.connection, 1001, 'realtime service closed');
      definitions.clear();
      listeners.clear();
      clearInterval(sessionTimer);
      closing = (async () => {
        try {
          await setup;
        } finally {
          await broker.shutdown();
        }
      })();
      return closing;
    },
  };

  function assertOpen(): void {
    if (closed) throw failure('SERVICE_CLOSED', 'Realtime service is closed.');
  }
  function requireConnection(connection: RealtimeConnection): ConnectionState {
    assertOpen();
    const state = connections.get(connection.id);
    if (
      !state ||
      state.connection !== connection ||
      connection.ws.readyState !== 1
    )
      throw cancelled();
    return state;
  }
  function requireTopic(topic: string): TopicDefinition {
    assertOpen();
    validateRealtimeTopic(topic);
    for (const definition of definitions.values())
      if (matchTopic(definition, topic)) return definition;
    throw failure('TOPIC_NOT_FOUND', 'Realtime topic is not registered.');
  }
  function register(definition: TopicDefinition): () => void {
    assertOpen();
    for (const existing of definitions.values())
      if (topicsOverlap(existing, definition))
        throw failure(
          'TOPIC_ALREADY_REGISTERED',
          'Realtime topic definitions overlap.',
        );
    definitions.set(definition.pattern, definition);
    return () => {
      if (definitions.get(definition.pattern) !== definition) return;
      definitions.delete(definition.pattern);
      for (const state of connections.values()) {
        for (const [topic, pending] of state.pending)
          if (pending.definition === definition) {
            pending.controller.abort();
            state.pending.delete(topic);
          }
      }
      for (const [id, entry] of subscriptions)
        if (entry.definition === definition) {
          const connection = connections.get(
            entry.subscription.connectionId,
          )?.connection;
          removeSubscription(id);
          if (connection)
            send(connection, {
              type: 'unsubscribed',
              id: entry.requestId,
              topic: entry.subscription.topic,
              subscriptionId: id,
            });
        }
    };
  }
  async function publishDefined(
    definition: TopicDefinition,
    topic: string,
    payload: unknown,
    publishOptions: RealtimePublishOptions = {},
  ): Promise<RealtimePublishResult> {
    assertOpen();
    if (definitions.get(definition.pattern) !== definition)
      throw failure('TOPIC_CLOSED', 'Realtime topic is closed.');
    if (definition.options.audience === 'user' && !publishOptions.userId)
      throw failure(
        'USER_AUDIENCE_REQUIRED',
        'Realtime topic requires a user audience.',
      );
    if (definition.options.audience === 'public' && publishOptions.userId)
      throw failure(
        'INVALID_AUDIENCE',
        'Realtime topic does not accept a user audience.',
      );
    const event: RealtimeBrokerEvent = {
      eventId: crypto.randomUUID(),
      origin,
      namespace,
      topic,
      userId: publishOptions.userId,
      payload: snapshotPayload(
        definition.options.parsePayload
          ? definition.options.parsePayload(payload)
          : payload,
      ),
      publishedAt: new Date().toISOString(),
    };
    encodeEvent(event);
    await service.setup();
    if (closed || definitions.get(definition.pattern) !== definition)
      throw failure('TOPIC_CLOSED', 'Realtime topic is closed.');
    try {
      await broker.publish(event);
      metrics.published += 1;
    } catch (error) {
      metrics.publishFailures += 1;
      throw error;
    }
    return { eventId: event.eventId, topic };
  }
  function encodeEvent(event: RealtimeBrokerEvent): string {
    const encoded = encodeRealtimeServerMessage({
      type: 'event',
      eventId: event.eventId,
      topic: event.topic,
      payload: event.payload,
      publishedAt: event.publishedAt,
    });
    if (new TextEncoder().encode(encoded).byteLength > limits.messageBytes)
      throw failure('MESSAGE_TOO_LARGE', 'Realtime message is too large.');
    return encoded;
  }
  function receive(event: RealtimeBrokerEvent): Promise<void> {
    if (closed || event.namespace !== namespace) return Promise.resolve();
    if (recentEvents.has(event.eventId)) {
      metrics.duplicates += 1;
      return Promise.resolve();
    }
    recentEvents.add(event.eventId);
    if (recentEvents.size > limits.recentEventIds)
      recentEvents.delete(recentEvents.values().next().value!);
    metrics.received += 1;
    const definition = [...definitions.values()].find((entry) =>
      matchTopic(entry, event.topic),
    );
    if (
      !definition ||
      (definition.options.audience === 'public' && event.userId)
    )
      return Promise.resolve();
    const encoded = encodeEvent(event);
    for (const id of [...(byTopic.get(event.topic) ?? [])]) {
      const entry = subscriptions.get(id);
      const state = entry
        ? connections.get(entry.subscription.connectionId)
        : undefined;
      if (
        !entry ||
        !state ||
        entry.definition !== definition ||
        (definition.options.audience === 'user' &&
          entry.subscription.userId !== event.userId)
      )
        continue;
      if (definition.options.delivery === 'latest' && entry.pendingEvent) {
        entry.pendingEvent.encoded = encoded;
        metrics.coalesced += 1;
        continue;
      }
      if (state.queued >= limits.pendingMessages) {
        terminate(state.connection, 1013, 'realtime delivery backlog');
        continue;
      }
      const queuedEvent = { encoded };
      if (definition.options.delivery === 'latest')
        entry.pendingEvent = queuedEvent;
      state.queued += 1;
      const delivery = entry.delivery
        .then(async () => {
          if (entry.pendingEvent === queuedEvent)
            entry.pendingEvent = undefined;
          if (!subscriptions.has(id) || closed) return;
          try {
            await authorize(
              state.connection,
              definition,
              event.topic,
              AbortSignal.any([
                state.controller.signal,
                entry.controller.signal,
              ]),
            );
            if (
              subscriptions.get(id) !== entry ||
              definitions.get(definition.pattern) !== definition
            )
              return;
            if (sendEncoded(state.connection, queuedEvent.encoded))
              metrics.delivered += 1;
          } catch (error) {
            if (!subscriptions.has(id)) return;
            removeSubscription(id);
            sendError(state.connection, error, entry.requestId);
          }
        })
        .catch((error: unknown) => report(error, 'Realtime delivery failed.'))
        .finally(() => {
          state.queued -= 1;
          deliveries.delete(delivery);
        });
      entry.delivery = delivery;
      deliveries.add(delivery);
    }
    return Promise.resolve();
  }
  async function authorize(
    connection: RealtimeConnection,
    definition: TopicDefinition,
    topic: string,
    signal: AbortSignal,
  ): Promise<void> {
    const policy = definition.options;
    const needsIdentity = policy.audience === 'user' || policy.authenticated;
    if (needsIdentity && !connection.principal)
      throw failure(
        'AUTHENTICATION_REQUIRED',
        'Realtime topic requires authentication.',
      );
    if (
      connection.principal &&
      connection.validatePrincipal &&
      !(await checkAuthorization(connection.validatePrincipal, signal))
    ) {
      terminate(connection, 1008, 'account session expired');
      throw failure(
        'AUTHENTICATION_REQUIRED',
        'Realtime session is no longer valid.',
      );
    }
    if (
      policy.authorize &&
      !(await checkAuthorization(
        (authorizationSignal) =>
          policy.authorize!({
            principal: connection.principal,
            topic,
            params: matchTopic(definition, topic)!,
            signal: authorizationSignal,
          }),
        signal,
      ))
    ) {
      throw failure('FORBIDDEN', 'Realtime subscription is not allowed.');
    }
    if (signal.aborted) throw cancelled();
  }
  async function checkSessions(): Promise<void> {
    if (checkingSessions || closed) return;
    checkingSessions = true;
    try {
      await Promise.all(
        [...connections.values()].map(async (state) => {
          const { connection } = state;
          if (state.nextSessionCheck > Date.now()) return;
          state.nextSessionCheck = nextSessionCheck();
          if (!connection.principal || !connection.validatePrincipal) return;
          try {
            if (
              !(await checkAuthorization(
                connection.validatePrincipal,
                state.controller.signal,
              ))
            )
              terminate(connection, 1008, 'account session expired');
          } catch {
            terminate(connection, 1008, 'account session unavailable');
          }
        }),
      );
    } finally {
      checkingSessions = false;
    }
  }
  function nextSessionCheck(): number {
    return (
      Date.now() + limits.sessionCheckInterval * (0.5 + Math.random() * 0.5)
    );
  }
  async function checkAuthorization(
    callback: (signal: AbortSignal) => boolean | Promise<boolean>,
    signal: AbortSignal,
  ): Promise<boolean> {
    const started = Date.now();
    try {
      const result = await authorizeWithin(
        (inner) => gate.run(() => callback(inner), inner),
        signal,
        limits.authorizationTimeout,
      );
      if (!result) metrics.authorizationFailures += 1;
      return result;
    } catch (error) {
      metrics.authorizationFailures += 1;
      if (
        error instanceof RealtimeProtocolError &&
        error.code === 'AUTHORIZATION_TIMEOUT'
      )
        metrics.authorizationTimeouts += 1;
      throw error;
    } finally {
      metrics.authorizationDurationMs += Date.now() - started;
    }
  }
  function disconnectMatching(control: RealtimeBrokerControl): number {
    let count = 0;
    for (const { connection } of connections.values()) {
      const identity = connection.principal;
      if (
        (control.kind === 'disconnect-user'
          ? identity?.userId
          : identity?.sessionId) !== control.subjectId
      )
        continue;
      terminate(connection, 1001, 'account session revoked');
      count += 1;
    }
    return count;
  }
  async function revoke(
    kind: RealtimeBrokerControl['kind'],
    subjectId: string,
  ): Promise<number> {
    assertOpen();
    const control = { kind, subjectId, namespace, origin };
    const count = disconnectMatching(control);
    if (broker.publishControl) {
      await service.setup();
      await broker.publishControl(control);
    }
    return count;
  }
  function findSubscription(
    connection: RealtimeConnection,
    topic: string,
  ): SubscriptionState | undefined {
    for (const id of connection.subscriptions) {
      const entry = subscriptions.get(id);
      if (entry?.subscription.topic === topic) return entry;
    }
    return undefined;
  }
  function removeSubscription(id: string): void {
    const entry = subscriptions.get(id);
    if (!entry) return;
    subscriptions.delete(id);
    entry.controller.abort();
    const { topic, connectionId } = entry.subscription;
    connections.get(connectionId)?.connection.subscriptions.delete(id);
    byTopic.get(topic)?.delete(id);
    if (!byTopic.get(topic)?.size) byTopic.delete(topic);
    notify(topic);
  }
  function notify(topic: string): void {
    for (const callback of [...(listeners.get(topic) ?? [])]) {
      try {
        callback(service.subscriptionCount(topic));
      } catch (error) {
        report(error, 'Realtime subscription listener failed.');
      }
    }
  }
  function send(
    connection: RealtimeConnection,
    message: RealtimeServerMessage,
  ): void {
    sendEncoded(connection, encodeRealtimeServerMessage(message));
  }
  function sendEncoded(
    connection: RealtimeConnection,
    message: string,
  ): boolean {
    if (!connections.has(connection.id)) return false;
    if (connection.ws.readyState !== 1) {
      service.disconnect(connection);
      return false;
    }
    if (
      (connection.ws.bufferedAmount ?? 0) +
        new TextEncoder().encode(message).byteLength >
      limits.bufferedBytes
    ) {
      terminate(connection, 1013, 'realtime send buffer limit');
      return false;
    }
    try {
      connection.ws.send(message);
      return true;
    } catch (error) {
      report(error, 'Realtime socket send failed.');
      terminate(connection, 1011, 'realtime send failed');
      return false;
    }
  }
  function terminate(
    connection: RealtimeConnection,
    code: number,
    reason: string,
  ): void {
    service.disconnect(connection);
    try {
      connection.ws.close(code, reason);
    } catch (error) {
      report(error, 'Realtime socket close failed.');
    }
  }
  function sendError(
    connection: RealtimeConnection,
    error: unknown,
    id?: string,
  ): void {
    const known = error instanceof RealtimeProtocolError;
    if (!known) report(error, 'Realtime operation failed.');
    send(connection, {
      type: 'error',
      id,
      code: known ? error.code : 'REALTIME_ERROR',
      message: known ? error.message : 'Realtime operation failed.',
    });
  }
  function report(error: unknown, message: string): void {
    if (options.logger) options.logger.error({ err: error }, message);
    else console.error(message, error);
  }
  return service;
}

function failure(code: string, message: string): RealtimeProtocolError {
  return new RealtimeProtocolError(code, message);
}
function cancelled(): RealtimeProtocolError {
  return failure(
    'SUBSCRIPTION_CANCELLED',
    'Realtime subscription was cancelled.',
  );
}
