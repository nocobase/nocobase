import type { RealtimeServiceOptions } from '@nocobase/realtime/server';
import {
  createRealtimeBrokerRegistry,
  type RealtimeBrokerRegistry,
} from './broker-registry.js';

export interface AppRealtimeConfig {
  readonly [key: string]: unknown;
  readonly adapter?: string;
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

/** Extension-specific values are validated only by the selected factory. */
export function realtimeServiceOptions(
  config: AppRealtimeConfig = {},
  appName: string = 'default',
  registry: RealtimeBrokerRegistry = createRealtimeBrokerRegistry(),
  logger?: RealtimeServiceOptions['logger'],
): RealtimeServiceOptions {
  if (typeof config !== 'object' || config === null || Array.isArray(config))
    throw new TypeError('Realtime configuration must be an object.');
  const namespace = config.namespace ?? appName;
  if (typeof namespace !== 'string' || !namespace.trim())
    throw new TypeError('Realtime namespace must be a non-empty string.');
  const adapter = config.adapter === undefined ? 'inMemory' : config.adapter;
  if (
    config.limits !== undefined &&
    (typeof config.limits !== 'object' ||
      config.limits === null ||
      Array.isArray(config.limits))
  )
    throw new TypeError('Realtime limits must be an object.');
  return {
    ...config.limits,
    broker: registry.create(adapter, { namespace, config, logger }),
    namespace,
    authorizationTimeoutMs: config.authorizationTimeoutMs,
    sessionCheckIntervalMs: config.sessionCheckIntervalMs,
  };
}
