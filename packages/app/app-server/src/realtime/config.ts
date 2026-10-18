import type { RealtimeServiceOptions } from '@nocobase/realtime/server';

export interface AppRealtimeConfig {
  readonly adapter?: 'inMemory';
  readonly namespace?: string;
  readonly authorizationTimeoutMs?: number;
  readonly sessionCheckIntervalMs?: number;
  readonly limits?: {
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
  if (config.adapter !== undefined && config.adapter !== 'inMemory')
    throw new TypeError('Unsupported realtime adapter.');
  const namespace = config.namespace ?? appName;
  if (typeof namespace !== 'string' || !namespace.trim())
    throw new TypeError('Realtime namespace must be a non-empty string.');
  return {
    ...config.limits,
    namespace,
    authorizationTimeoutMs: config.authorizationTimeoutMs,
    sessionCheckIntervalMs: config.sessionCheckIntervalMs,
  };
}
