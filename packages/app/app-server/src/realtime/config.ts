import {
  createRedisRealtimeBroker,
  type RedisRealtimeBrokerOptions,
  type RealtimeServiceOptions,
} from '@nocobase/realtime/server';

export interface AppRealtimeConfig {
  readonly adapter?: 'inMemory' | 'redis';
  readonly redis?: Omit<RedisRealtimeBrokerOptions, 'namespace'>;
  readonly namespace?: string;
  readonly authorizationTimeoutMs?: number;
  readonly sessionCheckIntervalMs?: number;
  readonly limits?: {
    readonly maxConcurrentAuthorizations?: number;
    readonly maxPendingAuthorizations?: number;
    readonly maxRecentEventIds?: number;
    readonly maxConnections?: number;
    readonly maxMessageBytes?: number;
    readonly maxSubscriptionsPerConnection?: number;
    readonly maxBufferedBytesPerConnection?: number;
    readonly maxPendingMessagesPerConnection?: number;
  };
}

export function realtimeServiceOptions(
  config: AppRealtimeConfig = {},
  appName: string = 'default',
): RealtimeServiceOptions {
  if (
    config.adapter !== undefined &&
    config.adapter !== 'inMemory' &&
    config.adapter !== 'redis'
  )
    throw new TypeError('Unsupported realtime adapter.');
  const namespace = config.namespace ?? appName;
  if (typeof namespace !== 'string' || !namespace.trim())
    throw new TypeError('Realtime namespace must be a non-empty string.');
  return {
    ...config.limits,
    broker:
      config.adapter === 'redis'
        ? createRedisRealtimeBroker({ ...config.redis, namespace })
        : undefined,
    namespace,
    authorizationTimeoutMs: config.authorizationTimeoutMs,
    sessionCheckIntervalMs: config.sessionCheckIntervalMs,
  };
}
