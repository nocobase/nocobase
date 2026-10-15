import type { Logger } from '@nocobase/logging';
import { randomUUID } from 'node:crypto';

import type {
  DefinedRealtimeTopic,
  RealtimeConnection,
  RealtimeService,
  RealtimeSubscription,
  RealtimeTopicAudience,
  RealtimeTopicOptions,
} from './types.js';

import {
  encodeRealtimeServerMessage,
  parseRealtimeClientMessage,
  RealtimeProtocolError,
  validateRealtimeTopic,
  type RealtimeServerMessage,
} from '@nocobase/realtime/protocol';

const WEB_SOCKET_OPEN = 1;
const CLOSE_GOING_AWAY = 1001;

export interface RealtimeServiceOptions {
  logger?: Pick<Logger, 'error'>;
  maxSubscriptionsPerConnection?: number;
}

export type {
  RealtimeConnection,
  RealtimeConnectionContext,
  RealtimePublishResult,
  RealtimeService,
  RealtimeSubscription,
} from './types.js';

export function createRealtimeService(
  options: RealtimeServiceOptions = {},
): RealtimeService {
  const maxSubscriptionsPerConnection =
    options.maxSubscriptionsPerConnection ?? 64;
  const connections = new Map<string, RealtimeConnection>();
  const subscriptions = new Map<string, RealtimeSubscription>();
  const subscriptionsByTopic = new Map<string, Set<string>>();
  const listenersByTopic = new Map<string, Set<(count: number) => void>>();

  const service: RealtimeService = {
    connect(ws, context = {}) {
      const connection: RealtimeConnection = {
        id: randomUUID(),
        ws,
        connectedAt: new Date(),
        request: context.request,
        principal: context.principal,
        subscriptions: new Set(),
      };
      connections.set(connection.id, connection);
      return connection;
    },

    disconnect(connection) {
      const stored = connections.get(connection.id);
      if (!stored) {
        return;
      }

      removeConnectionSubscriptions(stored);
      connections.delete(stored.id);
    },

    disconnectUser(userId) {
      let disconnected = 0;
      for (const connection of Array.from(connections.values())) {
        if (connection.principal?.userId !== userId) continue;
        if (connection.ws.readyState === WEB_SOCKET_OPEN) {
          connection.ws.close(CLOSE_GOING_AWAY, 'account session revoked');
        }
        service.disconnect(connection);
        disconnected += 1;
      }
      return disconnected;
    },

    subscribe(connection, topic) {
      validateRealtimeTopic(topic);

      const existing = findSubscription(connection, { topic });
      if (existing) {
        return existing;
      }

      if (connection.subscriptions.size >= maxSubscriptionsPerConnection) {
        throw new RealtimeProtocolError(
          'TOO_MANY_SUBSCRIPTIONS',
          'Realtime connection has too many subscriptions.',
        );
      }

      const subscription: RealtimeSubscription = {
        id: randomUUID(),
        connectionId: connection.id,
        topic,
        userId: resolveSubscriptionUserId(connection, topic),
        createdAt: new Date(),
      };
      subscriptions.set(subscription.id, subscription);
      connection.subscriptions.add(subscription.id);
      addTopicSubscription(subscription);
      return subscription;
    },

    unsubscribe(connection, selector) {
      const removed: RealtimeSubscription[] = [];

      for (const subscriptionId of Array.from(connection.subscriptions)) {
        const subscription = subscriptions.get(subscriptionId);
        if (!subscription || !matchesSubscription(subscription, selector)) {
          continue;
        }

        removeSubscription(connection, subscription);
        removed.push(subscription);
      }

      return removed;
    },

    handleClientMessage(connection, data) {
      let message;
      try {
        message = parseRealtimeClientMessage(data);
      } catch (error) {
        sendProtocolError(connection, error);
        return;
      }

      try {
        switch (message.type) {
          case 'subscribe': {
            const subscription = service.subscribe(connection, message.topic);
            send(connection, {
              type: 'subscribed',
              id: message.id,
              topic: subscription.topic,
              subscriptionId: subscription.id,
            });
            return;
          }
          case 'unsubscribe': {
            const removed = service.unsubscribe(connection, {
              subscriptionId: message.subscriptionId,
              topic: message.topic,
            });
            const first = removed[0];
            send(connection, {
              type: 'unsubscribed',
              id: message.id,
              subscriptionId: message.subscriptionId ?? first?.id,
              topic: message.topic ?? first?.topic,
            });
            return;
          }
          case 'publish':
            send(connection, {
              type: 'error',
              id: message.id,
              code: 'PUBLISH_FORBIDDEN',
              message: 'Client publish is not allowed.',
            });
            return;
          case 'ping':
            send(connection, {
              type: 'pong',
              id: message.id,
            });
            return;
        }
      } catch (error) {
        sendProtocolError(connection, error);
      }
    },

    registerTopic(topic, topicDefinition) {
      validateRealtimeTopic(topic);
      if (topicOptions.has(topic)) {
        throw new RealtimeProtocolError(
          'TOPIC_ALREADY_REGISTERED',
          `Realtime topic "${topic}" is already registered.`,
        );
      }

      topicOptions.set(topic, topicDefinition);
      return () => {
        if (topicOptions.get(topic) !== topicDefinition) {
          return;
        }

        removeTopicSubscriptions(topic);
        topicOptions.delete(topic);
      };
    },

    defineTopic<Payload, Audience extends RealtimeTopicAudience>(
      topic: string,
      topicDefinition: {
        readonly audience: Audience;
        readonly authenticated?: boolean;
      },
    ): DefinedRealtimeTopic<Payload, Audience> {
      const close = service.registerTopic(topic, topicDefinition);
      const definedTopic =
        topicDefinition.audience === 'user'
          ? {
              name: topic,
              audience: 'user' as const,
              publishFor(userId: string, payload: Payload) {
                return service.publish(topic, payload, { userId });
              },
              close,
            }
          : {
              name: topic,
              audience: 'public' as const,
              publish(payload: Payload) {
                return service.publish(topic, payload);
              },
              close,
            };

      return definedTopic as DefinedRealtimeTopic<Payload, Audience>;
    },

    publish(topic, payload, options = {}) {
      validateRealtimeTopic(topic);
      const audience = topicOptions.get(topic)?.audience ?? 'public';
      const authenticated = requiresAuthentication(topic);
      if (audience === 'user' && !options.userId) {
        throw new RealtimeProtocolError(
          'USER_AUDIENCE_REQUIRED',
          `Realtime topic "${topic}" requires a user audience.`,
        );
      }
      if (audience === 'public' && options.userId) {
        throw new RealtimeProtocolError(
          'INVALID_AUDIENCE',
          `Realtime topic "${topic}" does not accept a user audience.`,
        );
      }

      const subscriptionIds = subscriptionsByTopic.get(topic);
      if (!subscriptionIds?.size) {
        return {
          topic,
          subscriberCount: 0,
        };
      }

      const message: RealtimeServerMessage = {
        type: 'event',
        topic,
        payload,
        publishedAt: new Date().toISOString(),
      };
      const sentConnections = new Set<string>();

      for (const subscriptionId of Array.from(subscriptionIds)) {
        const subscription = subscriptions.get(subscriptionId);
        const connection = subscription
          ? connections.get(subscription.connectionId)
          : undefined;
        if (
          !subscription ||
          !connection ||
          (audience === 'user' && subscription.userId !== options.userId) ||
          (authenticated && !connection.principal?.userId) ||
          sentConnections.has(connection.id)
        ) {
          continue;
        }

        if (connection.ws.readyState !== WEB_SOCKET_OPEN) {
          service.disconnect(connection);
          continue;
        }

        sentConnections.add(connection.id);
        send(connection, message);
      }

      return {
        topic,
        subscriberCount: sentConnections.size,
      };
    },

    subscriptionCount(topic) {
      return subscriptionsByTopic.get(topic)?.size ?? 0;
    },

    onTopicSubscriptionChange(topic, listener) {
      validateRealtimeTopic(topic);

      const listeners =
        listenersByTopic.get(topic) ?? new Set<(count: number) => void>();
      listeners.add(listener);
      listenersByTopic.set(topic, listeners);

      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          listenersByTopic.delete(topic);
        }
      };
    },

    close() {
      for (const connection of Array.from(connections.values())) {
        if (connection.ws.readyState === WEB_SOCKET_OPEN) {
          connection.ws.close(CLOSE_GOING_AWAY, 'realtime service closed');
        }

        service.disconnect(connection);
      }

      subscriptions.clear();
      subscriptionsByTopic.clear();
      listenersByTopic.clear();
      topicOptions.clear();
    },
  };

  const topicOptions = new Map<string, RealtimeTopicOptions>();

  function findSubscription(
    connection: RealtimeConnection,
    selector: { subscriptionId?: string; topic?: string },
  ): RealtimeSubscription | undefined {
    for (const subscriptionId of connection.subscriptions) {
      const subscription = subscriptions.get(subscriptionId);
      if (subscription && matchesSubscription(subscription, selector)) {
        return subscription;
      }
    }

    return undefined;
  }

  function matchesSubscription(
    subscription: RealtimeSubscription,
    selector: { subscriptionId?: string; topic?: string },
  ): boolean {
    return (
      (selector.subscriptionId === undefined ||
        subscription.id === selector.subscriptionId) &&
      (selector.topic === undefined || subscription.topic === selector.topic)
    );
  }

  function addTopicSubscription(subscription: RealtimeSubscription): void {
    const previousCount = service.subscriptionCount(subscription.topic);
    const topicSubscriptions =
      subscriptionsByTopic.get(subscription.topic) ?? new Set<string>();
    topicSubscriptions.add(subscription.id);
    subscriptionsByTopic.set(subscription.topic, topicSubscriptions);
    notifyTopicSubscriptionChange(subscription.topic, previousCount);
  }

  function removeConnectionSubscriptions(connection: RealtimeConnection): void {
    for (const subscriptionId of Array.from(connection.subscriptions)) {
      const subscription = subscriptions.get(subscriptionId);
      if (subscription) {
        removeSubscription(connection, subscription);
      }
    }
  }

  function removeTopicSubscriptions(topic: string): void {
    const subscriptionIds = subscriptionsByTopic.get(topic);
    if (!subscriptionIds) {
      return;
    }

    for (const subscriptionId of Array.from(subscriptionIds)) {
      const subscription = subscriptions.get(subscriptionId);
      const connection = subscription
        ? connections.get(subscription.connectionId)
        : undefined;
      if (subscription && connection) {
        removeSubscription(connection, subscription);
      }
    }
  }

  function resolveSubscriptionUserId(
    connection: RealtimeConnection,
    topic: string,
  ): string | undefined {
    if (!requiresAuthentication(topic)) {
      return undefined;
    }

    const userId = connection.principal?.userId;
    if (!userId) {
      throw new RealtimeProtocolError(
        'AUTHENTICATION_REQUIRED',
        `Realtime topic "${topic}" requires authentication.`,
      );
    }
    return userId;
  }

  /** User topics, and public topics registered with `authenticated`, reach only connections with a principal. */
  function requiresAuthentication(topic: string): boolean {
    const definition = topicOptions.get(topic);
    return (
      definition?.audience === 'user' || definition?.authenticated === true
    );
  }

  function removeSubscription(
    connection: RealtimeConnection,
    subscription: RealtimeSubscription,
  ): void {
    const previousCount = service.subscriptionCount(subscription.topic);
    connection.subscriptions.delete(subscription.id);
    subscriptions.delete(subscription.id);

    const topicSubscriptions = subscriptionsByTopic.get(subscription.topic);
    topicSubscriptions?.delete(subscription.id);
    if (topicSubscriptions?.size === 0) {
      subscriptionsByTopic.delete(subscription.topic);
    }
    notifyTopicSubscriptionChange(subscription.topic, previousCount);
  }

  function notifyTopicSubscriptionChange(
    topic: string,
    previousCount: number,
  ): void {
    const count = service.subscriptionCount(topic);
    if (count === previousCount) {
      return;
    }

    const listeners = listenersByTopic.get(topic);
    if (!listeners) {
      return;
    }

    for (const listener of Array.from(listeners)) {
      try {
        listener(count);
      } catch (error) {
        if (options.logger)
          options.logger.error(
            { err: error },
            'Realtime subscription listener failed',
          );
        else console.error(error);
      }
    }
  }

  function sendProtocolError(
    connection: RealtimeConnection,
    error: unknown,
  ): void {
    const code =
      error instanceof RealtimeProtocolError ? error.code : 'REALTIME_ERROR';
    const message =
      error instanceof Error ? error.message : 'Realtime message failed.';
    send(connection, {
      type: 'error',
      code,
      message,
    });
  }

  function send(
    connection: RealtimeConnection,
    message: RealtimeServerMessage,
  ): void {
    if (connection.ws.readyState !== WEB_SOCKET_OPEN) {
      service.disconnect(connection);
      return;
    }

    connection.ws.send(encodeRealtimeServerMessage(message));
  }

  return service;
}
